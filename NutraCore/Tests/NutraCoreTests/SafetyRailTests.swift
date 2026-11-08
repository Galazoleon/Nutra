import XCTest
@testable import NutraCore

/// The hard safety rules. These must never fail.
final class SafetyRailTests: XCTestCase {
    var data: NutraData!

    override func setUpWithError() throws {
        data = try NutraData.load()
    }

    func adult(sex: Sex = .female, weight: Double = 70, height: Double = 165, age: Int = 30,
               activity: ActivityLevel = .light) -> Profile {
        Profile(name: "Test", age: age, sex: sex, heightCm: height, weightKg: weight, activity: activity)
    }

    func testUnder18GetsNoCaloriesAndNoWeightChange() {
        for age in 5...17 {
            for goal in data.goals {
                var person = adult(age: age)
                person.age = age
                let targets = TargetsEngine.targets(for: [goal], profile: person)
                XCTAssertNil(targets.calories, "age \(age) goal \(goal.id)")
                XCTAssertFalse(targets.weightChangeAllowed, "age \(age) goal \(goal.id)")
                XCTAssertTrue(targets.notices.contains(.under18))
            }
        }
    }

    func testPregnancyGetsNoCaloriesAndNoWeightChange() {
        for goal in data.goals {
            var person = adult()
            person.isPregnant = true
            let targets = TargetsEngine.targets(for: [goal], profile: person)
            XCTAssertNil(targets.calories, goal.id)
            XCTAssertFalse(targets.weightChangeAllowed, goal.id)
            XCTAssertTrue(targets.notices.contains(.pregnancy))
        }
    }

    func testProtectedPeopleAreForcedIntoGentleMode() {
        var teen = adult(age: 15)
        teen.displayStyle = .standard
        XCTAssertEqual(teen.effectiveDisplayStyle, .gentle)
        var pregnant = adult()
        pregnant.isPregnant = true
        XCTAssertEqual(pregnant.effectiveDisplayStyle, .gentle)
    }

    func testAgeCommitRule() {
        XCTAssertNil(AgeGroup.from(age: 4))
        XCTAssertEqual(AgeGroup.from(age: 5), .under18)
        XCTAssertEqual(AgeGroup.from(age: 17), .under18)
        XCTAssertEqual(AgeGroup.from(age: 18), .adult)
    }

    func testCalorieFloorsAreNeverCrossed() {
        let small = data.goals.filter { $0.direction == .lose }
        XCTAssertFalse(small.isEmpty)
        for goal in small {
            let woman = adult(sex: .female, weight: 42, height: 148, age: 70, activity: .resting)
            XCTAssertGreaterThanOrEqual(TargetsEngine.targets(for: [goal], profile: woman).calories ?? 0, 1200)
            let man = adult(sex: .male, weight: 48, height: 155, age: 75, activity: .resting)
            XCTAssertGreaterThanOrEqual(TargetsEngine.targets(for: [goal], profile: man).calories ?? 0, 1500)
            let other = adult(sex: .unspecified, weight: 45, height: 150, age: 75, activity: .resting)
            XCTAssertGreaterThanOrEqual(TargetsEngine.targets(for: [goal], profile: other).calories ?? 0, 1500)
        }
    }

    func testNoRapidCuts() throws {
        let aggressive = Goal(id: "x", title: "x", category: .body, blurb: "", direction: .lose,
                              calorieAdjustPercent: -50, modules: [], gentleModules: [])
        let person = adult(sex: .male, weight: 110, height: 185, age: 30, activity: .active)
        let maintenance = TargetsEngine.restingEnergy(sex: .male, weightKg: 110, heightCm: 185, age: 30)
            * ActivityLevel.active.factor
        let calories = Double(try XCTUnwrap(TargetsEngine.targets(for: [aggressive], profile: person).calories))
        XCTAssertLessThanOrEqual(maintenance - calories, TargetsEngine.maxDeficitKcal + 10)
    }

    func testCombatSportsNotice() throws {
        let goal = try XCTUnwrap(data.goal(id: "combat-sports"))
        let targets = TargetsEngine.targets(for: [goal], profile: adult())
        XCTAssertTrue(targets.notices.contains(.combatSports))
        XCTAssertFalse(targets.weightChangeAllowed)
    }

    func testMissingDetailsGiveNoNumbers() throws {
        let goal = try XCTUnwrap(data.goal(id: "maintain"))
        let targets = TargetsEngine.targets(for: [goal], profile: Profile(name: "A"))
        XCTAssertNil(targets.calories)
    }

    func testNormalAdultGetsSensibleNumbers() throws {
        let goal = try XCTUnwrap(data.goal(id: "maintain"))
        let targets = TargetsEngine.targets(for: [goal], profile: adult(sex: .female))
        let calories = try XCTUnwrap(targets.calories)
        XCTAssertTrue((1600...2400).contains(calories), "\(calories)")
        XCTAssertNotNil(targets.proteinGrams)
        XCTAssertGreaterThanOrEqual(targets.fiberGrams ?? 0, 25)
    }

    func testTrendNeedsFourteenDays() {
        var person = adult()
        let start = Date(timeIntervalSince1970: 0)
        let tenDays = (0..<10).map { TrendAdvisor.WeighIn(date: start.addingTimeInterval(Double($0) * 86_400), kg: 80 - Double($0)) }
        XCTAssertEqual(TrendAdvisor.advice(for: tenDays, direction: .lose, profile: person), .needMoreDays)

        let fast = (0..<15).map { TrendAdvisor.WeighIn(date: start.addingTimeInterval(Double($0) * 86_400), kg: 80 - Double($0) * 0.3) }
        XCTAssertEqual(TrendAdvisor.advice(for: fast, direction: .lose, profile: person), .tooFast)

        let steady = (0..<15).map { TrendAdvisor.WeighIn(date: start.addingTimeInterval(Double($0) * 86_400), kg: 80 - Double($0) * 0.05) }
        XCTAssertEqual(TrendAdvisor.advice(for: steady, direction: .lose, profile: person), .steady)

        person.age = 16
        XCTAssertEqual(TrendAdvisor.advice(for: fast, direction: .lose, profile: person), .needMoreDays)
    }

    func testTrendNeverSuggestsEatingLess() {
        for advice in [TrendAdvisor.Advice.needMoreDays, .steady, .tooFast, .notMoving] {
            let text = advice.message.lowercased()
            XCTAssertFalse(text.contains("eat less"))
            XCTAssertFalse(text.contains("cut"))
        }
    }
}

final class GoalRuleTests: XCTestCase {
    func testProtectedPeopleCannotKeepWeightChangeGoals() throws {
        let data = try NutraData.load()
        let teen = Profile(name: "T", age: 14)
        XCTAssertEqual(GoalRules.allowedGoalIDs(["lose-weight"], goals: data.goals, profile: teen), ["more-energy"])
        XCTAssertEqual(GoalRules.allowedGoalIDs(["gain-weight", "running"], goals: data.goals, profile: teen), ["running"])
        XCTAssertNotNil(data.goal(id: GoalRules.protectedFallbackGoalID))
        let adult = Profile(name: "A", age: 30)
        XCTAssertEqual(GoalRules.allowedGoalIDs(["lose-weight"], goals: data.goals, profile: adult), ["lose-weight"])
    }
}

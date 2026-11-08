import XCTest
@testable import NutraCore

/// The banned-token test: in gentle mode, no dashboard view model may contain a number.
final class GentleModeTests: XCTestCase {
    func sampleMeals(_ data: NutraData) -> [MealEntry] {
        let parser = FoodParser(builtIn: data.foods)
        let breakfast = parser.parse("2 eggs, toast and a banana").items
        let lunch = parser.parse("chicken, rice, broccoli and fries").items
        let date = Date()
        return [MealEntry(date: date, slot: .breakfast, items: breakfast, source: .typed),
                MealEntry(date: date, slot: .lunch, items: lunch, source: .typed)]
    }

    func testEveryGoalInGentleModeHasNoNumbers() throws {
        let data = try NutraData.load()
        let mealSets = [[], sampleMeals(data)]
        var people = [Profile(name: "G", age: 30, sex: .female, heightCm: 165, weightKg: 70, displayStyle: .gentle),
                      Profile(name: "Teen", age: 15, displayStyle: .standard)]
        var pregnant = Profile(name: "P", age: 30, sex: .female, heightCm: 165, weightKg: 70)
        pregnant.isPregnant = true
        people.append(pregnant)

        for person in people {
            for goal in data.goals {
                let targets = TargetsEngine.targets(for: [goal], profile: person)
                for meals in mealSets {
                    let input = DashboardInput(profile: person, goals: [goal], targets: targets, todaysMeals: meals)
                    let cards = DashboardBuilder.cards(for: input)
                    XCTAssertFalse(cards.isEmpty, goal.id)
                    for card in cards {
                        XCTAssertNotEqual(card.kind, .weightTrend, "\(goal.id) shows weight trend in gentle mode")
                        for text in card.allText {
                            XCTAssertFalse(GentleMode.leaksNumbers(text),
                                           "Gentle leak in goal \(goal.id), card \(card.kind): \(text)")
                        }
                    }
                }
            }
        }
    }

    func testStandardModeShowsNumbers() throws {
        let data = try NutraData.load()
        let goal = try XCTUnwrap(data.goal(id: "lose-weight"))
        let person = Profile(name: "S", age: 35, sex: .male, heightCm: 180, weightKg: 85)
        let targets = TargetsEngine.targets(for: [goal], profile: person)
        let cards = DashboardBuilder.cards(for: DashboardInput(profile: person, goals: [goal], targets: targets,
                                                               todaysMeals: sampleMeals(data)))
        let energy = try XCTUnwrap(cards.first { $0.kind == .energy })
        XCTAssertTrue(GentleMode.leaksNumbers(energy.headline))
    }

    func testEachGoalHasItsOwnDashboardInBothModes() throws {
        let data = try NutraData.load()
        let standard = Profile(name: "S", age: 35, sex: .male, heightCm: 180, weightKg: 85)
        var gentle = standard
        gentle.displayStyle = .gentle
        for person in [standard, gentle] {
            for goal in data.goals {
                let cards = DashboardBuilder.cards(for: DashboardInput(
                    profile: person, goals: [goal],
                    targets: TargetsEngine.targets(for: [goal], profile: person), todaysMeals: []))
                XCTAssertGreaterThanOrEqual(cards.count, 2, goal.id)
                XCTAssertEqual(Set(cards.map(\.kind)).count, cards.count, "duplicate modules in \(goal.id)")
            }
        }
    }

    func testOverTargetIsNeverPunishing() throws {
        let data = try NutraData.load()
        let goal = try XCTUnwrap(data.goal(id: "lose-weight"))
        let person = Profile(name: "S", age: 35, sex: .male, heightCm: 180, weightKg: 85)
        let food = try XCTUnwrap(data.foods.first { $0.id == "pizza" })
        let feast = [MealEntry(date: Date(), slot: .dinner, items: [LoggedItem(food: food, portions: 20)], source: .typed)]
        let cards = DashboardBuilder.cards(for: DashboardInput(
            profile: person, goals: [goal], targets: TargetsEngine.targets(for: [goal], profile: person),
            todaysMeals: feast))
        let energy = try XCTUnwrap(cards.first { $0.kind == .energy })
        XCTAssertEqual(energy.progress, 1)
        for word in ["over", "exceeded", "too much", "bad", "failed", "warning"] {
            XCTAssertFalse(energy.detail.lowercased().contains(word), word)
        }
    }

    func testInsightNeverContainsNumbers() throws {
        let data = try NutraData.load()
        let parser = FoodParser(builtIn: data.foods)
        for text in ["2 eggs", "pizza and soda", "salmon, rice and broccoli", "fries", ""] {
            let parsed = parser.parse(text)
            let analysis = MealAnalyzer.analyze(items: parsed.items, source: .typed, profile: Profile())
            XCTAssertFalse(GentleMode.leaksNumbers(analysis.insight), analysis.insight)
            let sentences = analysis.insight.split(separator: ".").filter {
                !$0.trimmingCharacters(in: .whitespaces).isEmpty
            }
            XCTAssertEqual(sentences.count, 2, analysis.insight)
        }
    }
}

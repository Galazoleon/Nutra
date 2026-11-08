import XCTest
@testable import NutraCore

final class DataTests: XCTestCase {
    func testDataLoadsAndValidates() throws {
        let data = try NutraData.load()
        XCTAssertEqual(data.foods.count, 58)
        XCTAssertEqual(data.goals.count, 37)
        XCTAssertEqual(data.recipes.count, 32)
        XCTAssertEqual(data.coach.count, 14)
        XCTAssertEqual(data.validate(), [])
    }

    func testEveryCategoryHasGoalsAndSomeArePopular() throws {
        let data = try NutraData.load()
        for category in GoalCategory.allCases {
            XCTAssertFalse(data.goals.filter { $0.category == category }.isEmpty, category.rawValue)
        }
        XCTAssertTrue((4...8).contains(data.goals.filter(\.isPopular).count))
    }

    func testBuiltInFoodsAreLabeledEstimates() throws {
        let data = try NutraData.load()
        XCTAssertTrue(data.foods.allSatisfy { $0.source == .builtInEstimate })
        XCTAssertEqual(FoodSource.userMade.label, "Your food, not verified")
    }

    func testOldProfileStillDecodes() throws {
        let old = #"{"name":"Sam","age":40}"#.data(using: .utf8)!
        let profile = try JSONDecoder().decode(Profile.self, from: old)
        XCTAssertEqual(profile.name, "Sam")
        XCTAssertFalse(profile.completedOnboarding)
        XCTAssertEqual(profile.equipment, .bodyweight)
    }
}

final class ParserTests: XCTestCase {
    var parser: FoodParser!

    override func setUpWithError() throws {
        parser = FoodParser(builtIn: try NutraData.load().foods)
    }

    func testQuantitiesAndSeparators() {
        let result = parser.parse("2 eggs, a slice of toast and a coffee")
        XCTAssertEqual(result.items.map(\.food.id), ["egg", "bread", "coffee"])
        XCTAssertEqual(result.items.map(\.portions), [2, 1, 1])
        XCTAssertEqual(result.unrecognized, [])
    }

    func testGramsAndFractions() {
        let result = parser.parse("240g chicken breast; half an avocado; 1/2 cup rice")
        XCTAssertEqual(result.items.map(\.food.id), ["chicken-breast", "avocado", "white-rice"])
        XCTAssertEqual(result.items.map(\.portions), [2, 0.5, 0.5])
    }

    func testLongestMatchWins() {
        XCTAssertEqual(parser.parse("sweet potato").items.first?.food.id, "sweet-potato")
        XCTAssertEqual(parser.parse("potato").items.first?.food.id, "potato")
    }

    func testUnknownPhrasesBecomeChips() {
        let result = parser.parse("eggs and dragonfruit")
        XCTAssertEqual(result.items.map(\.food.id), ["egg"])
        XCTAssertEqual(result.unrecognized, ["dragonfruit"])
    }

    func testUserFoodsAreIncludedAndWin() throws {
        let mine = Food(id: "user-grandmas-stew", name: "Grandma's stew", aliases: ["stew"], portionName: "bowl",
                        portionGrams: 300, group: .mixed, nutrients: Nutrients(calories: 400, protein: 25, carbs: 30, fat: 18),
                        source: .userMade)
        let userParser = FoodParser(builtIn: try NutraData.load().foods, userFoods: [mine])
        let result = userParser.parse("2 bowls of stew")
        XCTAssertEqual(result.items.first?.food.id, "user-grandmas-stew")
        XCTAssertEqual(result.items.first?.portions, 2)
        XCTAssertEqual(result.items.first?.food.source.label, "Your food, not verified")
    }
}

final class AnalyzerTests: XCTestCase {
    func testTotalsGlycemicAndAllergens() throws {
        let data = try NutraData.load()
        let parser = FoodParser(builtIn: data.foods)
        let items = parser.parse("2 eggs, toast and fries").items
        var person = Profile()
        person.allergens = [.egg]
        let analysis = MealAnalyzer.analyze(items: items, source: .typed, profile: person)
        XCTAssertEqual(analysis.totals.calories, 72 * 2 + 80 + 365, accuracy: 0.01)
        XCTAssertNotNil(analysis.glycemicIndex)
        XCTAssertGreaterThan(analysis.glycemicLoad, 0)
        XCTAssertTrue(analysis.allergens.contains(.egg))
        XCTAssertTrue(analysis.allergens.contains(.wheat))
        XCTAssertEqual(analysis.personalAllergenWarnings, [.egg])
        XCTAssertTrue(analysis.hasFried)
        XCTAssertEqual(analysis.confidence, .high)
        XCTAssertGreaterThan(analysis.percentDailyValue(.vitaminD), 0)
    }

    func testPhotoIsLowConfidence() throws {
        let data = try NutraData.load()
        let items = FoodParser(builtIn: data.foods).parse("salad").items
        XCTAssertEqual(MealAnalyzer.analyze(items: items, source: .photo, profile: Profile()).confidence, .low)
    }
}

final class PlannerTests: XCTestCase {
    func testMulberry32MatchesPrototype() {
        // Reference values computed with the JavaScript original.
        var rng = Mulberry32(seed: 42)
        XCTAssertEqual(rng.next(), 0.6011037519201636, accuracy: 1e-15)
        XCTAssertEqual(rng.next(), 0.44829055899754167, accuracy: 1e-15)
        XCTAssertEqual(rng.next(), 0.8524657934904099, accuracy: 1e-15)
        var one = Mulberry32(seed: 1)
        XCTAssertEqual(one.next(), 0.6270739405881613, accuracy: 1e-15)
    }

    func request(_ diet: DietStyle = .none, avoid: [Allergen] = [], seed: UInt32 = 7) -> PlannerRequest {
        PlannerRequest(energyTarget: 2000, diet: diet, avoid: avoid, maxMinutes: 45, hasOven: true, seed: seed)
    }

    func testPlanIsReproducibleAndComplete() throws {
        let recipes = try NutraData.load().recipes
        let first = MealPlanner.planDay(recipes: recipes, request: request())
        let second = MealPlanner.planDay(recipes: recipes, request: request())
        XCTAssertEqual(first, second)
        XCTAssertEqual(first.meals.map(\.slot), MealSlot.allCases)
        XCTAssertEqual(first.totals.calories, 2000, accuracy: 400)
    }

    func testPlannerRespectsAllergiesDietOvenAndTime() throws {
        let recipes = try NutraData.load().recipes
        for diet in DietStyle.allCases {
            var req = request(diet, avoid: [.peanut, .fish])
            req.hasOven = false
            req.maxMinutes = 20
            let plan = MealPlanner.planDay(recipes: recipes, request: req)
            for meal in plan.meals {
                XCTAssertFalse(meal.recipe.allergens.contains(.peanut))
                XCTAssertFalse(meal.recipe.allergens.contains(.fish))
                XCTAssertFalse(meal.recipe.needsOven)
                XCTAssertLessThanOrEqual(meal.recipe.minutes, 20)
                if diet != .none { XCTAssertTrue(meal.recipe.diets.contains(diet)) }
            }
        }
    }

    func testWeekAndShoppingList() throws {
        let recipes = try NutraData.load().recipes
        let week = MealPlanner.planWeek(recipes: recipes, request: request())
        XCTAssertEqual(week.count, 7)
        let list = ShoppingList.build(from: week)
        XCTAssertFalse(list.isEmpty)
        XCTAssertEqual(list.map(\.aisle), list.map(\.aisle).sorted())
        let all = list.flatMap(\.items)
        XCTAssertEqual(Set(all.map(\.id)).count, all.count, "shopping list has duplicate lines")
    }

    func testWorkoutPlansForEveryDayCountAndEquipment() throws {
        let library = try NutraData.load().exercises
        for days in 2...6 {
            for equipment in Equipment.allCases {
                let plan = WorkoutPlanner.plan(days: days, equipment: equipment, focus: .general, library: library)
                XCTAssertEqual(plan.count, days)
                for day in plan {
                    XCTAssertGreaterThanOrEqual(day.blocks.count, 3, "\(days) days, \(equipment)")
                    XCTAssertTrue(day.blocks.allSatisfy { $0.exercise.equipment.contains(equipment) })
                }
            }
        }
    }
}

final class CoachTests: XCTestCase {
    func testMatchesSafetyAndFallback() throws {
        let coach = CoachEngine(entries: try NutraData.load().coach)
        XCTAssertEqual(coach.reply(to: "How much protein do I need?").entryID, "protein-amount")
        XCTAssertEqual(coach.reply(to: "what snack is good when hungry").entryID, "snacks")
        XCTAssertEqual(coach.reply(to: "Can you diagnose my stomach pain?").kind, .safety)
        XCTAssertEqual(coach.reply(to: "I want to starve myself").kind, .safety)
        XCTAssertEqual(coach.reply(to: "zzz qqq").kind, .fallback)
    }

    func testEveryCoachQuestionMatchesItself() throws {
        let entries = try NutraData.load().coach
        let coach = CoachEngine(entries: entries)
        for entry in entries {
            XCTAssertEqual(coach.reply(to: entry.question).entryID, entry.id, entry.question)
        }
    }

    func testPainRuleTextIsPresent() {
        XCTAssertTrue(Disclaimers.injuryPainRule.contains("3 out of 10"))
        XCTAssertTrue(Disclaimers.injuryPainRule.contains("cannot diagnose"))
    }
}

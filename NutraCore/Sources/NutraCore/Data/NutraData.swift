import Foundation

/// All of Nutra's built-in content, loaded from the JSON files in Resources.
/// Adding a goal, recipe, exercise or coach answer is a data-only change.
public struct NutraData: Sendable {
    public var foods: [Food]
    public var goals: [Goal]
    public var recipes: [Recipe]
    public var exercises: [Exercise]
    public var rehabAreas: [RehabArea]
    public var coach: [CoachEntry]

    public init(foods: [Food], goals: [Goal], recipes: [Recipe], exercises: [Exercise],
                rehabAreas: [RehabArea], coach: [CoachEntry]) {
        self.foods = foods
        self.goals = goals
        self.recipes = recipes
        self.exercises = exercises
        self.rehabAreas = rehabAreas
        self.coach = coach
    }

    public enum LoadError: Error, CustomStringConvertible {
        case missing(String)
        case invalid(String, Error)
        public var description: String {
            switch self {
            case .missing(let file): return "Missing data file \(file).json"
            case .invalid(let file, let error): return "Could not read \(file).json: \(error)"
            }
        }
    }

    /// Loads every file from the package bundle. Call off the main thread.
    public static func load(bundle: Bundle? = nil) throws -> NutraData {
        let resources = bundle ?? .module
        return NutraData(
            foods: try decode([FoodRecord].self, "foods", resources).map(\.food),
            goals: try decode([Goal].self, "goals", resources),
            recipes: try decode([Recipe].self, "recipes", resources),
            exercises: try decode([Exercise].self, "exercises", resources),
            rehabAreas: try decode([RehabArea].self, "rehab", resources),
            coach: try decode([CoachEntry].self, "coach", resources)
        )
    }

    static func decode<T: Decodable>(_ type: T.Type, _ name: String, _ bundle: Bundle) throws -> T {
        guard let url = bundle.url(forResource: name, withExtension: "json") else {
            throw LoadError.missing(name)
        }
        do {
            return try JSONDecoder().decode(T.self, from: Data(contentsOf: url))
        } catch {
            throw LoadError.invalid(name, error)
        }
    }

    public func goal(id: String) -> Goal? { goals.first { $0.id == id } }
    public func goals(ids: [String]) -> [Goal] { ids.compactMap(goal(id:)) }

    /// Checks the data for mistakes. Returns plain-language problems (empty means fine).
    /// The app runs this at launch in debug builds; the tests run it every time.
    public func validate() -> [String] {
        var problems: [String] = []
        func duplicates(_ ids: [String], _ label: String) {
            let counts = Dictionary(grouping: ids, by: { $0 }).filter { $0.value.count > 1 }
            for id in counts.keys.sorted() { problems.append("Duplicate \(label) id: \(id)") }
        }
        duplicates(foods.map(\.id), "food")
        duplicates(goals.map(\.id), "goal")
        duplicates(recipes.map(\.id), "recipe")
        duplicates(exercises.map(\.id), "exercise")
        duplicates(coach.map(\.id), "coach")

        for food in foods {
            let n = food.nutrients
            if n.calories < 0 || n.protein < 0 || n.carbs < 0 || n.fat < 0 || n.fiber < 0 {
                problems.append("Negative value in food \(food.id)")
            }
            let fromMacros = n.protein * 4 + n.carbs * 4 + n.fat * 9
            if n.calories > 20, abs(fromMacros - n.calories) / n.calories > 0.35 {
                problems.append("Food \(food.id): calories do not match macros")
            }
            if let gi = food.glycemicIndex, !(0...110).contains(gi) {
                problems.append("Food \(food.id): glycemic index out of range")
            }
        }
        for goal in goals {
            for module in goal.modules + goal.gentleModules where ModuleKind(rawValue: module) == nil {
                problems.append("Goal \(goal.id): unknown module \(module)")
            }
            if goal.gentleModules.contains("weightTrend") || goal.gentleModules.contains("energy") {
                problems.append("Goal \(goal.id): gentle modules must not show numbers")
            }
        }
        for recipe in recipes {
            if recipe.steps.isEmpty { problems.append("Recipe \(recipe.id) has no steps") }
            if recipe.ingredients.isEmpty { problems.append("Recipe \(recipe.id) has no ingredients") }
            if recipe.slots.isEmpty { problems.append("Recipe \(recipe.id) has no meal slot") }
        }
        return problems
    }
}

/// Compact on-disk shape of a food, so foods.json stays readable.
struct FoodRecord: Decodable {
    var id: String
    var name: String
    var aliases: [String]?
    var portion: String
    var grams: Double
    var group: FoodGroup
    var kcal: Double
    var protein: Double
    var carbs: Double
    var fat: Double
    var fiber: Double
    var gi: Int?
    var micros: [String: Double]?
    var allergens: [Allergen]?
    var fried: Bool?

    var food: Food {
        Food(id: id, name: name, aliases: aliases ?? [], portionName: portion, portionGrams: grams,
             group: group,
             nutrients: Nutrients(calories: kcal, protein: protein, carbs: carbs, fat: fat,
                                  fiber: fiber, micros: micros ?? [:]),
             glycemicIndex: gi, allergens: allergens ?? [], isFried: fried ?? false,
             source: .builtInEstimate)
    }
}

import Foundation

public struct Ingredient: Codable, Hashable, Sendable {
    public var name: String
    public var amount: Double
    public var unit: String
    /// Store section for the shopping list, e.g. "Produce".
    public var aisle: String

    public init(name: String, amount: Double, unit: String, aisle: String) {
        self.name = name
        self.amount = amount
        self.unit = unit
        self.aisle = aisle
    }
}

/// A recipe from recipes.json. Nutrients are per serving and are estimates.
public struct Recipe: Codable, Hashable, Sendable, Identifiable {
    public var id: String
    public var name: String
    public var slots: [MealSlot]
    public var minutes: Int
    public var needsOven: Bool
    /// Diet styles this recipe fits. Empty means "fits no particular style only".
    public var diets: [DietStyle]
    public var allergens: [Allergen]
    public var nutrients: Nutrients
    public var ingredients: [Ingredient]
    public var steps: [String]
    public var swapTip: String?
}

public struct PlannedMeal: Sendable, Hashable, Identifiable {
    public var slot: MealSlot
    public var recipe: Recipe
    /// Serving multiplier, one of `MealPlanner.scales`.
    public var scale: Double
    public var id: String { slot.rawValue + recipe.id }
    public var nutrients: Nutrients { recipe.nutrients.scaled(by: scale) }
}

public struct DayPlan: Sendable, Hashable {
    public var meals: [PlannedMeal]
    public var totals: Nutrients { meals.reduce(Nutrients.zero) { $0 + $1.nutrients } }
}

public struct PlannerRequest: Sendable {
    public var energyTarget: Double
    public var diet: DietStyle
    public var avoid: [Allergen]
    public var maxMinutes: Int
    public var hasOven: Bool
    public var seed: UInt32

    public init(energyTarget: Double, diet: DietStyle, avoid: [Allergen],
                maxMinutes: Int, hasOven: Bool, seed: UInt32) {
        self.energyTarget = energyTarget
        self.diet = diet
        self.avoid = avoid
        self.maxMinutes = maxMinutes
        self.hasOven = hasOven
        self.seed = seed
    }

    /// Build a request from a profile. Protected people and gentle mode still get
    /// meals; the planner just uses a typical day size internally and never shows it.
    public init(profile: Profile, targets: Targets, seed: UInt32) {
        self.init(energyTarget: Double(targets.calories ?? 2000), diet: profile.diet,
                  avoid: profile.allergens, maxMinutes: profile.cookingMinutes,
                  hasOven: profile.hasOven, seed: seed)
    }
}

/// Builds breakfast, lunch, dinner and a snack that fit the person.
/// Deterministic: the same request and seed always give the same plan.
// NOTE: reconcile slot budgets, scales, scoring and tuneDay with Part 4 once it is in docs/.
public enum MealPlanner {
    public static let slotBudgets: [MealSlot: Double] = [
        .breakfast: 0.25, .lunch: 0.30, .dinner: 0.35, .snack: 0.10
    ]
    public static let scales: [Double] = [0.75, 1.0, 1.25, 1.5]

    /// Recipes this person can actually eat and make.
    public static func eligible(_ recipes: [Recipe], for request: PlannerRequest) -> [Recipe] {
        recipes.filter { recipe in
            recipe.allergens.allSatisfy { !request.avoid.contains($0) }
                && recipe.minutes <= max(request.maxMinutes, 10)
                && (request.hasOven || !recipe.needsOven)
                && fits(recipe, diet: request.diet)
        }
    }

    /// "No particular style" gets everything except recipes made only for the carnivore style.
    static func fits(_ recipe: Recipe, diet: DietStyle) -> Bool {
        if diet == .none { return recipe.diets != [.carnivore] }
        return recipe.diets.contains(diet)
    }

    public static func planDay(recipes: [Recipe], request: PlannerRequest) -> DayPlan {
        var rng = Mulberry32(seed: request.seed)
        let pool = eligible(recipes, for: request)
        var meals: [PlannedMeal] = []
        var used = Set<String>()
        for slot in MealSlot.allCases {
            let budget = request.energyTarget * (slotBudgets[slot] ?? 0.25)
            let candidates = pool.filter { $0.slots.contains(slot) && !used.contains($0.id) }
            guard !candidates.isEmpty else { continue }
            var best: (meal: PlannedMeal, score: Double)?
            for recipe in candidates {
                let jitter = rng.next() * 0.15
                for scale in scales {
                    let meal = PlannedMeal(slot: slot, recipe: recipe, scale: scale)
                    let value = score(meal, budget: budget) + jitter
                    if best == nil || value < best!.score { best = (meal, value) }
                }
            }
            if let chosen = best?.meal {
                meals.append(chosen)
                used.insert(chosen.recipe.id)
            }
        }
        return tuneDay(DayPlan(meals: meals), target: request.energyTarget)
    }

    /// Plans several days, each with its own seed so days differ but stay reproducible.
    public static func planWeek(recipes: [Recipe], request: PlannerRequest, days: Int = 7) -> [DayPlan] {
        (0..<days).map { day in
            var dayRequest = request
            dayRequest.seed = request.seed &+ UInt32(day) &* 7919
            return planDay(recipes: recipes, request: dayRequest)
        }
    }

    /// Lower is better: closeness to the slot budget, with a small protein bonus.
    static func score(_ meal: PlannedMeal, budget: Double) -> Double {
        guard budget > 0 else { return 0 }
        let energy = meal.nutrients.calories
        let distance = abs(energy - budget) / budget
        let proteinShare = energy > 0 ? meal.nutrients.protein * 4 / energy : 0
        return distance - min(proteinShare, 0.35) * 0.15
    }

    /// If the whole day is more than 10% off, nudge the snack (then dinner) scale.
    static func tuneDay(_ plan: DayPlan, target: Double) -> DayPlan {
        var plan = plan
        for slot in [MealSlot.snack, .dinner] {
            let total = plan.totals.calories
            guard target > 0, abs(total - target) / target > 0.10,
                  let index = plan.meals.firstIndex(where: { $0.slot == slot }) else { continue }
            let others = total - plan.meals[index].nutrients.calories
            let wanted = target - others
            let perServing = plan.meals[index].recipe.nutrients.calories
            guard perServing > 0 else { continue }
            let ideal = wanted / perServing
            plan.meals[index].scale = scales.min { abs($0 - ideal) < abs($1 - ideal) } ?? 1
        }
        return plan
    }
}

/// One line on the shopping list.
public struct ShoppingItem: Sendable, Hashable, Identifiable {
    public var name: String
    public var amount: Double
    public var unit: String
    public var aisle: String
    public var id: String { aisle + "|" + name + "|" + unit }

    public var amountLabel: String {
        let rounded = (amount * 4).rounded() / 4
        let text = rounded == rounded.rounded() ? String(Int(rounded)) : String(format: "%g", rounded)
        return unit.isEmpty ? text : "\(text) \(unit)"
    }
}

public enum ShoppingList {
    /// Combines every ingredient across the plans, scaled, grouped by aisle.
    public static func build(from plans: [DayPlan]) -> [(aisle: String, items: [ShoppingItem])] {
        var combined: [String: ShoppingItem] = [:]
        for plan in plans {
            for meal in plan.meals {
                for ingredient in meal.recipe.ingredients {
                    let key = ingredient.aisle + "|" + ingredient.name.lowercased() + "|" + ingredient.unit
                    var item = combined[key] ?? ShoppingItem(name: ingredient.name, amount: 0,
                                                             unit: ingredient.unit, aisle: ingredient.aisle)
                    item.amount += ingredient.amount * meal.scale
                    combined[key] = item
                }
            }
        }
        let byAisle = Dictionary(grouping: combined.values, by: \.aisle)
        return byAisle.keys.sorted().map { aisle in
            (aisle: aisle, items: byAisle[aisle, default: []].sorted { $0.name < $1.name })
        }
    }
}

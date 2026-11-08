import Foundation

/// All dashboard module kinds. Goals list these ids in goals.json.
public enum ModuleKind: String, Codable, Sendable, CaseIterable {
    case energy, protein, macros, fiber, plants, foodGroups, meals, training, weightTrend, tip
}

/// What one dashboard card shows. Built here, so gentle mode is decided in the
/// view model and never by scrubbing text in the view.
public struct ModuleCard: Sendable, Hashable, Identifiable {
    public var kind: ModuleKind
    public var title: String
    public var headline: String
    public var detail: String
    /// 0...1 for a progress bar, or nil. Bars are capped at 1 and never turn a warning color.
    public var progress: Double?
    public var systemImage: String
    public var id: String { kind.rawValue }

    /// Every piece of text on the card, for tests.
    public var allText: [String] { [title, headline, detail] }
}

public struct DashboardInput: Sendable {
    public var profile: Profile
    public var goals: [Goal]
    public var targets: Targets
    public var todaysMeals: [MealEntry]
    public var weighIns: [TrendAdvisor.WeighIn]

    public init(profile: Profile, goals: [Goal], targets: Targets,
                todaysMeals: [MealEntry], weighIns: [TrendAdvisor.WeighIn] = []) {
        self.profile = profile
        self.goals = goals
        self.targets = targets
        self.todaysMeals = todaysMeals
        self.weighIns = weighIns
    }
}

/// The module registry for the pure side: turns goal module ids into cards.
public enum DashboardBuilder {
    /// Shown when a goal lists nothing usable.
    public static let defaultModules: [ModuleKind] = [.meals, .foodGroups, .tip]

    public static func cards(for input: DashboardInput) -> [ModuleCard] {
        let gentle = input.profile.effectiveDisplayStyle == .gentle
        let primary = input.goals.first
        let ids = (gentle ? primary?.gentleModules : primary?.modules) ?? []
        var kinds = ids.compactMap(ModuleKind.init(rawValue:))
        if kinds.isEmpty { kinds = defaultModules }
        // Safety: weight trend never appears in gentle mode or for protected people.
        if gentle || input.profile.isProtected { kinds.removeAll { $0 == .weightTrend } }
        // Numbers-only modules need numbers; in gentle mode swap them for word-based ones.
        if gentle {
            kinds = kinds.map { kind in kind == .energy || kind == .macros ? ModuleKind.foodGroups : kind }
        }
        var seen = Set<ModuleKind>()
        kinds = kinds.filter { seen.insert($0).inserted }
        return kinds.map { card($0, input: input, gentle: gentle) }
    }

    static func card(_ kind: ModuleKind, input: DashboardInput, gentle: Bool) -> ModuleCard {
        let eaten = input.todaysMeals.reduce(Nutrients.zero) { $0 + $1.nutrients }
        let foods = input.todaysMeals.flatMap(\.items).map(\.food)
        let targets = input.targets

        switch kind {
        case .energy:
            guard let goal = targets.calories, !gentle else {
                return mealsCard(input.todaysMeals, gentle: gentle)
            }
            let share = eaten.calories / Double(goal)
            return ModuleCard(kind: kind, title: "Energy today",
                              headline: "\(format(eaten.calories)) of about \(format(Double(goal))) kcal",
                              detail: share > 1 ? overText : "A starting estimate, not a rule.",
                              progress: min(share, 1), systemImage: "flame")
        case .protein:
            if gentle || targets.proteinGrams == nil {
                let words = eaten.protein >= 60 ? "Plenty of protein foods today."
                    : eaten.protein >= 20 ? "Some protein foods so far."
                    : "Eggs, beans, yogurt, fish or chicken can add protein."
                return ModuleCard(kind: kind, title: "Protein", headline: words,
                                  detail: "Protein helps with fullness and repair.",
                                  progress: nil, systemImage: "bolt.heart")
            }
            let goal = Double(targets.proteinGrams ?? 1)
            return ModuleCard(kind: kind, title: "Protein",
                              headline: "\(format(eaten.protein)) of about \(format(goal)) g",
                              detail: "Spread it across your meals.",
                              progress: min(eaten.protein / goal, 1), systemImage: "bolt.heart")
        case .macros:
            if gentle { return foodGroupsCard(foods, gentle: true) }
            return ModuleCard(kind: kind, title: "Carbs, protein, fat",
                              headline: "\(format(eaten.carbs)) g carbs · \(format(eaten.protein)) g protein · " +
                                "\(format(eaten.fat)) g fat",
                              detail: "All estimates.", progress: nil, systemImage: "chart.pie")
        case .fiber:
            if gentle || targets.fiberGrams == nil {
                let words = eaten.fiber >= 20 ? "Lots of fiber today. Your gut thanks you."
                    : "Beans, oats, fruit and vegetables add fiber."
                return ModuleCard(kind: kind, title: "Fiber", headline: words,
                                  detail: "Fiber helps digestion and steady energy.",
                                  progress: nil, systemImage: "leaf")
            }
            let goal = Double(targets.fiberGrams ?? 25)
            return ModuleCard(kind: kind, title: "Fiber",
                              headline: "\(format(eaten.fiber)) of about \(format(goal)) g",
                              detail: "Beans, oats, fruit and vegetables add fiber.",
                              progress: min(eaten.fiber / goal, 1), systemImage: "leaf")
        case .plants:
            let plants = Set(foods.filter { $0.group == .vegetable || $0.group == .fruit }.map(\.id)).count
            let headline: String
            if gentle {
                headline = plants >= 3 ? "Lots of different plants today." :
                    plants >= 1 ? "Some plants so far." : "A fruit or vegetable would add color."
            } else {
                headline = "\(plants) different fruits and vegetables today"
            }
            return ModuleCard(kind: kind, title: "Plants", headline: headline,
                              detail: "Variety matters more than amount.",
                              progress: nil, systemImage: "carrot")
        case .foodGroups:
            return foodGroupsCard(foods, gentle: gentle)
        case .meals:
            return mealsCard(input.todaysMeals, gentle: gentle)
        case .training:
            let headline = input.profile.trainingDays > 0
                ? "Your workout plan is in Coach, under Move."
                : "Any movement you enjoy counts."
            return ModuleCard(kind: kind, title: "Move", headline: headline,
                              detail: "Rest days are part of training too.",
                              progress: nil, systemImage: "figure.strengthtraining.traditional")
        case .weightTrend:
            let direction = input.goals.first?.direction ?? .none
            let advice = TrendAdvisor.advice(for: input.weighIns, direction: direction, profile: input.profile)
            return ModuleCard(kind: kind, title: "Two-week trend", headline: advice.message,
                              detail: "Nutra never reacts to a single weigh-in.",
                              progress: nil, systemImage: "chart.line.uptrend.xyaxis")
        case .tip:
            return ModuleCard(kind: kind, title: "Today's idea",
                              headline: tip(for: input.goals.first?.category),
                              detail: Disclaimers.educational,
                              progress: nil, systemImage: "lightbulb")
        }
    }

    static let overText =
        "You're past your starting estimate. That's okay: needs change day to day."

    static func mealsCard(_ meals: [MealEntry], gentle: Bool) -> ModuleCard {
        let slots = MealSlot.allCases.filter { slot in meals.contains { $0.slot == slot } }
        let headline: String
        if slots.isEmpty {
            headline = "Nothing logged yet. Tap Log when you're ready."
        } else {
            let names = slots.map(\.title).joined(separator: ", ")
            headline = gentle ? "Logged: \(names)." : "\(meals.count) logged: \(names)."
        }
        return ModuleCard(kind: .meals, title: "Today's meals", headline: headline,
                          detail: "Logging is optional. Skipping a day is fine.",
                          progress: nil, systemImage: "fork.knife")
    }

    static func foodGroupsCard(_ foods: [Food], gentle: Bool) -> ModuleCard {
        let groups = FoodGroup.allCases.filter { group in
            [FoodGroup.vegetable, .fruit, .grain, .protein, .dairy].contains(group)
                && foods.contains { $0.group == group }
        }
        let headline = groups.isEmpty
            ? "Your food groups will show here."
            : "So far: " + groups.map(\.friendlyName).joined(separator: ", ") + "."
        return ModuleCard(kind: .foodGroups, title: "Food groups", headline: headline,
                          detail: "A mix of groups across the day gives your body what it needs.",
                          progress: nil, systemImage: "square.grid.2x2")
    }

    static func tip(for category: GoalCategory?) -> String {
        switch category {
        case .body: return "Building meals around protein and vegetables helps you feel full."
        case .sport: return "A carb-and-protein snack after training helps recovery."
        case .health: return "Water, sleep and a short walk are small wins that add up."
        case .program: return "Pick one small habit this week. That's enough."
        case .life: return "Cooking a double batch saves time on busy days."
        case .explore, .none: return "Try a dish from a cuisine you haven't had before."
        }
    }

    static func format(_ value: Double) -> String {
        let number = NSNumber(value: Int(value.rounded()))
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        return formatter.string(from: number) ?? "\(Int(value.rounded()))"
    }
}

/// Words and symbols that must never appear in gentle mode text.
public enum GentleMode {
    public static let bannedTokens = ["kcal", "calorie", "gram", " g ", "%", " kg", " lb", "pound", "bmi"]

    /// True when the text contains a digit or a banned token.
    public static func leaksNumbers(_ text: String) -> Bool {
        let padded = " " + text.lowercased() + " "
        if padded.contains(where: \.isNumber) { return true }
        return bannedTokens.contains { padded.contains($0) }
    }
}

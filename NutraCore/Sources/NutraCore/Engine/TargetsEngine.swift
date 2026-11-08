import Foundation

/// A safety notice the UI must show. Plain words, no numbers.
public enum SafetyNotice: String, Codable, Sendable, CaseIterable {
    case under18, pregnancy, combatSports

    public var message: String {
        switch self {
        case .under18: return Disclaimers.under18
        case .pregnancy: return Disclaimers.pregnancy
        case .combatSports: return Disclaimers.combatSports
        }
    }
}

/// Personal starting numbers. Any number can be nil: nil means "do not show a number".
public struct Targets: Codable, Hashable, Sendable {
    public var calories: Int?
    public var proteinGrams: Int?
    public var carbsGrams: Int?
    public var fatGrams: Int?
    public var fiberGrams: Int?
    /// False for anyone under 18 or pregnant, and for goals that do not change weight.
    public var weightChangeAllowed: Bool
    public var notices: [SafetyNotice]
    /// Plain-language notes about how the numbers were made.
    public var notes: [String]

    public init(calories: Int? = nil, proteinGrams: Int? = nil, carbsGrams: Int? = nil,
                fatGrams: Int? = nil, fiberGrams: Int? = nil, weightChangeAllowed: Bool = false,
                notices: [SafetyNotice] = [], notes: [String] = []) {
        self.calories = calories
        self.proteinGrams = proteinGrams
        self.carbsGrams = carbsGrams
        self.fatGrams = fatGrams
        self.fiberGrams = fiberGrams
        self.weightChangeAllowed = weightChangeAllowed
        self.notices = notices
        self.notes = notes
    }
}

/// Turns a goal plus person details into personal starting numbers.
/// Pure and deterministic, so every safety rail is unit-tested.
public enum TargetsEngine {
    public static let femaleFloor = 1200
    public static let otherFloor = 1500
    /// No rapid cuts: the deficit is never more than this share of maintenance.
    public static let maxDeficitShare = 0.20
    /// ...and never more than this many kcal per day.
    public static let maxDeficitKcal = 500.0
    /// Surplus cap for gaining.
    public static let maxSurplusKcal = 500.0

    public static func calorieFloor(for sex: Sex) -> Int {
        sex == .female ? femaleFloor : otherFloor
    }

    /// Mifflin-St Jeor resting energy. Unspecified sex uses the midpoint.
    public static func restingEnergy(sex: Sex, weightKg: Double, heightCm: Double, age: Int) -> Double {
        let base = 10 * weightKg + 6.25 * heightCm - 5 * Double(age)
        switch sex {
        case .male: return base + 5
        case .female: return base - 161
        case .unspecified: return base - 78
        }
    }

    /// Main entry point. When several goals are chosen, the first one sets the numbers.
    public static func targets(for goals: [Goal], profile: Profile) -> Targets {
        var notices: [SafetyNotice] = []
        if profile.isUnder18 { notices.append(.under18) }
        if profile.isPregnant { notices.append(.pregnancy) }
        if goals.contains(where: \.isCombatSport) { notices.append(.combatSports) }

        // Protected people: no calorie numbers and no weight change, ever.
        if profile.isProtected {
            return Targets(weightChangeAllowed: false, notices: notices,
                           notes: ["Nutra focuses on regular, balanced meals for you."])
        }

        guard let primary = goals.first else {
            return Targets(notices: notices, notes: ["Pick a goal to see starting numbers."])
        }

        guard let weight = profile.weightKg, let height = profile.heightCm, let age = profile.age,
              weight > 20, height > 100, age >= 18 else {
            return Targets(weightChangeAllowed: primary.direction.changesWeight,
                           notices: notices,
                           notes: ["Add your age, height and weight to see starting numbers."])
        }

        let maintenance = restingEnergy(sex: profile.sex, weightKg: weight, heightCm: height, age: age)
            * profile.activity.factor
        var energy = maintenance
        var notes: [String] = [Disclaimers.startingNumbers]

        switch primary.direction {
        case .lose:
            let wanted = maintenance * abs(min(0, primary.calorieAdjustPercent)) / 100
            let deficit = min(wanted, maintenance * maxDeficitShare, maxDeficitKcal)
            energy = maintenance - deficit
        case .gain:
            let wanted = maintenance * max(0, primary.calorieAdjustPercent) / 100
            energy = maintenance + min(wanted, maxSurplusKcal)
        case .maintain, .none:
            energy = maintenance * (1 + primary.calorieAdjustPercent / 100)
        }

        let floor = Double(calorieFloor(for: profile.sex))
        if energy < floor {
            energy = floor
            notes.append("Your number was raised to a safe minimum.")
        }

        let calories = roundTo(energy, step: 10)
        let protein = (weight * min(max(primary.proteinPerKg, 0.8), 2.2)).rounded()
        let fat = (Double(calories) * 0.30 / 9).rounded()
        let carbs = max(0, (Double(calories) - protein * 4 - fat * 9) / 4).rounded()
        let fiber = max(25, (Double(calories) / 1000 * 14).rounded())

        return Targets(calories: calories, proteinGrams: Int(protein), carbsGrams: Int(carbs),
                       fatGrams: Int(fat), fiberGrams: Int(fiber),
                       weightChangeAllowed: primary.direction.changesWeight,
                       notices: notices, notes: notes)
    }

    static func roundTo(_ value: Double, step: Double) -> Int {
        Int((value / step).rounded() * step)
    }
}

/// The 14-day trend rule: never react to a single weigh-in.
/// Only after at least 14 days of entries does Nutra suggest anything, and it never
/// suggests eating less. It only suggests a gentler pace when change is too fast.
// NOTE: reconcile wording and thresholds with Part 3 when that file is added to docs/.
public enum TrendAdvisor {
    public enum Advice: Equatable, Sendable {
        case needMoreDays
        case steady
        case tooFast
        case notMoving

        public var message: String {
            switch self {
            case .needMoreDays: return "Keep going. Nutra looks at two weeks at a time, not single days."
            case .steady: return "Your two-week trend looks steady. Nice and sustainable."
            case .tooFast:
                return "Your weight is changing faster than is comfortable. " +
                    "Consider a gentler pace: Nutra can ease your starting number in Profile."
            case .notMoving:
                return "Things look stable. That is fine. If you want, review your goal in Profile."
            }
        }
    }

    public struct WeighIn: Codable, Hashable, Sendable {
        public var date: Date
        public var kg: Double
        public init(date: Date, kg: Double) {
            self.date = date
            self.kg = kg
        }
    }

    /// More than 1% of body weight per week is "too fast".
    public static let maxWeeklyShare = 0.01

    public static func advice(for weighIns: [WeighIn], direction: GoalDirection,
                              profile: Profile) -> Advice {
        // No weight advice at all for protected people or goals that do not change weight.
        guard !profile.isProtected, direction.changesWeight else { return .needMoreDays }
        let sorted = weighIns.sorted { $0.date < $1.date }
        guard let first = sorted.first, let last = sorted.last else { return .needMoreDays }
        let days = last.date.timeIntervalSince(first.date) / 86_400
        guard days >= 14, sorted.count >= 4 else { return .needMoreDays }

        // Average the first and last few entries to smooth daily noise.
        let early = sorted.prefix(3).map(\.kg).reduce(0, +) / Double(min(3, sorted.count))
        let late = sorted.suffix(3).map(\.kg).reduce(0, +) / Double(min(3, sorted.count))
        let weeklyChange = (late - early) / (days / 7)
        let share = abs(weeklyChange) / early

        if share > maxWeeklyShare { return .tooFast }
        if share < 0.001 { return .notMoving }
        return .steady
    }
}

/// Which goals a person may choose.
public enum GoalRules {
    /// Used when every chosen goal had to be removed.
    public static let protectedFallbackGoalID = "more-energy"

    /// Under-18 and pregnant people cannot have weight-change goals.
    public static func isAllowed(_ goal: Goal, for profile: Profile) -> Bool {
        !(profile.isProtected && goal.direction.changesWeight)
    }

    /// Removes goals the person may not have, keeping order. Never returns an empty list
    /// when something was removed.
    public static func allowedGoalIDs(_ ids: [String], goals: [Goal], profile: Profile) -> [String] {
        let kept = ids.filter { id in
            guard let goal = goals.first(where: { $0.id == id }) else { return false }
            return isAllowed(goal, for: profile)
        }
        if kept.isEmpty && !ids.isEmpty { return [protectedFallbackGoalID] }
        return kept
    }
}

import Foundation

public enum Sex: String, Codable, Sendable, CaseIterable, Identifiable {
    case female, male, unspecified
    public var id: String { rawValue }
    public var title: String {
        switch self {
        case .female: return "Female"
        case .male: return "Male"
        case .unspecified: return "Prefer not to say"
        }
    }
}

public enum ActivityLevel: String, Codable, Sendable, CaseIterable, Identifiable {
    case resting, light, moderate, active, veryActive
    public var id: String { rawValue }

    public var factor: Double {
        switch self {
        case .resting: return 1.2
        case .light: return 1.375
        case .moderate: return 1.55
        case .active: return 1.725
        case .veryActive: return 1.9
        }
    }

    public var title: String {
        switch self {
        case .resting: return "Mostly sitting"
        case .light: return "On my feet a bit"
        case .moderate: return "Active most days"
        case .active: return "Very active"
        case .veryActive: return "Hard training or physical job"
        }
    }
}

public enum AgeGroup: String, Codable, Sendable {
    case under18, adult

    /// Age is committed on change: 5 to 17 is under-18, 18 or more is adult.
    public static func from(age: Int?) -> AgeGroup? {
        guard let age, age >= 5 else { return nil }
        return age < 18 ? .under18 : .adult
    }
}

/// How the app shows progress.
public enum DisplayStyle: String, Codable, Sendable, CaseIterable, Identifiable {
    /// Words and food groups only. Every number is hidden at the view-model level.
    case gentle
    /// Calories, grams and percentages.
    case standard
    public var id: String { rawValue }
    public var title: String {
        switch self {
        case .gentle: return "Gentle (no numbers)"
        case .standard: return "Show numbers"
        }
    }
}

public enum DietStyle: String, Codable, Sendable, CaseIterable, Identifiable {
    // Only the four diets approved so far. More are reserved for a later decision.
    case none, mediterranean, carnivore, pescatarian, vegetarian
    public var id: String { rawValue }
    public var title: String {
        switch self {
        case .none: return "No particular style"
        case .mediterranean: return "Mediterranean"
        case .carnivore: return "Carnivore"
        case .pescatarian: return "Pescatarian"
        case .vegetarian: return "Vegetarian"
        }
    }
}

/// Everything Nutra knows about the person. Every field except name is optional,
/// so nobody is forced through a long form.
public struct Profile: Codable, Hashable, Sendable {
    public var name: String
    public var age: Int?
    public var sex: Sex
    public var heightCm: Double?
    public var weightKg: Double?
    public var activity: ActivityLevel
    public var isPregnant: Bool
    public var goalIDs: [String]
    public var displayStyle: DisplayStyle
    public var diet: DietStyle
    public var allergens: [Allergen]
    public var cookingMinutes: Int
    public var hasOven: Bool
    public var trainingDays: Int
    public var equipment: Equipment
    public var completedOnboarding: Bool

    public init(name: String = "", age: Int? = nil, sex: Sex = .unspecified,
                heightCm: Double? = nil, weightKg: Double? = nil,
                activity: ActivityLevel = .light, isPregnant: Bool = false,
                goalIDs: [String] = [], displayStyle: DisplayStyle = .standard,
                diet: DietStyle = .none, allergens: [Allergen] = [],
                cookingMinutes: Int = 30, hasOven: Bool = true,
                trainingDays: Int = 3, equipment: Equipment = .bodyweight,
                completedOnboarding: Bool = false) {
        self.name = name
        self.age = age
        self.sex = sex
        self.heightCm = heightCm
        self.weightKg = weightKg
        self.activity = activity
        self.isPregnant = isPregnant
        self.goalIDs = goalIDs
        self.displayStyle = displayStyle
        self.diet = diet
        self.allergens = allergens
        self.cookingMinutes = cookingMinutes
        self.hasOven = hasOven
        self.trainingDays = trainingDays
        self.equipment = equipment
        self.completedOnboarding = completedOnboarding
    }

    public var ageGroup: AgeGroup? { AgeGroup.from(age: age) }
    public var isUnder18: Bool { ageGroup == .under18 }

    /// Under-18 and pregnancy always use the protected path.
    public var isProtected: Bool { isUnder18 || isPregnant }

    /// Gentle mode is forced on for protected people.
    public var effectiveDisplayStyle: DisplayStyle { isProtected ? .gentle : displayStyle }
}

public enum Equipment: String, Codable, Sendable, CaseIterable, Identifiable {
    case gym, dumbbells, bodyweight
    public var id: String { rawValue }
    public var title: String {
        switch self {
        case .gym: return "Full gym"
        case .dumbbells: return "Dumbbells at home"
        case .bodyweight: return "No equipment"
        }
    }
}

// Tolerant decoding: a profile saved by an older version still opens,
// and any missing field falls back to its default. This is the migration path.
extension Profile {
    private enum CodingKeys: String, CodingKey {
        case name, age, sex, heightCm, weightKg, activity, isPregnant, goalIDs
        case displayStyle, diet, allergens, cookingMinutes, hasOven, trainingDays
        case equipment, completedOnboarding
    }

    public init(from decoder: Decoder) throws {
        let box = try decoder.container(keyedBy: CodingKeys.self)
        let base = Profile()
        self.init(
            name: try box.decodeIfPresent(String.self, forKey: .name) ?? base.name,
            age: try box.decodeIfPresent(Int.self, forKey: .age),
            sex: try box.decodeIfPresent(Sex.self, forKey: .sex) ?? base.sex,
            heightCm: try box.decodeIfPresent(Double.self, forKey: .heightCm),
            weightKg: try box.decodeIfPresent(Double.self, forKey: .weightKg),
            activity: try box.decodeIfPresent(ActivityLevel.self, forKey: .activity) ?? base.activity,
            isPregnant: try box.decodeIfPresent(Bool.self, forKey: .isPregnant) ?? false,
            goalIDs: try box.decodeIfPresent([String].self, forKey: .goalIDs) ?? [],
            displayStyle: try box.decodeIfPresent(DisplayStyle.self, forKey: .displayStyle) ?? base.displayStyle,
            diet: try box.decodeIfPresent(DietStyle.self, forKey: .diet) ?? base.diet,
            allergens: try box.decodeIfPresent([Allergen].self, forKey: .allergens) ?? [],
            cookingMinutes: try box.decodeIfPresent(Int.self, forKey: .cookingMinutes) ?? base.cookingMinutes,
            hasOven: try box.decodeIfPresent(Bool.self, forKey: .hasOven) ?? base.hasOven,
            trainingDays: try box.decodeIfPresent(Int.self, forKey: .trainingDays) ?? base.trainingDays,
            equipment: try box.decodeIfPresent(Equipment.self, forKey: .equipment) ?? base.equipment,
            completedOnboarding: try box.decodeIfPresent(Bool.self, forKey: .completedOnboarding) ?? false
        )
    }
}

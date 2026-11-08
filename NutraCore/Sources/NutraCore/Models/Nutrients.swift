import Foundation

/// The ten micronutrients Nutra shows as "% daily value".
/// Daily values follow the US FDA reference amounts for adults.
public enum Micronutrient: String, CaseIterable, Codable, Sendable, Identifiable {
    case vitaminA, vitaminC, vitaminD, vitaminB12, folate
    case calcium, iron, magnesium, potassium, zinc

    public var id: String { rawValue }

    public var displayName: String {
        switch self {
        case .vitaminA: return "Vitamin A"
        case .vitaminC: return "Vitamin C"
        case .vitaminD: return "Vitamin D"
        case .vitaminB12: return "Vitamin B12"
        case .folate: return "Folate"
        case .calcium: return "Calcium"
        case .iron: return "Iron"
        case .magnesium: return "Magnesium"
        case .potassium: return "Potassium"
        case .zinc: return "Zinc"
        }
    }

    public var unit: String {
        switch self {
        case .vitaminA, .vitaminD, .vitaminB12, .folate: return "mcg"
        default: return "mg"
        }
    }

    /// Adult daily value, in `unit`.
    public var dailyValue: Double {
        switch self {
        case .vitaminA: return 900
        case .vitaminC: return 90
        case .vitaminD: return 20
        case .vitaminB12: return 2.4
        case .folate: return 400
        case .calcium: return 1300
        case .iron: return 18
        case .magnesium: return 420
        case .potassium: return 4700
        case .zinc: return 11
        }
    }
}

/// Energy, macros, fiber and micronutrients for an amount of food.
/// All built-in values are estimates, not USDA-verified.
public struct Nutrients: Codable, Hashable, Sendable {
    public var calories: Double
    public var protein: Double
    public var carbs: Double
    public var fat: Double
    public var fiber: Double
    /// Keyed by `Micronutrient.rawValue`. Missing means "about zero / unknown".
    public var micros: [String: Double]

    public init(calories: Double = 0, protein: Double = 0, carbs: Double = 0,
                fat: Double = 0, fiber: Double = 0, micros: [String: Double] = [:]) {
        self.calories = calories
        self.protein = protein
        self.carbs = carbs
        self.fat = fat
        self.fiber = fiber
        self.micros = micros
    }

    public static let zero = Nutrients()

    public subscript(micro: Micronutrient) -> Double {
        get { micros[micro.rawValue] ?? 0 }
        set { micros[micro.rawValue] = newValue }
    }

    /// Carbs the body digests (used for glycemic load).
    public var availableCarbs: Double { max(0, carbs - fiber) }

    public func scaled(by factor: Double) -> Nutrients {
        var out = Nutrients(calories: calories * factor, protein: protein * factor,
                            carbs: carbs * factor, fat: fat * factor, fiber: fiber * factor)
        for (key, value) in micros { out.micros[key] = value * factor }
        return out
    }

    public static func + (lhs: Nutrients, rhs: Nutrients) -> Nutrients {
        var out = Nutrients(calories: lhs.calories + rhs.calories,
                            protein: lhs.protein + rhs.protein,
                            carbs: lhs.carbs + rhs.carbs,
                            fat: lhs.fat + rhs.fat,
                            fiber: lhs.fiber + rhs.fiber,
                            micros: lhs.micros)
        for (key, value) in rhs.micros { out.micros[key, default: 0] += value }
        return out
    }

    public static func += (lhs: inout Nutrients, rhs: Nutrients) { lhs = lhs + rhs }

    /// Whole-number percent of daily value for one micronutrient.
    public func percentDailyValue(_ micro: Micronutrient) -> Int {
        Int((self[micro] / micro.dailyValue * 100).rounded())
    }
}

public enum Allergen: String, CaseIterable, Codable, Sendable, Identifiable {
    case milk, egg, peanut, treeNut, soy, wheat, fish, shellfish, sesame

    public var id: String { rawValue }

    public var displayName: String {
        switch self {
        case .milk: return "Milk"
        case .egg: return "Egg"
        case .peanut: return "Peanut"
        case .treeNut: return "Tree nuts"
        case .soy: return "Soy"
        case .wheat: return "Wheat / gluten"
        case .fish: return "Fish"
        case .shellfish: return "Shellfish"
        case .sesame: return "Sesame"
        }
    }
}

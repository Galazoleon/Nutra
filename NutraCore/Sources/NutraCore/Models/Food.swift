import Foundation

/// Where a food's numbers came from. Drives the honesty labels in the UI.
public enum FoodSource: String, Codable, Sendable {
    /// Built into Nutra. Estimates, not USDA-verified.
    case builtInEstimate
    /// Made by the person. Always labeled "Your food, not verified".
    case userMade

    public var label: String {
        switch self {
        case .builtInEstimate: return Disclaimers.estimateShort
        case .userMade: return Disclaimers.userFood
        }
    }
}

public enum FoodGroup: String, Codable, Sendable, CaseIterable {
    case vegetable, fruit, grain, protein, dairy, fat, drink, sweet, mixed

    /// Plain words used in gentle mode instead of numbers.
    public var friendlyName: String {
        switch self {
        case .vegetable: return "vegetables"
        case .fruit: return "fruit"
        case .grain: return "grains"
        case .protein: return "protein foods"
        case .dairy: return "dairy"
        case .fat: return "healthy fats"
        case .drink: return "drinks"
        case .sweet: return "treats"
        case .mixed: return "mixed dishes"
        }
    }
}

/// One food Nutra knows. `nutrients` are for ONE `portionName` portion.
public struct Food: Codable, Hashable, Sendable, Identifiable {
    public var id: String
    public var name: String
    /// Extra words the text parser matches (plural forms, synonyms).
    public var aliases: [String]
    /// e.g. "egg", "cup", "slice", "medium".
    public var portionName: String
    public var portionGrams: Double
    public var group: FoodGroup
    public var nutrients: Nutrients
    /// Glycemic index (0-100). Nil when the food has almost no carbs.
    public var glycemicIndex: Int?
    public var allergens: [Allergen]
    public var isFried: Bool
    public var source: FoodSource

    public init(id: String, name: String, aliases: [String] = [], portionName: String,
                portionGrams: Double, group: FoodGroup, nutrients: Nutrients,
                glycemicIndex: Int? = nil, allergens: [Allergen] = [], isFried: Bool = false,
                source: FoodSource = .builtInEstimate) {
        self.id = id
        self.name = name
        self.aliases = aliases
        self.portionName = portionName
        self.portionGrams = portionGrams
        self.group = group
        self.nutrients = nutrients
        self.glycemicIndex = glycemicIndex
        self.allergens = allergens
        self.isFried = isFried
        self.source = source
    }

    /// Every lowercase phrase that should match this food.
    public var matchTerms: [String] {
        ([name] + aliases).map { $0.lowercased() }
    }
}

/// A food plus how many portions were eaten.
public struct LoggedItem: Codable, Hashable, Sendable, Identifiable {
    public var id: UUID
    public var food: Food
    public var portions: Double

    public init(id: UUID = UUID(), food: Food, portions: Double) {
        self.id = id
        self.food = food
        self.portions = portions
    }

    public var nutrients: Nutrients { food.nutrients.scaled(by: portions) }

    /// "2 eggs", "1.5 cups rice". Quantities are allowed in gentle mode:
    /// they describe the food, not a target.
    public var portionLabel: String {
        let amount = portions == portions.rounded()
            ? String(Int(portions))
            : String(format: "%.1f", portions)
        return "\(amount) × \(food.portionName) \(food.name.lowercased())"
    }
}

public enum LogSource: String, Codable, Sendable {
    case typed, voice, photo, plan
}

public enum MealSlot: String, Codable, Sendable, CaseIterable, Identifiable {
    case breakfast, lunch, dinner, snack
    public var id: String { rawValue }
    public var title: String { rawValue.capitalized }

    /// Rough guess from the time of day, so people do not have to choose.
    public static func guess(for date: Date, calendar: Calendar = .current) -> MealSlot {
        let hour = calendar.component(.hour, from: date)
        switch hour {
        case 4..<11: return .breakfast
        case 11..<15: return .lunch
        case 17..<22: return .dinner
        default: return .snack
        }
    }
}

/// A saved meal.
public struct MealEntry: Codable, Hashable, Sendable, Identifiable {
    public var id: UUID
    public var date: Date
    public var slot: MealSlot
    public var items: [LoggedItem]
    public var source: LogSource
    public var note: String

    public init(id: UUID = UUID(), date: Date, slot: MealSlot, items: [LoggedItem],
                source: LogSource, note: String = "") {
        self.id = id
        self.date = date
        self.slot = slot
        self.items = items
        self.source = source
        self.note = note
    }

    public var nutrients: Nutrients {
        items.reduce(Nutrients.zero) { $0 + $1.nutrients }
    }

    public var title: String {
        let names = items.prefix(3).map(\.food.name)
        let extra = items.count > 3 ? " and more" : ""
        return names.joined(separator: ", ") + extra
    }
}

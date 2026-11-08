import Foundation

/// Which way a goal moves body weight. Drives the safety rails.
public enum GoalDirection: String, Codable, Sendable {
    case lose, gain, maintain, none

    public var changesWeight: Bool { self == .lose || self == .gain }
}

/// Goal categories, kept to six so the first choice is never overwhelming.
public enum GoalCategory: String, Codable, Sendable, CaseIterable, Identifiable {
    case body, sport, health, program, life, explore
    public var id: String { rawValue }

    public var title: String {
        switch self {
        case .body: return "Body and weight"
        case .sport: return "Training and sport"
        case .health: return "Feel better"
        case .program: return "Short programs"
        case .life: return "Food and life"
        case .explore: return "Just exploring"
        }
    }

    public var subtitle: String {
        switch self {
        case .body: return "Lose, gain, keep steady, or build muscle"
        case .sport: return "Fuel for running, lifting, sports and more"
        case .health: return "Energy, sleep, digestion and long-term health"
        case .program: return "A few weeks with a clear start and finish"
        case .life: return "Family, culture, budget and cooking"
        case .explore: return "Look around first, decide later"
        }
    }

    public var systemImage: String {
        switch self {
        case .body: return "figure.stand"
        case .sport: return "figure.run"
        case .health: return "heart"
        case .program: return "calendar"
        case .life: return "fork.knife"
        case .explore: return "globe"
        }
    }
}

/// A goal, loaded from goals.json. Adding a goal is a data-only change.
public struct Goal: Codable, Hashable, Sendable, Identifiable {
    public var id: String
    public var title: String
    public var category: GoalCategory
    public var blurb: String
    public var direction: GoalDirection
    /// Percent change from maintenance energy, e.g. -15 or +10.
    public var calorieAdjustPercent: Double
    /// Grams of protein per kg of body weight.
    public var proteinPerKg: Double
    /// Dashboard modules in standard mode, top to bottom.
    public var modules: [String]
    /// Dashboard modules in gentle mode, top to bottom.
    public var gentleModules: [String]
    public var isCombatSport: Bool
    public var weeks: Int?
    /// Shown first in the picker.
    public var isPopular: Bool

    public init(id: String, title: String, category: GoalCategory, blurb: String,
                direction: GoalDirection, calorieAdjustPercent: Double = 0,
                proteinPerKg: Double = 1.0, modules: [String], gentleModules: [String],
                isCombatSport: Bool = false, weeks: Int? = nil, isPopular: Bool = false) {
        self.id = id
        self.title = title
        self.category = category
        self.blurb = blurb
        self.direction = direction
        self.calorieAdjustPercent = calorieAdjustPercent
        self.proteinPerKg = proteinPerKg
        self.modules = modules
        self.gentleModules = gentleModules
        self.isCombatSport = isCombatSport
        self.weeks = weeks
        self.isPopular = isPopular
    }
}

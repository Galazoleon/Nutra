import Foundation

public enum Confidence: String, Codable, Sendable {
    case high, medium, low

    public var label: String {
        switch self {
        case .high: return "Good match"
        case .medium: return "Partly matched"
        case .low: return "Rough guess"
        }
    }
}

/// Everything the review screen shows, computed in one place.
public struct MealAnalysis: Sendable {
    public var items: [LoggedItem]
    public var totals: Nutrients
    /// Carb-weighted average glycemic index of the meal, nil when there are no carbs.
    public var glycemicIndex: Int?
    public var glycemicLoad: Double
    public var confidence: Confidence
    public var allergens: [Allergen]
    /// Allergens that match the person's own list (the heads-up).
    public var personalAllergenWarnings: [Allergen]
    public var hasFried: Bool
    /// Exactly two plain-English sentences, never containing numbers.
    public var insight: String

    public var glycemicLoadLabel: String {
        switch glycemicLoad {
        case ..<10: return "Low"
        case ..<20: return "Medium"
        default: return "Higher"
        }
    }

    public func percentDailyValue(_ micro: Micronutrient) -> Int {
        totals.percentDailyValue(micro)
    }
}

public enum MealAnalyzer {
    public static func analyze(items: [LoggedItem], unrecognizedCount: Int = 0,
                               source: LogSource, profile: Profile) -> MealAnalysis {
        let totals = items.reduce(Nutrients.zero) { $0 + $1.nutrients }

        var weightedGI = 0.0
        var giCarbs = 0.0
        var load = 0.0
        for item in items {
            guard let gi = item.food.glycemicIndex else { continue }
            let carbs = item.nutrients.availableCarbs
            weightedGI += Double(gi) * carbs
            giCarbs += carbs
            load += Double(gi) * carbs / 100
        }
        let mealGI = giCarbs > 0 ? Int((weightedGI / giCarbs).rounded()) : nil

        let allergenSet = Set(items.flatMap(\.food.allergens))
        let allergens = Allergen.allCases.filter { allergenSet.contains($0) }
        let warnings = allergens.filter { profile.allergens.contains($0) }

        let confidence: Confidence
        if source == .photo || items.isEmpty {
            confidence = .low
        } else if unrecognizedCount > 0 || items.contains(where: { $0.food.source == .userMade }) {
            confidence = .medium
        } else {
            confidence = .high
        }

        return MealAnalysis(
            items: items, totals: totals, glycemicIndex: mealGI,
            glycemicLoad: (load * 10).rounded() / 10, confidence: confidence,
            allergens: allergens, personalAllergenWarnings: warnings,
            hasFried: items.contains(where: \.food.isFried),
            insight: insight(items: items, totals: totals, load: load)
        )
    }

    /// Two kind, number-free sentences. Never shaming, never a promise.
    static func insight(items: [LoggedItem], totals: Nutrients, load: Double) -> String {
        guard !items.isEmpty else {
            return "Add a food to see a quick take on this meal. You can type, speak or use a photo."
        }
        let groups = Set(items.map(\.food.group))
        let hasPlants = groups.contains(.vegetable) || groups.contains(.fruit)

        let first: String
        if totals.protein >= 20 && totals.fiber >= 6 {
            first = "This meal has a good mix of protein and fiber, which helps you stay full."
        } else if totals.protein >= 20 {
            first = "This meal brings a solid amount of protein, which helps with fullness and repair."
        } else if totals.fiber >= 6 {
            first = "This meal has plenty of fiber, which is great for digestion."
        } else {
            first = "This is a lighter meal that still counts toward your day."
        }

        let second: String
        if !hasPlants {
            second = "If you like, a handful of vegetables or fruit would add color and fiber."
        } else if load >= 20 {
            second = "Pairing the carbs with some protein or fat can make the energy last longer."
        } else if items.contains(where: \.food.isFried) {
            second = "Fried foods are fine to enjoy; baked or grilled versions are an easy swap sometimes."
        } else {
            second = "Nice variety here; plants add vitamins and minerals your body uses every day."
        }
        return first + " " + second
    }
}

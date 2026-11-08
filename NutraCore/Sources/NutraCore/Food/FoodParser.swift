import Foundation

/// Result of reading a typed or spoken meal description.
public struct ParseResult: Sendable, Equatable {
    public var items: [LoggedItem]
    /// Phrases Nutra could not match. Shown as "Not in Nutra's foods yet" chips.
    public var unrecognized: [String]

    public init(items: [LoggedItem], unrecognized: [String]) {
        self.items = items
        self.unrecognized = unrecognized
    }

    public static func == (lhs: ParseResult, rhs: ParseResult) -> Bool {
        lhs.unrecognized == rhs.unrecognized
            && lhs.items.map(\.food.id) == rhs.items.map(\.food.id)
            && lhs.items.map(\.portions) == rhs.items.map(\.portions)
    }
}

/// Turns "2 eggs, toast and a coffee" into foods with portions.
/// Person-made foods are searched first so they win over built-in ones.
public struct FoodParser: Sendable {
    public let foods: [Food]

    public init(builtIn: [Food], userFoods: [Food] = []) {
        self.foods = userFoods + builtIn
    }

    private static let separators = [",", ";", "\n", " and ", " with ", " & ", " + ", " plus "]
    private static let numberWords: [String: Double] = [
        "a": 1, "an": 1, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
        "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
        "half": 0.5, "couple": 2, "few": 3, "some": 1
    ]
    private static let fillerWords: Set<String> = [
        "of", "cup", "cups", "slice", "slices", "piece", "pieces", "bowl", "bowls",
        "serving", "servings", "portion", "portions", "plate", "plates", "glass", "glasses",
        "handful", "handfuls", "small", "medium", "large", "big", "the", "my", "some",
        "tbsp", "tablespoon", "tablespoons", "tsp", "teaspoon", "teaspoons", "had", "ate",
        "i", "for", "breakfast", "lunch", "dinner", "snack", "a", "an", "mug", "can"
    ]

    public func parse(_ text: String) -> ParseResult {
        var items: [LoggedItem] = []
        var unknown: [String] = []
        for chunk in Self.split(text) {
            if let item = parseChunk(chunk) {
                items.append(item)
            } else if !Self.isOnlyFiller(chunk) {
                unknown.append(chunk)
            }
        }
        return ParseResult(items: items, unrecognized: unknown)
    }

    static func split(_ text: String) -> [String] {
        var parts = [" " + text.lowercased() + " "]
        for sep in separators {
            parts = parts.flatMap { $0.components(separatedBy: sep) }
        }
        return parts
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines.union(.punctuationCharacters)) }
            .filter { !$0.isEmpty }
    }

    static func isOnlyFiller(_ chunk: String) -> Bool {
        chunk.split(separator: " ").allSatisfy { fillerWords.contains(String($0)) }
    }

    func parseChunk(_ chunk: String) -> LoggedItem? {
        guard let food = bestMatch(in: chunk) else { return nil }
        let (amount, grams) = Self.quantity(in: chunk)
        let portions: Double
        if let grams, food.portionGrams > 0 {
            portions = grams / food.portionGrams
        } else {
            portions = amount ?? 1
        }
        let clamped = min(max(portions, 0.25), 20)
        return LoggedItem(food: food, portions: (clamped * 4).rounded() / 4)
    }

    /// Longest matching term wins, so "sweet potato" beats "potato".
    func bestMatch(in chunk: String) -> Food? {
        let padded = " " + chunk + " "
        var best: (food: Food, length: Int)?
        for food in foods {
            for term in food.matchTerms where padded.contains(" " + term + " ") {
                if best == nil || term.count > best!.length {
                    best = (food, term.count)
                }
            }
        }
        return best?.food
    }

    /// Reads "2", "1.5", "1/2", "two", "half", and grams like "150g" or "150 grams".
    static func quantity(in chunk: String) -> (amount: Double?, grams: Double?) {
        let words = chunk.split(separator: " ").map(String.init)
        var amount: Double?
        var grams: Double?
        for (index, word) in words.enumerated() {
            if word.hasSuffix("g"), let value = Double(word.dropLast()), value > 0 {
                grams = value
                continue
            }
            if let value = number(from: word) {
                let next = index + 1 < words.count ? words[index + 1] : ""
                if ["g", "gram", "grams"].contains(next) {
                    grams = value
                } else if amount == nil {
                    amount = value
                }
            }
        }
        return (amount, grams)
    }

    static func number(from word: String) -> Double? {
        if let value = Double(word) { return value }
        if let named = numberWords[word] { return named }
        let pieces = word.split(separator: "/")
        if pieces.count == 2, let top = Double(pieces[0]), let bottom = Double(pieces[1]), bottom > 0 {
            return top / bottom
        }
        return nil
    }
}

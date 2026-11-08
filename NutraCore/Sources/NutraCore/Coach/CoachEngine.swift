import Foundation

public struct CoachEntry: Codable, Hashable, Sendable, Identifiable {
    public var id: String
    public var question: String
    public var keywords: [String]
    public var answer: String
}

public struct CoachReply: Sendable, Equatable {
    public enum Kind: Sendable, Equatable { case matched, safety, fallback }
    public var kind: Kind
    public var text: String
    public var entryID: String?
}

/// The safe, rule-based coach preview. Matches questions against coach.json.
/// The live AI path goes through the server (see CoachService in the app).
public struct CoachEngine: Sendable {
    public let entries: [CoachEntry]
    public static let freeQuestionsPerDay = 3

    /// Words that always route to the safety reply instead of an answer.
    static let safetyTerms = [
        "diagnose", "diagnosis", "chest pain", "faint", "purge", "purging", "vomit",
        "eating disorder", "anorexia", "bulimia", "starve", "starving", "suicide", "self harm",
        "self-harm", "overdose", "medication", "insulin dose", "cure"
    ]

    public init(entries: [CoachEntry]) {
        self.entries = entries
    }

    public func reply(to question: String) -> CoachReply {
        let text = question.lowercased()
        if Self.safetyTerms.contains(where: { text.contains($0) }) {
            return CoachReply(kind: .safety, text: Disclaimers.coachSafety, entryID: nil)
        }
        // A tapped suggestion matches its own answer exactly.
        let plain = Self.normalized(text)
        if let exact = entries.first(where: { Self.normalized($0.question) == plain }) {
            return CoachReply(kind: .matched, text: exact.answer, entryID: exact.id)
        }
        let words = Set(text.split { !$0.isLetter }.map(String.init))
        var best: (entry: CoachEntry, score: Int)?
        for entry in entries {
            let score = entry.keywords.reduce(0) { total, keyword in
                let key = keyword.lowercased()
                return total + (key.contains(" ") ? (text.contains(key) ? 2 : 0) : (words.contains(key) ? 1 : 0))
            }
            if score > 0, best == nil || score > best!.score { best = (entry, score) }
        }
        if let best {
            return CoachReply(kind: .matched, text: best.entry.answer, entryID: best.entry.id)
        }
        return CoachReply(
            kind: .fallback,
            text: "I don't have a ready answer for that yet. Try one of the suggested questions, " +
                "or ask about protein, fiber, snacks, sleep or meal timing.",
            entryID: nil)
    }

    static func normalized(_ text: String) -> String {
        text.lowercased().filter { $0.isLetter || $0 == " " }.trimmingCharacters(in: .whitespaces)
    }
}

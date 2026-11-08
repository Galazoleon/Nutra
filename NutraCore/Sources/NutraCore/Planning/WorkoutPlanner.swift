import Foundation

public enum MovementPattern: String, Codable, Sendable, CaseIterable {
    case squat, hinge, lunge, pushHorizontal, pushVertical, pullHorizontal, pullVertical, core, carry
}

public struct Exercise: Codable, Hashable, Sendable, Identifiable {
    public var id: String
    public var name: String
    public var pattern: MovementPattern
    public var equipment: [Equipment]
    public var howTo: String
}

public struct WorkoutSet: Sendable, Hashable, Identifiable {
    public var exercise: Exercise
    public var sets: Int
    public var reps: String
    public var id: String { exercise.id }
}

public struct WorkoutDay: Sendable, Hashable, Identifiable {
    public var index: Int
    public var title: String
    public var blocks: [WorkoutSet]
    public var id: Int { index }
}

public enum TrainingFocus: String, Codable, Sendable, CaseIterable, Identifiable {
    case general, muscle, strength
    public var id: String { rawValue }
    public var title: String {
        switch self {
        case .general: return "Feel fit"
        case .muscle: return "Build muscle"
        case .strength: return "Get stronger"
        }
    }

    var prescription: (sets: Int, reps: String) {
        switch self {
        case .general: return (2, "10-15")
        case .muscle: return (3, "8-12")
        case .strength: return (4, "4-6")
        }
    }
}

/// Builds a 2 to 6 day plan for a gym, dumbbells or bodyweight.
public enum WorkoutPlanner {
    static let fullBody: [MovementPattern] = [.squat, .pushHorizontal, .pullHorizontal, .hinge, .core]
    static let fullBodyB: [MovementPattern] = [.lunge, .pushVertical, .pullVertical, .hinge, .carry]
    static let upper: [MovementPattern] = [.pushHorizontal, .pullHorizontal, .pushVertical, .pullVertical, .core]
    static let lower: [MovementPattern] = [.squat, .hinge, .lunge, .core, .carry]
    static let push: [MovementPattern] = [.pushHorizontal, .pushVertical, .core]
    static let pull: [MovementPattern] = [.pullHorizontal, .pullVertical, .carry]
    static let legs: [MovementPattern] = [.squat, .hinge, .lunge]

    static func split(days: Int) -> [(String, [MovementPattern])] {
        switch days {
        case ...2: return [("Full body A", fullBody), ("Full body B", fullBodyB)]
        case 3: return [("Full body A", fullBody), ("Full body B", fullBodyB), ("Full body C", fullBody)]
        case 4: return [("Upper", upper), ("Lower", lower), ("Upper", upper), ("Lower", lower)]
        case 5: return [("Upper", upper), ("Lower", lower), ("Push", push), ("Pull", pull), ("Legs", legs)]
        default:
            return [("Push", push), ("Pull", pull), ("Legs", legs),
                    ("Push", push), ("Pull", pull), ("Legs", legs)]
        }
    }

    public static func plan(days: Int, equipment: Equipment, focus: TrainingFocus,
                            library: [Exercise]) -> [WorkoutDay] {
        let usable = library.filter { $0.equipment.contains(equipment) }
        let prescription = focus.prescription
        return split(days: min(max(days, 2), 6)).enumerated().map { index, entry in
            let blocks = entry.1.compactMap { pattern -> WorkoutSet? in
                let options = usable.filter { $0.pattern == pattern }
                guard !options.isEmpty else { return nil }
                // Rotate choices across days so repeated days feel different.
                let exercise = options[index % options.count]
                return WorkoutSet(exercise: exercise, sets: prescription.sets, reps: prescription.reps)
            }
            return WorkoutDay(index: index + 1, title: entry.0, blocks: blocks)
        }
    }
}

/// Gentle movement ideas for a sore area. Never a diagnosis.
public struct RehabArea: Codable, Hashable, Sendable, Identifiable {
    public var id: String
    public var name: String
    public var moves: [String]
    /// Signs that mean "see a professional now".
    public var redFlags: [String]
}

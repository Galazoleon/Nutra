import Foundation
import Observation
import NutraCore

/// Everything Nutra saves on the phone. One file, easy to export and delete.
struct SavedState: Codable, Sendable {
    var profile = Profile()
    var onboardingStep = 0
    var meals: [MealEntry] = []
    var userFoods: [Food] = []
    var weighIns: [TrendAdvisor.WeighIn] = []
    var proDemo = false
    var coachDay: Date?
    var coachQuestionsUsed = 0

    init() {}

    private enum CodingKeys: String, CodingKey {
        case profile, onboardingStep, meals, userFoods, weighIns, proDemo, coachDay, coachQuestionsUsed
    }

    /// Tolerant decoding so an update never wipes saved data: missing fields use defaults.
    init(from decoder: Decoder) throws {
        let box = try decoder.container(keyedBy: CodingKeys.self)
        profile = try box.decodeIfPresent(Profile.self, forKey: .profile) ?? Profile()
        onboardingStep = try box.decodeIfPresent(Int.self, forKey: .onboardingStep) ?? 0
        meals = try box.decodeIfPresent([MealEntry].self, forKey: .meals) ?? []
        userFoods = try box.decodeIfPresent([Food].self, forKey: .userFoods) ?? []
        weighIns = try box.decodeIfPresent([TrendAdvisor.WeighIn].self, forKey: .weighIns) ?? []
        proDemo = try box.decodeIfPresent(Bool.self, forKey: .proDemo) ?? false
        coachDay = try box.decodeIfPresent(Date.self, forKey: .coachDay)
        coachQuestionsUsed = try box.decodeIfPresent(Int.self, forKey: .coachQuestionsUsed) ?? 0
    }
}

/// The app's single source of truth.
@MainActor
@Observable
final class AppStore {
    private(set) var data: NutraData?
    private(set) var loadError: String?
    private(set) var state: SavedState

    private let fileURL: URL

    init() {
        let folder = URL.applicationSupportDirectory
        try? FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        fileURL = folder.appending(path: "nutra-state.json")
        if let saved = try? Data(contentsOf: fileURL),
           let decoded = try? JSONDecoder().decode(SavedState.self, from: saved) {
            state = decoded
        } else {
            state = SavedState()
        }
    }

    // MARK: Built-in data (loaded off the main thread, never blocks launch)

    func loadData() async {
        guard data == nil else { return }
        let result = await Task.detached(priority: .userInitiated) {
            Result { try NutraData.load() }
        }.value
        switch result {
        case .success(let loaded):
            #if DEBUG
            let problems = loaded.validate()
            if !problems.isEmpty { print("Nutra data problems:\n" + problems.joined(separator: "\n")) }
            #endif
            data = loaded
        case .failure(let error):
            loadError = String(describing: error)
        }
    }

    // MARK: Read-only views of state

    var profile: Profile { state.profile }
    var onboardingStep: Int { state.onboardingStep }
    var isGentle: Bool { profile.effectiveDisplayStyle == .gentle }
    var goals: [Goal] { data?.goals(ids: profile.goalIDs) ?? [] }
    var targets: Targets { TargetsEngine.targets(for: goals, profile: profile) }
    var userFoods: [Food] { state.userFoods }
    var allFoods: [Food] { state.userFoods + (data?.foods ?? []) }
    var parser: FoodParser { FoodParser(builtIn: data?.foods ?? [], userFoods: state.userFoods) }
    var meals: [MealEntry] { state.meals.sorted { $0.date > $1.date } }

    var todaysMeals: [MealEntry] {
        state.meals.filter { Calendar.current.isDateInToday($0.date) }.sorted { $0.date < $1.date }
    }

    var dashboard: [ModuleCard] {
        DashboardBuilder.cards(for: DashboardInput(
            profile: profile, goals: goals, targets: targets,
            todaysMeals: todaysMeals, weighIns: state.weighIns))
    }

    // MARK: Changes (each one saves)

    func updateProfile(_ change: (inout Profile) -> Void) {
        change(&state.profile)
        save()
    }

    func setOnboardingStep(_ step: Int) {
        state.onboardingStep = step
        save()
    }

    func finishOnboarding() {
        state.profile.completedOnboarding = true
        state.onboardingStep = 0
        save()
    }

    func redoSetup() {
        state.profile.completedOnboarding = false
        state.onboardingStep = 0
        save()
    }

    func addMeal(_ meal: MealEntry) {
        state.meals.append(meal)
        save()
    }

    func deleteMeal(_ id: UUID) {
        state.meals.removeAll { $0.id == id }
        save()
    }

    func addUserFood(_ food: Food) {
        var mine = food
        mine.source = .userMade
        state.userFoods.removeAll { $0.id == mine.id }
        state.userFoods.append(mine)
        save()
    }

    func deleteUserFood(_ id: String) {
        state.userFoods.removeAll { $0.id == id }
        save()
    }

    func addWeighIn(kg: Double) {
        state.weighIns.append(.init(date: .now, kg: kg))
        save()
    }

    // MARK: Free vs Pro (one entitlements layer)

    /// True when the person has Pro. Uses the demo switch until App Store products exist.
    // NEEDS: App Store Connect product ids, then StoreKit 2 `Transaction.currentEntitlements`.
    var isPro: Bool { state.proDemo }

    func setProDemo(_ on: Bool) {
        state.proDemo = on
        save()
    }

    var coachQuestionsLeft: Int {
        if isPro { return .max }
        guard let day = state.coachDay, Calendar.current.isDateInToday(day) else {
            return CoachEngine.freeQuestionsPerDay
        }
        return max(0, CoachEngine.freeQuestionsPerDay - state.coachQuestionsUsed)
    }

    func useCoachQuestion() {
        if let day = state.coachDay, Calendar.current.isDateInToday(day) {
            state.coachQuestionsUsed += 1
        } else {
            state.coachDay = .now
            state.coachQuestionsUsed = 1
        }
        save()
    }

    // MARK: Your data

    /// Writes a real, readable export file and returns where it is.
    func exportFile() throws -> URL {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        let url = FileManager.default.temporaryDirectory.appending(path: "Nutra-export.json")
        try encoder.encode(state).write(to: url, options: .atomic)
        return url
    }

    /// Deletes everything Nutra saved on this phone.
    func deleteEverything() {
        try? FileManager.default.removeItem(at: fileURL)
        state = SavedState()
    }

    private func save() {
        do {
            let encoded = try JSONEncoder().encode(state)
            try encoded.write(to: fileURL, options: [.atomic, .completeFileProtection])
        } catch {
            print("Nutra could not save: \(error)")
        }
    }
}

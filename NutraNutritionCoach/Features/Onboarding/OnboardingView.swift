import SwiftUI
import NutraCore

/// Layered setup: one small question per page, "Step N of M", Back / Continue / Skip.
/// Only the name and a goal are needed; everything else can be skipped and filled in later.
/// Progress is saved after every page, so closing the app resumes where you left off.
struct OnboardingView: View {
    @Environment(AppStore.self) private var store
    @State private var draft = Profile()
    @State private var step = 0
    @State private var loaded = false

    enum Page: Int, CaseIterable {
        case welcome, goal, body, food, style, summary

        var title: String {
            switch self {
            case .welcome: return "Welcome to Nutra"
            case .goal: return "What would you like help with?"
            case .body: return "A little about you"
            case .food: return "How you eat"
            case .style: return "How should Nutra show progress?"
            case .summary: return "You're all set"
            }
        }

        var subtitle: String {
            switch self {
            case .welcome: return "Nutra helps you learn about food, one meal at a time."
            case .goal: return "Pick one to start. You can change it any time."
            case .body: return "Optional. This lets Nutra suggest starting numbers."
            case .food: return "Optional. Nutra will avoid foods you can't eat."
            case .style: return "You can switch this later in Profile."
            case .summary: return "Here's what Nutra will do for you."
            }
        }

        var canSkip: Bool { self == .body || self == .food }
    }

    private var page: Page { Page(rawValue: step) ?? .welcome }

    var body: some View {
        VStack(spacing: 0) {
            header
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(page.title).font(.largeTitle.bold())
                        Text(page.subtitle).font(.body).foregroundStyle(.secondary)
                    }
                    content
                }
                .padding(20)
            }
            footer
        }
        .background(Theme.background.ignoresSafeArea())
        .onAppear {
            guard !loaded else { return }
            draft = store.profile
            step = min(store.onboardingStep, Page.allCases.count - 1)
            loaded = true
        }
    }

    // MARK: Header and footer

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Step \(step + 1) of \(Page.allCases.count)")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.secondary)
            ProgressView(value: Double(step + 1), total: Double(Page.allCases.count))
                .tint(Theme.indigo)
                .accessibilityLabel("Step \(step + 1) of \(Page.allCases.count)")
        }
        .padding(.horizontal, 20)
        .padding(.top, 12)
    }

    private var footer: some View {
        VStack(spacing: 10) {
            Button(page == .summary ? "Start using Nutra" : "Continue") { goForward() }
                .buttonStyle(.primary)
                .disabled(!canContinue)
            HStack {
                if step > 0 {
                    Button("Back") { go(to: step - 1) }
                        .frame(minWidth: Theme.tap, minHeight: Theme.tap)
                }
                Spacer()
                if page.canSkip {
                    Button("Skip for now") { go(to: step + 1) }
                        .frame(minHeight: Theme.tap)
                }
            }
            .font(.body.weight(.medium))
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 12)
        .background(Theme.background)
    }

    private var canContinue: Bool {
        switch page {
        case .welcome: return !draft.name.trimmingCharacters(in: .whitespaces).isEmpty
        case .goal: return !draft.goalIDs.isEmpty
        default: return true
        }
    }

    private func goForward() {
        if page == .summary {
            draft.goalIDs = GoalRules.allowedGoalIDs(draft.goalIDs, goals: store.data?.goals ?? [], profile: draft)
            store.updateProfile { $0 = draft }
            store.finishOnboarding()
        } else {
            go(to: step + 1)
        }
    }

    /// Saves the draft and the page, so setup resumes after the app is closed.
    private func go(to newStep: Int) {
        draft.goalIDs = GoalRules.allowedGoalIDs(draft.goalIDs, goals: store.data?.goals ?? [], profile: draft)
        store.updateProfile { $0 = draft }
        step = max(0, min(newStep, Page.allCases.count - 1))
        store.setOnboardingStep(step)
    }

    // MARK: Pages

    @ViewBuilder private var content: some View {
        switch page {
        case .welcome: WelcomePage(draft: $draft)
        case .goal: GoalPickerView(selected: $draft.goalIDs, profile: draft)
        case .body: BodyPage(draft: $draft)
        case .food: FoodPage(draft: $draft)
        case .style: StylePage(draft: $draft)
        case .summary: SummaryPage(draft: draft)
        }
    }
}

// MARK: - Welcome

private struct WelcomePage: View {
    @Binding var draft: Profile
    @State private var ageText = ""

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            LabeledField(title: "What should Nutra call you?") {
                TextField("Your first name", text: $draft.name)
                    .textContentType(.givenName)
                    .submitLabel(.next)
            }
            LabeledField(title: "How old are you?", hint: "Nutra uses this to keep advice safe for your age.") {
                TextField("Age", text: $ageText)
                    .keyboardType(.numberPad)
                    .onChange(of: ageText) { _, newValue in
                        // Age is committed on change: 5 to 17 is under-18, 18 or more is adult.
                        let digits = newValue.filter(\.isNumber)
                        draft.age = Int(digits).flatMap { (5...120).contains($0) ? $0 : nil }
                        if draft.isUnder18 { draft.isPregnant = false }
                    }
            }
            if draft.isUnder18 {
                HeadsUp(title: "Made for growing bodies", message: Disclaimers.under18)
            }
        }
        .onAppear { if let age = draft.age { ageText = String(age) } }
    }
}

// MARK: - Body

private struct BodyPage: View {
    @Binding var draft: Profile
    @State private var useImperial = Locale.current.measurementSystem == .us
    @State private var heightText = ""
    @State private var weightText = ""
    @State private var feetText = ""
    @State private var inchesText = ""

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            LabeledField(title: "Sex", hint: "Used only to estimate energy needs.") {
                Picker("Sex", selection: $draft.sex) {
                    ForEach(Sex.allCases) { Text($0.title).tag($0) }
                }
                .pickerStyle(.segmented)
            }
            Toggle("Use feet and pounds", isOn: $useImperial)
                .frame(minHeight: Theme.tap)
            if useImperial {
                LabeledField(title: "Height") {
                    HStack {
                        TextField("Feet", text: $feetText).keyboardType(.numberPad)
                        TextField("Inches", text: $inchesText).keyboardType(.numberPad)
                    }
                }
                LabeledField(title: "Weight (pounds)") {
                    TextField("Pounds", text: $weightText).keyboardType(.decimalPad)
                }
            } else {
                LabeledField(title: "Height (cm)") {
                    TextField("Centimeters", text: $heightText).keyboardType(.numberPad)
                }
                LabeledField(title: "Weight (kg)") {
                    TextField("Kilograms", text: $weightText).keyboardType(.decimalPad)
                }
            }
            LabeledField(title: "How active are you?") {
                Picker("Activity", selection: $draft.activity) {
                    ForEach(ActivityLevel.allCases) { Text($0.title).tag($0) }
                }
                .pickerStyle(.menu)
            }
            if !draft.isUnder18 && draft.sex != .male {
                Toggle("I'm pregnant", isOn: $draft.isPregnant)
                    .frame(minHeight: Theme.tap)
                if draft.isPregnant {
                    HeadsUp(title: "Pregnancy", message: Disclaimers.pregnancy)
                }
            }
        }
        .onAppear(perform: fillFields)
        .onChange(of: heightText) { commit() }
        .onChange(of: weightText) { commit() }
        .onChange(of: feetText) { commit() }
        .onChange(of: inchesText) { commit() }
        .onChange(of: useImperial) { fillFields() }
    }

    private func fillFields() {
        if useImperial {
            if let cm = draft.heightCm {
                let inches = Int((cm / 2.54).rounded())
                feetText = String(inches / 12)
                inchesText = String(inches % 12)
            }
            weightText = draft.weightKg.map { String(Int(($0 * 2.20462).rounded())) } ?? ""
        } else {
            heightText = draft.heightCm.map { String(Int($0.rounded())) } ?? ""
            weightText = draft.weightKg.map { String(format: "%.1f", $0) } ?? ""
        }
    }

    private func commit() {
        let weight = Double(weightText.replacingOccurrences(of: ",", with: "."))
        if useImperial {
            let feet = Double(feetText) ?? 0
            let inches = Double(inchesText) ?? 0
            let total = feet * 12 + inches
            draft.heightCm = total > 0 ? total * 2.54 : nil
            draft.weightKg = weight.map { $0 / 2.20462 }
        } else {
            draft.heightCm = Double(heightText)
            draft.weightKg = weight
        }
    }
}

// MARK: - Food

private struct FoodPage: View {
    @Binding var draft: Profile

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            LabeledField(title: "Anything you need to avoid?", hint: "Tap all that apply.") {
                FlowLayout {
                    ForEach(Allergen.allCases) { allergen in
                        ChoiceChip(title: allergen.displayName, isOn: draft.allergens.contains(allergen)) {
                            if let index = draft.allergens.firstIndex(of: allergen) {
                                draft.allergens.remove(at: index)
                            } else {
                                draft.allergens.append(allergen)
                            }
                        }
                    }
                }
            }
            LabeledField(title: "Eating style") {
                Picker("Eating style", selection: $draft.diet) {
                    ForEach(DietStyle.allCases) { Text($0.title).tag($0) }
                }
                .pickerStyle(.menu)
            }
            LabeledField(title: "Time to cook most days") {
                Picker("Time to cook", selection: $draft.cookingMinutes) {
                    Text("10 minutes").tag(10)
                    Text("20 minutes").tag(20)
                    Text("30 minutes").tag(30)
                    Text("45 minutes or more").tag(45)
                }
                .pickerStyle(.segmented)
            }
            Toggle("I have an oven", isOn: $draft.hasOven)
                .frame(minHeight: Theme.tap)
        }
    }
}

// MARK: - Style

private struct StylePage: View {
    @Binding var draft: Profile

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            if draft.isProtected {
                HeadsUp(title: "Gentle mode is on",
                        message: "Nutra shows food groups and kind words instead of numbers for you.",
                        systemImage: "heart")
            } else {
                StyleOption(title: "Show numbers",
                            detail: "Calories, protein and other amounts, as estimates.",
                            isOn: draft.displayStyle == .standard) { draft.displayStyle = .standard }
                StyleOption(title: "Gentle mode",
                            detail: "No numbers at all. Food groups, variety and kind words instead.",
                            isOn: draft.displayStyle == .gentle) { draft.displayStyle = .gentle }
            }
        }
    }
}

private struct StyleOption: View {
    var title: String
    var detail: String
    var isOn: Bool
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: isOn ? "largecircle.fill.circle" : "circle")
                    .font(.title2)
                    .foregroundStyle(Theme.indigo)
                VStack(alignment: .leading, spacing: 4) {
                    Text(title).font(.headline)
                    Text(detail).font(.subheadline).foregroundStyle(.secondary)
                }
                Spacer(minLength: 0)
            }
            .padding(16)
            .background(isOn ? Theme.indigoSoft : Theme.card,
                        in: RoundedRectangle(cornerRadius: Theme.corner, style: .continuous))
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(isOn ? .isSelected : [])
    }
}

// MARK: - Summary (includes the neutral Pro section)

private struct SummaryPage: View {
    @Environment(AppStore.self) private var store
    var draft: Profile

    var body: some View {
        let goals = store.data?.goals(ids: draft.goalIDs) ?? []
        VStack(alignment: .leading, spacing: 16) {
            Card {
                Label(goals.first?.title ?? "Explore", systemImage: "target")
                    .font(.headline)
                Text("Nutra will build your Today screen around this goal.")
                    .foregroundStyle(.secondary)
            }
            Card {
                Label("Log meals your way", systemImage: "text.bubble").font(.headline)
                Text("Type, speak or snap a photo. Nutra does the math.").foregroundStyle(.secondary)
            }
            Card {
                Label("Ideas when you need them", systemImage: "lightbulb").font(.headline)
                Text("Meal ideas, workouts and answers live in the Coach tab.").foregroundStyle(.secondary)
            }
            ProOffer(goals: goals, isPro: store.isPro) { store.setProDemo($0) }
            DisclaimerFooter(extra: Disclaimers.professionalReview)
        }
    }
}

/// Neutral Pro offer: equal "Try Pro" and "Not now" buttons, no pressure.
struct ProOffer: View {
    var goals: [Goal]
    var isPro: Bool
    var choose: (Bool) -> Void

    var body: some View {
        Card(tint: Theme.indigoSoft) {
            Text("Nutra Pro (optional)").font(.headline)
            Text("A 7-day meal plan, shopping list, unlimited coach questions and more workouts.")
                .font(.subheadline)
            if !goals.isEmpty {
                Text("Relates to your goals:").font(.caption.weight(.semibold)).foregroundStyle(.secondary)
                FlowLayout { ForEach(goals) { Pill(text: $0.title) } }
            }
            if isPro {
                Label("Pro is on (demo)", systemImage: "checkmark.circle").foregroundStyle(Theme.teal)
            } else {
                HStack(spacing: 12) {
                    Button("Try Pro") { choose(true) }.buttonStyle(.secondary)
                    Button("Not now") { choose(false) }.buttonStyle(.secondary)
                }
            }
            Text("Everything in Nutra's free version stays free.")
                .font(.caption).foregroundStyle(.secondary)
        }
    }
}

/// A title above any field, with an optional hint.
struct LabeledField<Field: View>: View {
    var title: String
    var hint: String?
    @ViewBuilder var field: Field

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title).font(.headline)
            if let hint { Text(hint).font(.footnote).foregroundStyle(.secondary) }
            field
                .padding(.horizontal, 12)
                .frame(minHeight: Theme.tap)
                .background(Theme.card, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
    }
}

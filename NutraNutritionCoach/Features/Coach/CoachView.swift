import SwiftUI
import NutraCore

/// The Coach hub. Instead of a long bar of segments, three plain groups:
/// Ask, Eat and Move. Each row says what it does in a few words.
struct CoachView: View {
    var body: some View {
        NavigationStack {
            List {
                Section("Ask") {
                    HubRow(title: "Ask a question", detail: "Food, habits and training, in plain words",
                           systemImage: "bubble.left.and.text.bubble.right") { AskView() }
                }
                Section("Eat") {
                    HubRow(title: "Meal ideas for today", detail: "Breakfast to dinner, made for you",
                           systemImage: "fork.knife") { MealsView() }
                    HubRow(title: "Recipes", detail: "Simple recipes with steps",
                           systemImage: "book") { RecipeListView() }
                    HubRow(title: "My foods", detail: "Add foods Nutra doesn't know",
                           systemImage: "square.and.pencil") { FoodsView() }
                }
                Section("Move") {
                    HubRow(title: "Workout plan", detail: "2 to 6 days, gym, dumbbells or none",
                           systemImage: "figure.strengthtraining.traditional") { WorkoutsView() }
                    HubRow(title: "Sore or injured?", detail: "Gentle movement and when to get help",
                           systemImage: "bandage") { RehabView() }
                }
                Section {
                    Text(Disclaimers.professionalReview).font(.footnote).foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Coach")
        }
    }
}

private struct HubRow<Destination: View>: View {
    var title: String
    var detail: String
    var systemImage: String
    @ViewBuilder var destination: () -> Destination

    var body: some View {
        NavigationLink {
            destination()
        } label: {
            Label {
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).font(.body.weight(.semibold))
                    Text(detail).font(.footnote).foregroundStyle(.secondary)
                }
            } icon: {
                Image(systemName: systemImage).foregroundStyle(Theme.indigo)
            }
            .frame(minHeight: Theme.tap)
        }
    }
}

// MARK: - Ask

struct AskView: View {
    @Environment(AppStore.self) private var store
    @State private var question = ""
    @State private var conversation: [Turn] = []
    @State private var thinking = false
    @State private var showPaywall = false

    var body: some View {
        let engine = CoachEngine(entries: store.data?.coach ?? [])
        ScreenScroll {
            if conversation.isEmpty {
                Text("Try one of these").font(.headline)
                FlowLayout {
                    ForEach(engine.entries) { entry in
                        ChoiceChip(title: entry.question, isOn: false) { ask(entry.question, engine: engine) }
                    }
                }
            }
            ForEach(conversation) { turn in
                VStack(alignment: .trailing, spacing: 8) {
                    Text(turn.question)
                        .padding(12)
                        .background(Theme.indigoSoft, in: RoundedRectangle(cornerRadius: 14))
                    Card { Text(turn.answer).fixedSize(horizontal: false, vertical: true) }
                }
                .frame(maxWidth: .infinity, alignment: .trailing)
            }
            if thinking { ProgressView() }
            HStack {
                TextField("Ask Nutra anything about food", text: $question)
                    .padding(12)
                    .background(Theme.card, in: RoundedRectangle(cornerRadius: 14))
                    .submitLabel(.send)
                    .onSubmit { ask(question, engine: engine) }
                Button {
                    ask(question, engine: engine)
                } label: {
                    Image(systemName: "arrow.up.circle.fill").font(.largeTitle)
                }
                .accessibilityLabel("Send")
                .disabled(question.trimmingCharacters(in: .whitespaces).isEmpty)
            }
            if !store.isPro {
                Text(store.coachQuestionsLeft == 1 ? "1 free question left today."
                     : "\(store.coachQuestionsLeft) free questions left today.")
                    .font(.footnote).foregroundStyle(.secondary)
            }
            DisclaimerFooter()
        }
        .navigationTitle("Ask")
        .sheet(isPresented: $showPaywall) { PaywallView() }
    }

    private func ask(_ text: String, engine: CoachEngine) {
        let clean = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !clean.isEmpty, !thinking else { return }
        // Locked actions open the paywall; they never fail silently.
        guard store.coachQuestionsLeft > 0 else {
            showPaywall = true
            return
        }
        store.useCoachQuestion()
        question = ""
        let local = engine.reply(to: clean)
        // Safety replies and exact matches never go to the live coach.
        guard local.kind == .fallback, BackendService.isConfigured else {
            conversation.append(Turn(question: clean, answer: local.text))
            return
        }
        thinking = true
        let goal = store.goals.first?.title ?? "none"
        Task {
            let live = await BackendService.askCoach(clean, context: "Goal: \(goal)")
            conversation.append(Turn(question: clean, answer: live ?? local.text))
            thinking = false
        }
    }
}

private struct Turn: Identifiable {
    let id = UUID()
    var question: String
    var answer: String
}

/// Neutral paywall: equal choices, no countdowns, no pressure.
struct PaywallView: View {
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScreenScroll {
                Text("This is part of Nutra Pro").font(.title.bold())
                ProOffer(goals: store.goals, isPro: store.isPro) { choice in
                    store.setProDemo(choice)
                    dismiss()
                }
                Text("Pro is a demo switch for now. No payment is taken.")
                    .font(.footnote).foregroundStyle(.secondary)
                // NEEDS: App Store Connect product ids; then StoreKit 2 purchase replaces the demo switch.
            }
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Close") { dismiss() } }
            }
        }
    }
}

import SwiftUI
import NutraCore

/// The home screen. Built from goal-specific modules (see DashboardBuilder in NutraCore).
/// Order: greeting, one clear action, safety notes if any, then a few calm cards.
struct TodayView: View {
    @Environment(AppStore.self) private var store
    var openLog: () -> Void
    @State private var mealToDelete: MealEntry?

    var body: some View {
        NavigationStack {
            ScreenScroll {
                VStack(alignment: .leading, spacing: 4) {
                    Text(greeting).font(.largeTitle.bold())
                    if let goal = store.goals.first {
                        Text("Focus: \(goal.title)").font(.subheadline).foregroundStyle(.secondary)
                    }
                }

                Button(action: openLog) {
                    Label("Log a meal", systemImage: "plus")
                }
                .buttonStyle(.primary)

                ForEach(store.targets.notices, id: \.self) { notice in
                    HeadsUp(title: "Please note", message: notice.message, systemImage: "heart")
                }

                ForEach(store.dashboard) { card in
                    ModuleCardView(card: card)
                }

                if !store.todaysMeals.isEmpty {
                    Text("Today").font(.title3.bold()).padding(.top, 4)
                    ForEach(store.todaysMeals) { meal in
                        MealRow(meal: meal, gentle: store.isGentle)
                            .contextMenu {
                                Button("Remove this meal", systemImage: "trash") { mealToDelete = meal }
                            }
                    }
                }

                DisclaimerFooter(extra: store.isGentle ? nil : Disclaimers.estimates)
            }
            .navigationTitle("Today")
            .toolbar(.hidden, for: .navigationBar)
            .alert("Remove this meal?", isPresented: Binding(
                get: { mealToDelete != nil }, set: { if !$0 { mealToDelete = nil } })) {
                Button("Remove") {
                    if let meal = mealToDelete { store.deleteMeal(meal.id) }
                    mealToDelete = nil
                }
                Button("Keep it", role: .cancel) { mealToDelete = nil }
            }
        }
    }

    private var greeting: String {
        let hour = Calendar.current.component(.hour, from: .now)
        let part = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"
        let name = store.profile.name.trimmingCharacters(in: .whitespaces)
        return name.isEmpty ? part : "\(part), \(name)"
    }
}

/// Draws any dashboard module. The view never decides what to hide: the card already
/// comes without numbers in gentle mode.
struct ModuleCardView: View {
    var card: ModuleCard

    var body: some View {
        Card {
            Label(card.title, systemImage: card.systemImage)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(Theme.indigo)
            Text(card.headline)
                .font(.title3.weight(.semibold))
                .fixedSize(horizontal: false, vertical: true)
            if let progress = card.progress {
                CalmBar(value: progress)
            }
            Text(card.detail)
                .font(.footnote)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .accessibilityElement(children: .combine)
    }
}

struct MealRow: View {
    var meal: MealEntry
    var gentle: Bool

    var body: some View {
        Card {
            HStack(alignment: .firstTextBaseline) {
                Text(meal.slot.title).font(.subheadline.weight(.semibold)).foregroundStyle(Theme.indigo)
                Spacer()
                Text(meal.date, style: .time).font(.footnote).foregroundStyle(.secondary)
            }
            Text(meal.title).font(.body)
            if !gentle {
                Text("About \(Int(meal.nutrients.calories.rounded())) kcal · \(Int(meal.nutrients.protein.rounded())) g protein")
                    .font(.footnote).foregroundStyle(.secondary)
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityHint("Touch and hold to remove")
    }
}

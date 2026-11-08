import SwiftUI
import NutraCore

/// The one review screen every logging path leads to.
/// Simple first: the summary and a short insight. Details live behind "More detail".
struct MealReviewView: View {
    @Environment(AppStore.self) private var store
    let draft: ReviewDraft
    /// Called with true when saved, false when discarded.
    var finish: (Bool) -> Void

    @State private var items: [LoggedItem] = []
    @State private var unrecognized: [String] = []
    @State private var slot: MealSlot = MealSlot.guess(for: .now)
    @State private var showAddFood = false
    @State private var newFoodName: NewFoodName?
    @State private var showDetail = false
    @State private var started = false

    private var currentAnalysis: MealAnalysis {
        MealAnalyzer.analyze(items: items, unrecognizedCount: unrecognized.count,
                             source: draft.source, profile: store.profile)
    }

    var body: some View {
        let analysis = currentAnalysis
        let gentle = store.isGentle
        NavigationStack {
            ScreenScroll {
                Picker("Meal", selection: $slot) {
                    ForEach(MealSlot.allCases) { Text($0.title).tag($0) }
                }
                .pickerStyle(.segmented)
                .accessibilityLabel("Which meal is this")

                summary(analysis, gentle: gentle)

                if !analysis.personalAllergenWarnings.isEmpty {
                    HeadsUp(title: "Heads-up: your allergens",
                            message: "This may contain " +
                                analysis.personalAllergenWarnings.map(\.displayName).joined(separator: ", ") +
                                ". Check labels and ingredients.")
                }
                if analysis.hasFried {
                    HeadsUp(title: "Fried food", message: "Enjoy it! Baked or grilled is an easy swap sometimes.",
                            systemImage: "info.circle")
                }

                Card {
                    Text("Quick take").font(.headline)
                    Text(analysis.insight).fixedSize(horizontal: false, vertical: true)
                }

                Text("What's in it").font(.title3.bold())
                ForEach($items) { $item in
                    ItemRow(item: $item) { items.removeAll { $0.id == item.id } }
                }
                if !unrecognized.isEmpty {
                    Text(Disclaimers.notInNutra).font(.subheadline.weight(.semibold))
                    Text("Tap one to add it as your own food.").font(.footnote).foregroundStyle(.secondary)
                    FlowLayout {
                        ForEach(unrecognized, id: \.self) { phrase in
                            ChoiceChip(title: phrase, isOn: false) { newFoodName = NewFoodName(name: phrase) }
                        }
                    }
                }
                Button {
                    showAddFood = true
                } label: {
                    Label("Add a food", systemImage: "plus")
                }
                .buttonStyle(.secondary)

                if !gentle && !items.isEmpty {
                    DisclosureGroup("More detail", isExpanded: $showDetail) {
                        DetailSection(analysis: analysis).padding(.top, 8)
                    }
                    .font(.headline)
                    .padding(16)
                    .background(Theme.card, in: RoundedRectangle(cornerRadius: Theme.corner, style: .continuous))
                }

                DisclaimerFooter(extra: draft.source == .photo ? Disclaimers.photoEstimate : Disclaimers.estimates)
            }
            .navigationTitle("Review")
            .navigationBarTitleDisplayMode(.inline)
            .safeAreaInset(edge: .bottom) {
                HStack(spacing: 12) {
                    Button("Discard") { finish(false) }
                        .buttonStyle(.secondary)
                    Button("Save") { save() }
                        .buttonStyle(.primary)
                        .disabled(items.isEmpty)
                }
                .padding(16)
                .background(.bar)
            }
            .sheet(isPresented: $showAddFood) {
                FoodPickerSheet { food in
                    items.append(LoggedItem(food: food, portions: 1))
                }
                .environment(store)
            }
            .sheet(item: $newFoodName) { pending in
                AddFoodView(startName: pending.name) { food in
                    store.addUserFood(food)
                    items.append(LoggedItem(food: food, portions: 1))
                    unrecognized.removeAll { $0 == pending.name }
                }
                .environment(store)
            }
        }
        .onAppear {
            guard !started else { return }
            items = draft.items
            unrecognized = draft.unrecognized
            started = true
        }
    }

    @ViewBuilder
    private func summary(_ analysis: MealAnalysis, gentle: Bool) -> some View {
        Card {
            HStack {
                Text("This meal").font(.headline)
                Spacer()
                Pill(text: analysis.confidence.label,
                     color: analysis.confidence == .low ? Theme.amber : Theme.teal)
            }
            if gentle {
                let groups = Set(items.map(\.food.group))
                Text(groups.isEmpty ? "Add a food to get started."
                     : "Food groups: " + groups.map(\.friendlyName).sorted().joined(separator: ", ") + ".")
                    .font(.title3.weight(.semibold))
            } else {
                Text("About \(Int(analysis.totals.calories.rounded())) kcal")
                    .font(.title.bold())
                HStack(spacing: 16) {
                    Macro(name: "Protein", grams: analysis.totals.protein)
                    Macro(name: "Carbs", grams: analysis.totals.carbs)
                    Macro(name: "Fat", grams: analysis.totals.fat)
                    Macro(name: "Fiber", grams: analysis.totals.fiber)
                }
                Pill(text: Disclaimers.estimateShort, color: .secondary)
            }
        }
    }

    private func save() {
        store.addMeal(MealEntry(date: .now, slot: slot, items: items, source: draft.source))
        finish(true)
    }
}

private struct NewFoodName: Identifiable {
    var name: String
    var id: String { name }
}

private struct Macro: View {
    var name: String
    var grams: Double

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("\(Int(grams.rounded())) g").font(.headline)
            Text(name).font(.caption).foregroundStyle(.secondary)
        }
        .accessibilityElement(children: .combine)
    }
}

/// One food with a portion stepper.
private struct ItemRow: View {
    @Binding var item: LoggedItem
    var remove: () -> Void

    var body: some View {
        Card {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(item.food.name).font(.body.weight(.semibold))
                    Text(item.food.source.label).font(.caption).foregroundStyle(.secondary)
                }
                Spacer()
                Button(action: remove) {
                    Image(systemName: "xmark.circle")
                        .font(.title3)
                        .frame(width: Theme.tap, height: Theme.tap)
                }
                .buttonStyle(.plain)
                .foregroundStyle(.secondary)
                .accessibilityLabel("Remove \(item.food.name)")
            }
            Stepper(value: $item.portions, in: 0.25...20, step: 0.25) {
                Text("\(portionText) × \(item.food.portionName)")
            }
            .accessibilityValue("\(portionText) \(item.food.portionName)")
        }
    }

    private var portionText: String {
        item.portions == item.portions.rounded() ? String(Int(item.portions)) : String(format: "%.2g", item.portions)
    }
}

/// Glycemic index and load, plus % daily value for ten micronutrients.
private struct DetailSection: View {
    var analysis: MealAnalysis

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            if let gi = analysis.glycemicIndex {
                row("Glycemic index", "\(gi)")
            }
            row("Glycemic load", "\(analysis.glycemicLoadLabel) (\(String(format: "%.0f", analysis.glycemicLoad)))")
            Divider()
            Text("Daily value").font(.subheadline.weight(.semibold))
            ForEach(Micronutrient.allCases) { micro in
                row(micro.displayName, "\(analysis.percentDailyValue(micro))%")
            }
            Text("Percent of an adult daily value. Estimates.")
                .font(.caption).foregroundStyle(.secondary)
        }
        .font(.subheadline)
    }

    private func row(_ name: String, _ value: String) -> some View {
        HStack {
            Text(name)
            Spacer()
            Text(value).monospacedDigit().foregroundStyle(.secondary)
        }
        .accessibilityElement(children: .combine)
    }
}

/// A to Z list of every food, with search.
struct FoodPickerSheet: View {
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    var pick: (Food) -> Void
    @State private var search = ""

    var body: some View {
        NavigationStack {
            List(filtered) { food in
                Button {
                    pick(food)
                    dismiss()
                } label: {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(food.name).foregroundStyle(.primary)
                        Text("1 \(food.portionName) · \(food.source.label)")
                            .font(.caption).foregroundStyle(.secondary)
                    }
                    .frame(minHeight: 40)
                }
            }
            .searchable(text: $search, prompt: "Search foods")
            .navigationTitle("Add a food")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Close") { dismiss() } }
            }
        }
    }

    private var filtered: [Food] {
        let all = store.allFoods.sorted { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }
        let query = search.trimmingCharacters(in: .whitespaces).lowercased()
        guard !query.isEmpty else { return all }
        return all.filter { food in food.matchTerms.contains { $0.contains(query) } }
    }
}

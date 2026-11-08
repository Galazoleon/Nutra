import SwiftUI
import NutraCore

/// Meal ideas for today. Built to the person's goal, allergies, diet, time and oven.
/// Pro adds a 7-day plan and a shopping list.
struct MealsView: View {
    @Environment(AppStore.self) private var store
    @State private var seed: UInt32 = UInt32(Calendar.current.ordinality(of: .day, in: .era, for: .now) ?? 1)
    @State private var showWeek = false
    @State private var showPaywall = false
    @State private var logged: String?

    var body: some View {
        let recipes = store.data?.recipes ?? []
        let request = PlannerRequest(profile: store.profile, targets: store.targets, seed: seed)
        let plan = MealPlanner.planDay(recipes: recipes, request: request)
        ScreenScroll {
            Text("Built around your goal, allergies, time and kitchen.")
                .foregroundStyle(.secondary)

            if plan.meals.isEmpty {
                Card {
                    Text("No recipes fit all your settings yet.")
                    Text("Try allowing more cooking time in Profile.").foregroundStyle(.secondary)
                }
            }
            ForEach(plan.meals) { meal in
                NavigationLink {
                    RecipeDetailView(recipe: meal.recipe, scale: meal.scale)
                } label: {
                    PlannedMealCard(meal: meal, gentle: store.isGentle)
                }
                .buttonStyle(.plain)
            }
            if let logged {
                Label(logged, systemImage: "checkmark.circle").foregroundStyle(Theme.teal)
            }

            Button {
                seed = seed &+ 1
            } label: {
                Label("Show different ideas", systemImage: "arrow.triangle.2.circlepath")
            }
            .buttonStyle(.secondary)

            Button {
                if store.isPro { showWeek = true } else { showPaywall = true }
            } label: {
                Label("7-day plan and shopping list", systemImage: store.isPro ? "calendar" : "lock")
            }
            .buttonStyle(.secondary)

            DisclaimerFooter(extra: Disclaimers.professionalReview)
        }
        .navigationTitle("Meal ideas")
        .navigationDestination(isPresented: $showWeek) {
            WeekPlanView(request: request)
        }
        .sheet(isPresented: $showPaywall) { PaywallView() }
    }
}

private struct PlannedMealCard: View {
    var meal: PlannedMeal
    var gentle: Bool

    var body: some View {
        Card {
            HStack {
                Text(meal.slot.title).font(.subheadline.weight(.semibold)).foregroundStyle(Theme.indigo)
                Spacer()
                Label("\(meal.recipe.minutes) min", systemImage: "clock")
                    .font(.footnote).foregroundStyle(.secondary)
            }
            Text(meal.recipe.name).font(.headline)
            if !gentle {
                Text("About \(Int(meal.nutrients.calories.rounded())) kcal · \(Int(meal.nutrients.protein.rounded())) g protein")
                    .font(.footnote).foregroundStyle(.secondary)
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityHint("Opens the recipe")
    }
}

/// All recipes, filtered to what this person can eat.
struct RecipeListView: View {
    @Environment(AppStore.self) private var store

    var body: some View {
        let profile = store.profile
        let request = PlannerRequest(energyTarget: 2000, diet: profile.diet, avoid: profile.allergens,
                                     maxMinutes: 120, hasOven: true, seed: 0)
        let recipes = MealPlanner.eligible(store.data?.recipes ?? [], for: request)
        List(recipes) { recipe in
            NavigationLink {
                RecipeDetailView(recipe: recipe, scale: 1)
            } label: {
                VStack(alignment: .leading, spacing: 2) {
                    Text(recipe.name)
                    Text("\(recipe.minutes) min · " + recipe.slots.map(\.title).joined(separator: ", "))
                        .font(.caption).foregroundStyle(.secondary)
                }
                .frame(minHeight: 40)
            }
        }
        .navigationTitle("Recipes")
        .overlay {
            if recipes.isEmpty {
                ContentUnavailableView("No recipes fit your settings", systemImage: "book",
                                       description: Text("Check your allergies and eating style in Profile."))
            }
        }
    }
}

struct RecipeDetailView: View {
    @Environment(AppStore.self) private var store
    var recipe: Recipe
    var scale: Double
    @State private var saved = false

    var body: some View {
        ScreenScroll {
            Text(recipe.name).font(.largeTitle.bold())
            HStack {
                Pill(text: "\(recipe.minutes) min")
                if recipe.needsOven { Pill(text: "Oven") }
                if scale != 1 { Pill(text: "\(String(format: "%g", scale)) servings") }
            }
            if !store.isGentle {
                let n = recipe.nutrients.scaled(by: scale)
                Text("About \(Int(n.calories.rounded())) kcal · \(Int(n.protein.rounded())) g protein · " +
                     "\(Int(n.fiber.rounded())) g fiber (estimate)")
                    .font(.subheadline).foregroundStyle(.secondary)
            }
            if !recipe.allergens.isEmpty {
                Text("Contains: " + recipe.allergens.map(\.displayName).joined(separator: ", "))
                    .font(.subheadline)
            }

            Card {
                Text("Ingredients").font(.headline)
                ForEach(recipe.ingredients, id: \.self) { item in
                    let amount = ShoppingItem(name: item.name, amount: item.amount * scale,
                                              unit: item.unit, aisle: item.aisle).amountLabel
                    Text("• \(amount) \(item.name)")
                }
            }
            Card {
                Text("Steps").font(.headline)
                ForEach(Array(recipe.steps.enumerated()), id: \.offset) { index, step in
                    HStack(alignment: .top, spacing: 10) {
                        Text("\(index + 1)").font(.headline).foregroundStyle(Theme.indigo)
                            .frame(width: 24)
                        Text(step).fixedSize(horizontal: false, vertical: true)
                    }
                    .accessibilityElement(children: .combine)
                }
            }
            if let swap = recipe.swapTip {
                HeadsUp(title: "Swap idea", message: swap, systemImage: "arrow.left.arrow.right")
            }

            Button(saved ? "Logged" : "I ate this") { log() }
                .buttonStyle(.primary)
                .disabled(saved)
            DisclaimerFooter(extra: Disclaimers.professionalReview)
        }
        .navigationBarTitleDisplayMode(.inline)
    }

    /// Logs the recipe as one item so it shows on Today.
    private func log() {
        let food = Food(id: "recipe-" + recipe.id, name: recipe.name, portionName: "serving",
                        portionGrams: 300, group: .mixed, nutrients: recipe.nutrients,
                        allergens: recipe.allergens)
        store.addMeal(MealEntry(date: .now, slot: recipe.slots.first ?? MealSlot.guess(for: .now),
                                items: [LoggedItem(food: food, portions: scale)], source: .plan))
        saved = true
    }
}

/// Pro: seven days of meals plus a combined shopping list with checkmarks.
struct WeekPlanView: View {
    @Environment(AppStore.self) private var store
    var request: PlannerRequest
    @State private var checked: Set<String> = []
    @State private var tab = 0

    var body: some View {
        let week = MealPlanner.planWeek(recipes: store.data?.recipes ?? [], request: request)
        VStack(spacing: 0) {
            Picker("View", selection: $tab) {
                Text("Plan").tag(0)
                Text("Shopping list").tag(1)
            }
            .pickerStyle(.segmented)
            .padding(16)
            if tab == 0 {
                List {
                    ForEach(Array(week.enumerated()), id: \.offset) { index, day in
                        Section(dayName(index)) {
                            ForEach(day.meals) { meal in
                                NavigationLink {
                                    RecipeDetailView(recipe: meal.recipe, scale: meal.scale)
                                } label: {
                                    VStack(alignment: .leading) {
                                        Text(meal.slot.title).font(.caption).foregroundStyle(.secondary)
                                        Text(meal.recipe.name)
                                    }
                                }
                            }
                        }
                    }
                    Section {
                        Text("Batch-prep tip: cook grains and proteins for two or three days at once, " +
                             "then mix them into the week's meals.")
                            .font(.footnote)
                    }
                }
            } else {
                List {
                    ForEach(ShoppingList.build(from: week), id: \.aisle) { group in
                        Section(group.aisle) {
                            ForEach(group.items) { item in
                                Button {
                                    if checked.contains(item.id) { checked.remove(item.id) } else { checked.insert(item.id) }
                                } label: {
                                    HStack {
                                        Image(systemName: checked.contains(item.id) ? "checkmark.circle.fill" : "circle")
                                            .foregroundStyle(Theme.indigo)
                                        Text(item.name).strikethrough(checked.contains(item.id))
                                        Spacer()
                                        Text(item.amountLabel).foregroundStyle(.secondary)
                                    }
                                    .frame(minHeight: 40)
                                }
                                .buttonStyle(.plain)
                                .accessibilityAddTraits(checked.contains(item.id) ? .isSelected : [])
                            }
                        }
                    }
                }
            }
        }
        .background(Theme.background)
        .navigationTitle("Your week")
    }

    private func dayName(_ index: Int) -> String {
        let date = Calendar.current.date(byAdding: .day, value: index, to: .now) ?? .now
        return date.formatted(.dateTime.weekday(.wide))
    }
}

import SwiftUI
import NutraCore

/// "My foods": the person's own food dictionary.
struct FoodsView: View {
    @Environment(AppStore.self) private var store
    @State private var showAdd = false

    var body: some View {
        List {
            Section {
                Button {
                    showAdd = true
                } label: {
                    Label("Add a food Nutra doesn't know", systemImage: "plus")
                        .frame(minHeight: Theme.tap)
                }
            } footer: {
                Text("Your foods are labeled \"\(Disclaimers.userFood)\". " +
                     "Copy the numbers from the package label when you can.")
            }
            if !store.userFoods.isEmpty {
                Section("Your foods") {
                    ForEach(store.userFoods) { food in
                        VStack(alignment: .leading, spacing: 2) {
                            Text(food.name)
                            Text(food.source.label).font(.caption).foregroundStyle(.secondary)
                        }
                        .swipeActions {
                            Button("Remove") { store.deleteUserFood(food.id) }
                                .tint(Theme.amber)
                        }
                    }
                }
            }
            Section("Nutra's foods") {
                Text("\(store.data?.foods.count ?? 0) built-in foods. \(Disclaimers.estimates)")
                    .font(.footnote).foregroundStyle(.secondary)
            }
        }
        .navigationTitle("My foods")
        .sheet(isPresented: $showAdd) {
            AddFoodView(startName: "") { store.addUserFood($0) }
        }
    }
}

/// Form for a person-made food. Numbers are per one portion.
struct AddFoodView: View {
    @Environment(\.dismiss) private var dismiss
    var startName: String
    var save: (Food) -> Void

    @State private var name = ""
    @State private var portion = "serving"
    @State private var calories = ""
    @State private var protein = ""
    @State private var carbs = ""
    @State private var fat = ""
    @State private var fiber = ""
    @State private var group: FoodGroup = .mixed

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Name", text: $name)
                    TextField("Portion (for example: bowl, slice, bar)", text: $portion)
                    Picker("Type of food", selection: $group) {
                        ForEach(FoodGroup.allCases, id: \.self) { Text($0.friendlyName.capitalized).tag($0) }
                    }
                }
                Section {
                    numberField("Calories", $calories)
                    numberField("Protein (g)", $protein)
                    numberField("Carbs (g)", $carbs)
                    numberField("Fat (g)", $fat)
                    numberField("Fiber (g)", $fiber)
                } header: {
                    Text("Per portion (optional)")
                } footer: {
                    Text("Leave blank if you don't know. Saved as \"\(Disclaimers.userFood)\".")
                }
                // NEEDS: label scanning (Vision text recognition) and barcode lookup through the
                // Supabase lookup-food function. Both fill these same fields.
            }
            .navigationTitle("Your food")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        save(makeFood())
                        dismiss()
                    }
                    .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
            .onAppear { if name.isEmpty { name = startName.capitalized } }
        }
    }

    private func numberField(_ title: String, _ text: Binding<String>) -> some View {
        HStack {
            Text(title)
            Spacer()
            TextField("0", text: text)
                .keyboardType(.decimalPad)
                .multilineTextAlignment(.trailing)
                .frame(maxWidth: 120)
        }
    }

    private func makeFood() -> Food {
        func number(_ text: String) -> Double { Double(text.replacingOccurrences(of: ",", with: ".")) ?? 0 }
        let clean = name.trimmingCharacters(in: .whitespaces)
        let slug = clean.lowercased().map { $0.isLetter || $0.isNumber ? $0 : "-" }
        return Food(id: "user-" + String(slug), name: clean, aliases: [clean.lowercased()],
                    portionName: portion.isEmpty ? "serving" : portion, portionGrams: 100, group: group,
                    nutrients: Nutrients(calories: number(calories), protein: number(protein),
                                         carbs: number(carbs), fat: number(fat), fiber: number(fiber)),
                    source: .userMade)
    }
}

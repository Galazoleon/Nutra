import SwiftUI
import NutraCore

/// Settings, grouped into a few plain sections.
struct ProfileView: View {
    @Environment(AppStore.self) private var store
    @State private var editingGoals = false
    @State private var editingAbout = false
    @State private var confirmDelete = false
    @State private var confirmRedo = false
    @State private var exportURL: URL?
    @State private var exportError: String?

    var body: some View {
        let profile = store.profile
        NavigationStack {
            List {
                Section {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(profile.name.isEmpty ? "You" : profile.name).font(.title2.bold())
                        Text(store.goals.map(\.title).joined(separator: " · "))
                            .font(.subheadline).foregroundStyle(.secondary)
                    }
                    .padding(.vertical, 4)
                }

                Section("Your plan") {
                    Button("Change goals") { editingGoals = true }
                    if let calories = store.targets.calories, !store.isGentle {
                        LabeledContent("Starting energy", value: "About \(calories) kcal")
                        if let protein = store.targets.proteinGrams {
                            LabeledContent("Protein", value: "About \(protein) g")
                        }
                    }
                    ForEach(store.targets.notes, id: \.self) { note in
                        Text(note).font(.footnote).foregroundStyle(.secondary)
                    }
                }

                Section {
                    Picker("Show progress", selection: Binding(
                        get: { profile.effectiveDisplayStyle },
                        set: { value in store.updateProfile { $0.displayStyle = value } })) {
                        ForEach(DisplayStyle.allCases) { Text($0.title).tag($0) }
                    }
                    .disabled(profile.isProtected)
                } header: {
                    Text("How Nutra looks")
                } footer: {
                    if profile.isProtected {
                        Text("Gentle mode stays on for you, so Nutra shows no numbers.")
                    }
                }

                Section("About you") {
                    Button("Edit details") { editingAbout = true }
                    NavigationLink("My foods") { FoodsView() }
                }

                Section("Nutra Pro") {
                    Toggle("Pro (demo switch)", isOn: Binding(
                        get: { store.isPro }, set: { store.setProDemo($0) }))
                    Text("No payment is taken. Real subscriptions arrive when the App Store products are set up.")
                        .font(.footnote).foregroundStyle(.secondary)
                }

                Section("Health data") {
                    Text("Connecting Apple Health is coming. Nutra will show clearly labeled sample data until then.")
                        .font(.footnote).foregroundStyle(.secondary)
                    // NEEDS: HealthKit capability and a signing Team, then HealthService.
                }

                Section("Your data") {
                    Button("Export my data") { export() }
                    if let exportURL {
                        ShareLink("Share export file", item: exportURL)
                    }
                    if let exportError {
                        Text(exportError).font(.footnote)
                    }
                    Button("Redo setup") { confirmRedo = true }
                    Button("Delete everything") { confirmDelete = true }
                        .foregroundStyle(Theme.amber)
                }

                Section("About Nutra") {
                    Text(Disclaimers.educational)
                    Text(Disclaimers.estimates)
                    Text(Disclaimers.professionalReview)
                }
                .font(.footnote)
                .foregroundStyle(.secondary)
            }
            .navigationTitle("Profile")
            .sheet(isPresented: $editingGoals) { GoalEditSheet() }
            .sheet(isPresented: $editingAbout) { AboutYouSheet() }
            .alert("Delete everything?", isPresented: $confirmDelete) {
                Button("Delete") { store.deleteEverything() }
                Button("Keep my data", role: .cancel) {}
            } message: {
                Text("This removes your profile, meals and foods from this phone. It can't be undone.")
            }
            .alert("Redo setup?", isPresented: $confirmRedo) {
                Button("Redo setup") { store.redoSetup() }
                Button("Not now", role: .cancel) {}
            } message: {
                Text("Your meals and foods stay. You'll answer the setup questions again.")
            }
        }
    }

    private func export() {
        do {
            exportURL = try store.exportFile()
            exportError = nil
        } catch {
            exportError = "Nutra couldn't make the export file. Please try again."
        }
    }
}

private struct GoalEditSheet: View {
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    @State private var selected: [String] = []

    var body: some View {
        NavigationStack {
            ScrollView {
                GoalPickerView(selected: $selected, profile: store.profile).padding(16)
            }
            .background(Theme.background)
            .navigationTitle("Your goals")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        let allowed = GoalRules.allowedGoalIDs(selected, goals: store.data?.goals ?? [],
                                                               profile: store.profile)
                        store.updateProfile { $0.goalIDs = allowed }
                        dismiss()
                    }
                    .disabled(selected.isEmpty)
                }
            }
            .onAppear { selected = store.profile.goalIDs }
        }
    }
}

private struct AboutYouSheet: View {
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    @State private var draft = Profile()
    @State private var ageText = ""
    @State private var heightText = ""
    @State private var weightText = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("You") {
                    TextField("Name", text: $draft.name)
                    TextField("Age", text: $ageText).keyboardType(.numberPad)
                    Picker("Sex", selection: $draft.sex) {
                        ForEach(Sex.allCases) { Text($0.title).tag($0) }
                    }
                    TextField("Height (cm)", text: $heightText).keyboardType(.numberPad)
                    TextField("Weight (kg)", text: $weightText).keyboardType(.decimalPad)
                    Picker("Activity", selection: $draft.activity) {
                        ForEach(ActivityLevel.allCases) { Text($0.title).tag($0) }
                    }
                    if !draft.isUnder18 && draft.sex != .male {
                        Toggle("I'm pregnant", isOn: $draft.isPregnant)
                    }
                }
                Section("Food") {
                    Picker("Eating style", selection: $draft.diet) {
                        ForEach(DietStyle.allCases) { Text($0.title).tag($0) }
                    }
                    ForEach(Allergen.allCases) { allergen in
                        Toggle("Avoid \(allergen.displayName.lowercased())", isOn: Binding(
                            get: { draft.allergens.contains(allergen) },
                            set: { on in
                                draft.allergens.removeAll { $0 == allergen }
                                if on { draft.allergens.append(allergen) }
                            }))
                    }
                    Picker("Time to cook", selection: $draft.cookingMinutes) {
                        Text("10 minutes").tag(10)
                        Text("20 minutes").tag(20)
                        Text("30 minutes").tag(30)
                        Text("45 minutes or more").tag(45)
                    }
                    Toggle("I have an oven", isOn: $draft.hasOven)
                }
            }
            .navigationTitle("About you")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) { Button("Save") { save() } }
            }
            .onAppear {
                draft = store.profile
                ageText = draft.age.map(String.init) ?? ""
                heightText = draft.heightCm.map { String(Int($0.rounded())) } ?? ""
                weightText = draft.weightKg.map { String(format: "%.1f", $0) } ?? ""
            }
        }
    }

    private func save() {
        let age = Int(ageText.filter(\.isNumber)).flatMap { (5...120).contains($0) ? $0 : nil }
        draft.age = age
        draft.heightCm = Double(heightText)
        draft.weightKg = Double(weightText.replacingOccurrences(of: ",", with: "."))
        if draft.isUnder18 { draft.isPregnant = false }
        draft.goalIDs = GoalRules.allowedGoalIDs(draft.goalIDs, goals: store.data?.goals ?? [], profile: draft)
        let updated = draft
        store.updateProfile { $0 = updated }
        dismiss()
    }
}

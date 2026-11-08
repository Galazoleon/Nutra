import SwiftUI
import NutraCore

/// A formulated 2 to 6 day plan. Three simple choices, then the plan.
struct WorkoutsView: View {
    @Environment(AppStore.self) private var store
    @State private var focus: TrainingFocus = .general

    var body: some View {
        let profile = store.profile
        let plan = WorkoutPlanner.plan(days: profile.trainingDays, equipment: profile.equipment,
                                       focus: focus, library: store.data?.exercises ?? [])
        ScreenScroll {
            Card {
                Stepper(value: Binding(
                    get: { profile.trainingDays },
                    set: { value in store.updateProfile { $0.trainingDays = value } }), in: 2...6) {
                    Text("\(profile.trainingDays) days a week").font(.headline)
                }
                Picker("Equipment", selection: Binding(
                    get: { profile.equipment },
                    set: { value in store.updateProfile { $0.equipment = value } })) {
                    ForEach(Equipment.allCases) { Text($0.title).tag($0) }
                }
                .pickerStyle(.segmented)
                Picker("Focus", selection: $focus) {
                    ForEach(TrainingFocus.allCases) { Text($0.title).tag($0) }
                }
                .pickerStyle(.segmented)
            }

            ForEach(plan) { day in
                Card {
                    Text("Day \(day.index): \(day.title)").font(.headline)
                    ForEach(day.blocks) { block in
                        DisclosureGroup {
                            Text(block.exercise.howTo).font(.subheadline).foregroundStyle(.secondary)
                                .fixedSize(horizontal: false, vertical: true)
                        } label: {
                            HStack {
                                Text(block.exercise.name)
                                Spacer()
                                Text("\(block.sets) × \(block.reps)").foregroundStyle(.secondary).monospacedDigit()
                            }
                            .frame(minHeight: 40)
                        }
                    }
                }
            }
            HeadsUp(title: "Listen to your body", message: Disclaimers.injuryPainRule, systemImage: "heart")
            DisclaimerFooter(extra: "Start lighter than you think. Warm up for five minutes first.")
        }
        .navigationTitle("Workout plan")
    }
}

/// Injury helper. Never diagnoses: gentle ideas, the 3 out of 10 rule, and when to get help.
struct RehabView: View {
    @Environment(AppStore.self) private var store

    var body: some View {
        List {
            Section {
                Text(Disclaimers.injuryPainRule).font(.subheadline)
            }
            ForEach(store.data?.rehabAreas ?? []) { area in
                Section(area.name) {
                    ForEach(area.moves, id: \.self) { Text($0) }
                    DisclosureGroup("See a professional if you have") {
                        ForEach(area.redFlags, id: \.self) { flag in
                            Label(flag, systemImage: "exclamationmark.circle").foregroundStyle(Theme.amber)
                        }
                    }
                }
            }
            Section {
                Text(Disclaimers.educational).font(.footnote).foregroundStyle(.secondary)
            }
        }
        .navigationTitle("Sore or injured?")
    }
}

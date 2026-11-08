import SwiftUI
import NutraCore

/// Goal picker that never shows all 37 goals at once.
/// It starts with a handful of popular goals; "See more" opens six plain categories.
struct GoalPickerView: View {
    @Environment(AppStore.self) private var store
    @Binding var selected: [String]
    /// Used to hide goals this person may not choose (weight change when under 18 or pregnant).
    var profile: Profile
    @State private var openCategory: GoalCategory?
    @State private var showAll = false

    var body: some View {
        let goals = (store.data?.goals ?? []).filter { GoalRules.isAllowed($0, for: profile) }
        VStack(alignment: .leading, spacing: 12) {
            Text("Most picked").font(.headline)
            ForEach(goals.filter(\.isPopular)) { goal in row(goal) }

            if showAll {
                ForEach(GoalCategory.allCases) { category in
                    DisclosureGroup(isExpanded: Binding(
                        get: { openCategory == category },
                        set: { openCategory = $0 ? category : nil })) {
                        VStack(spacing: 8) {
                            ForEach(goals.filter { $0.category == category && !$0.isPopular }) { row($0) }
                        }
                        .padding(.top, 8)
                    } label: {
                        Label {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(category.title).font(.headline)
                                Text(category.subtitle).font(.footnote).foregroundStyle(.secondary)
                            }
                        } icon: {
                            Image(systemName: category.systemImage).foregroundStyle(Theme.indigo)
                        }
                        .frame(minHeight: Theme.tap)
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 6)
                    .background(Theme.card, in: RoundedRectangle(cornerRadius: Theme.corner, style: .continuous))
                }
            } else {
                Button("See more goals") { showAll = true }
                    .buttonStyle(.secondary)
            }
            if selected.count > 1 {
                Text("Your first pick shapes your Today screen. The others add ideas.")
                    .font(.footnote).foregroundStyle(.secondary)
            }
        }
    }

    private func row(_ goal: Goal) -> some View {
        let isOn = selected.contains(goal.id)
        return Button {
            if let index = selected.firstIndex(of: goal.id) {
                selected.remove(at: index)
            } else {
                selected.append(goal.id)
            }
        } label: {
            HStack(spacing: 12) {
                Image(systemName: isOn ? "checkmark.circle.fill" : "circle")
                    .font(.title2)
                    .foregroundStyle(Theme.indigo)
                VStack(alignment: .leading, spacing: 2) {
                    Text(goal.title).font(.body.weight(.semibold))
                    Text(goal.blurb).font(.footnote).foregroundStyle(.secondary)
                }
                Spacer(minLength: 0)
            }
            .padding(14)
            .frame(maxWidth: .infinity, minHeight: Theme.tap, alignment: .leading)
            .background(isOn ? Theme.indigoSoft : Theme.card,
                        in: RoundedRectangle(cornerRadius: Theme.corner, style: .continuous))
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(isOn ? .isSelected : [])
    }
}

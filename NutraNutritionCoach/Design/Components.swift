import SwiftUI
import NutraCore

/// A rounded card. The basic building block of every screen.
struct Card<Content: View>: View {
    var tint: Color = Theme.card
    @ViewBuilder var content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 10) { content }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(16)
            .background(tint, in: RoundedRectangle(cornerRadius: Theme.corner, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: Theme.corner, style: .continuous)
                    .strokeBorder(Theme.line, lineWidth: 1)
            )
    }
}

/// Big, full-width main action. One per screen is the goal.
struct PrimaryButtonStyle: ButtonStyle {
    @Environment(\.isEnabled) private var isEnabled

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .frame(maxWidth: .infinity, minHeight: Theme.tap)
            .padding(.horizontal, 16)
            .foregroundStyle(.white)
            .background(Theme.indigo.opacity(isEnabled ? 1 : 0.4),
                        in: RoundedRectangle(cornerRadius: 14, style: .continuous))
            .opacity(configuration.isPressed ? 0.85 : 1)
    }
}

/// Quiet secondary action with the same size, so both choices feel equal.
struct SecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .frame(maxWidth: .infinity, minHeight: Theme.tap)
            .padding(.horizontal, 16)
            .foregroundStyle(Theme.indigo)
            .background(Theme.indigoSoft, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
            .opacity(configuration.isPressed ? 0.85 : 1)
    }
}

extension ButtonStyle where Self == PrimaryButtonStyle {
    static var primary: PrimaryButtonStyle { PrimaryButtonStyle() }
}

extension ButtonStyle where Self == SecondaryButtonStyle {
    static var secondary: SecondaryButtonStyle { SecondaryButtonStyle() }
}

/// Small rounded label, e.g. "Estimate" or "Good match".
struct Pill: View {
    var text: String
    var color: Color = Theme.indigo

    var body: some View {
        Text(text)
            .font(.caption.weight(.semibold))
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .foregroundStyle(color)
            .background(color.opacity(0.12), in: Capsule())
    }
}

/// A selectable chip used for allergies, goals and suggestions.
struct ChoiceChip: View {
    var title: String
    var isOn: Bool
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                if isOn { Image(systemName: "checkmark").font(.caption.bold()) }
                Text(title)
            }
            .font(.subheadline.weight(.medium))
            .padding(.horizontal, 14)
            .frame(minHeight: 40)
            .foregroundStyle(isOn ? Color.white : Theme.indigo)
            .background(isOn ? Theme.indigo : Theme.indigoSoft, in: Capsule())
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(isOn ? .isSelected : [])
    }
}

/// Amber heads-up box. Used for safety notices and allergens. Never red.
struct HeadsUp: View {
    var title: String
    var message: String
    var systemImage: String = "exclamationmark.circle"

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: systemImage)
                .font(.title3)
                .foregroundStyle(Theme.amber)
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 4) {
                Text(title).font(.subheadline.weight(.semibold))
                Text(message).font(.subheadline).fixedSize(horizontal: false, vertical: true)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(Theme.amberSoft, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .accessibilityElement(children: .combine)
    }
}

/// The standing "educational, not medical advice" footer.
struct DisclaimerFooter: View {
    var extra: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            if let extra { Text(extra) }
            Text(Disclaimers.educational)
        }
        .font(.footnote)
        .foregroundStyle(.secondary)
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.top, 8)
    }
}

/// Calm progress bar. Fills to the end and stays the same color when full: never a warning.
struct CalmBar: View {
    var value: Double

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(Theme.indigoSoft)
                Capsule().fill(Theme.teal)
                    .frame(width: max(8, geo.size.width * min(max(value, 0), 1)))
            }
        }
        .frame(height: 10)
        .accessibilityHidden(true)
    }
}

/// A simple wrapping layout for chips.
struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? .infinity
        var x: CGFloat = 0
        var y: CGFloat = 0
        var rowHeight: CGFloat = 0
        var widest: CGFloat = 0
        for view in subviews {
            let size = view.sizeThatFits(.unspecified)
            if x + size.width > width, x > 0 {
                x = 0
                y += rowHeight + spacing
                rowHeight = 0
            }
            x += size.width + spacing
            widest = max(widest, x - spacing)
            rowHeight = max(rowHeight, size.height)
        }
        return CGSize(width: min(widest, width), height: y + rowHeight)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX
        var y = bounds.minY
        var rowHeight: CGFloat = 0
        for view in subviews {
            let size = view.sizeThatFits(.unspecified)
            if x + size.width > bounds.maxX, x > bounds.minX {
                x = bounds.minX
                y += rowHeight + spacing
                rowHeight = 0
            }
            view.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(size))
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
    }
}

/// Standard screen background and padding.
struct ScreenScroll<Content: View>: View {
    @ViewBuilder var content: Content

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) { content }
                .padding(16)
        }
        .background(Theme.background.ignoresSafeArea())
    }
}

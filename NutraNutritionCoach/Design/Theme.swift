import SwiftUI
import UIKit

/// Nutra's palette. Rules: no red anywhere, amber for "heads-up", indigo for emphasis.
/// Every color has a light and a dark value.
enum Theme {
    static let indigo = Color(light: 0x4F46E5, dark: 0x9AA2FF)
    static let amber = Color(light: 0x9A5B00, dark: 0xF5B83D)
    static let amberSoft = Color(light: 0xFFF4DE, dark: 0x3A2C10)
    static let teal = Color(light: 0x0F766E, dark: 0x5EEAD4)
    static let background = Color(light: 0xF7F5F2, dark: 0x0F0F12)
    static let card = Color(light: 0xFFFFFF, dark: 0x1C1C22)
    static let indigoSoft = Color(light: 0xEEF0FF, dark: 0x23264A)
    static let line = Color(light: 0xE6E2DC, dark: 0x2E2E36)

    static let corner: CGFloat = 18
    /// Minimum tap target (Apple guideline is 44 pt).
    static let tap: CGFloat = 48
}

extension Color {
    init(light: UInt32, dark: UInt32) {
        self = Color(uiColor: UIColor { traits in
            UIColor(hex: traits.userInterfaceStyle == .dark ? dark : light)
        })
    }
}

extension UIColor {
    convenience init(hex: UInt32) {
        self.init(red: CGFloat((hex >> 16) & 0xFF) / 255,
                  green: CGFloat((hex >> 8) & 0xFF) / 255,
                  blue: CGFloat(hex & 0xFF) / 255,
                  alpha: 1)
    }
}

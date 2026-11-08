import Foundation

/// The exact Mulberry32 generator used by the web prototype, so a seed
/// produces the same plan in the browser and on iPhone.
///
/// JavaScript original:
/// ```
/// a |= 0; a = a + 0x6D2B79F5 | 0;
/// var t = Math.imul(a ^ a >>> 15, 1 | a);
/// t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
/// return ((t ^ t >>> 14) >>> 0) / 4294967296;
/// ```
public struct Mulberry32: Sendable {
    private var state: UInt32

    public init(seed: UInt32) {
        state = seed
    }

    /// Next value in [0, 1).
    public mutating func next() -> Double {
        state = state &+ 0x6D2B79F5
        var t = (state ^ (state >> 15)) &* (1 | state)
        t = (t &+ ((t ^ (t >> 7)) &* (61 | t))) ^ t
        return Double(t ^ (t >> 14)) / 4_294_967_296
    }

    /// Integer in 0..<upperBound.
    public mutating func nextInt(_ upperBound: Int) -> Int {
        guard upperBound > 0 else { return 0 }
        return min(Int(next() * Double(upperBound)), upperBound - 1)
    }
}

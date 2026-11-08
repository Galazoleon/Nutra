// swift-tools-version: 6.0
// NutraCore: all of Nutra's pure logic and built-in data.
// No UI code lives here, so `swift test` runs fast (also on Linux CI).
import PackageDescription

let package = Package(
    name: "NutraCore",
    platforms: [.iOS(.v17), .macOS(.v14)],
    products: [
        .library(name: "NutraCore", targets: ["NutraCore"])
    ],
    targets: [
        .target(
            name: "NutraCore",
            resources: [.process("Resources")]
        ),
        .testTarget(
            name: "NutraCoreTests",
            dependencies: ["NutraCore"]
        )
    ],
    swiftLanguageModes: [.v6]
)

// swift-tools-version: 5.9
import PackageDescription

// NOTE: The actual Xcode Source Editor Extension (.appex) must be built inside
// an Xcode project (apps/xcode/ctok-xcode.xcodeproj) so that Xcode links the
// real XcodeKit.framework provided by macOS.
//
// This Package.swift exists for:
//   1. Building + testing the pure-Swift logic (CtokCli, Formatter) via `swift test`
//   2. CI on GitHub Actions (macos-latest, no Xcode project required)
//
// CtokExtension contains the shared logic; SourceEditorCommand.swift is
// excluded here (it imports XcodeKit which is not available in Swift PM) and
// is only compiled inside the Xcode project target.

let package = Package(
    name: "ctok-xcode",
    platforms: [.macOS(.v13)],
    products: [
        .library(name: "CtokExtension", targets: ["CtokExtension"]),
    ],
    targets: [
        .target(
            name: "CtokExtension",
            path: "Sources/CtokExtension",
            exclude: ["SourceEditorCommand.swift"]   // XcodeKit - Xcode project only
        ),
        .testTarget(
            name: "CtokExtensionTests",
            dependencies: ["CtokExtension"],
            path: "Tests"
        ),
    ]
)

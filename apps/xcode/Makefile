.PHONY: build test clean open

# Build the Swift package (excludes XcodeKit-dependent sources)
build:
	swift build --package-path ctok-xcode

# Run unit tests
test:
	swift test --package-path ctok-xcode

# Build release
release:
	swift build -c release --package-path ctok-xcode

# Open the Xcode project (must have generated it first with `xcodegen` or manually)
open:
	open ctok-xcode/ctok-xcode.xcodeproj

clean:
	swift package clean --package-path ctok-xcode

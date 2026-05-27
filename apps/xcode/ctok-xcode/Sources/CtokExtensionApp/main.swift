// The host macOS app required by Apple for Xcode Source Editor Extensions.
// It is a minimal app wrapper - all logic lives in CtokExtension.
// Users install this app, which registers the extension with Xcode via
// System Settings → Privacy & Security → Extensions → Xcode Source Editor.

import AppKit

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.run()

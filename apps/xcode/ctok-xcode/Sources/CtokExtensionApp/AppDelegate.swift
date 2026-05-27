import AppKit

@MainActor
class AppDelegate: NSObject, NSApplicationDelegate {

    private var window: NSWindow?

    func applicationDidFinishLaunching(_ notification: Notification) {
        let window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 480, height: 280),
            styleMask: [.titled, .closable, .miniaturizable],
            backing: .buffered,
            defer: false
        )
        window.title = "ctok - Claude Token Estimator"
        window.center()

        let label = NSTextField(labelWithString: """
            ctok is installed as an Xcode Source Editor Extension.

            To enable it:
            1. Open System Settings → Privacy & Security → Extensions
            2. Select "Xcode Source Editor"
            3. Enable "ctok"

            Then in Xcode, open Editor menu → ctok → Check Tokens or Refine Prompt.

            Requires ctok CLI on PATH: npm i -g ctok
            """)
        label.translatesAutoresizingMaskIntoConstraints = false
        label.maximumNumberOfLines = 0
        label.lineBreakMode = .byWordWrapping

        let contentView = NSView()
        contentView.addSubview(label)
        NSLayoutConstraint.activate([
            label.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 24),
            label.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -24),
            label.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 24),
            label.bottomAnchor.constraint(lessThanOrEqualTo: contentView.bottomAnchor, constant: -24),
        ])

        window.contentView = contentView
        window.makeKeyAndOrderFront(nil)
        self.window = window
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        true
    }
}

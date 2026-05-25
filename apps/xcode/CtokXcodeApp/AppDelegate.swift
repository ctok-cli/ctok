import Cocoa

@main
class AppDelegate: NSObject, NSApplicationDelegate {

    @IBOutlet var window: NSWindow!
    @IBOutlet var scanDirectoryField: NSTextField!

    func applicationDidFinishLaunching(_ notification: Notification) {
        // Restore saved scan directory into the text field
        if let saved = sharedDefaults?.string(forKey: "scanDirectory") {
            scanDirectoryField?.stringValue = saved
        }
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ app: NSApplication) -> Bool { true }

    // MARK: - Actions

    @IBAction func chooseScanDirectory(_ sender: Any) {
        let panel = NSOpenPanel()
        panel.canChooseDirectories = true
        panel.canChooseFiles = false
        panel.allowsMultipleSelection = false
        panel.prompt = "Choose project directory"
        panel.begin { [weak self] response in
            guard response == .OK, let url = panel.url else { return }
            self?.scanDirectoryField?.stringValue = url.path
            self?.saveScanDirectory(url.path)
        }
    }

    @IBAction func saveScanDirectoryField(_ sender: NSTextField) {
        saveScanDirectory(sender.stringValue)
    }

    // MARK: - Persistence

    private var sharedDefaults: UserDefaults? { UserDefaults(suiteName: "dev.ctok.shared") }

    private func saveScanDirectory(_ path: String) {
        sharedDefaults?.set(path, forKey: "scanDirectory")
        sharedDefaults?.synchronize()
    }
}

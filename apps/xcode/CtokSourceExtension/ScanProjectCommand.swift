import Foundation
import XcodeKit

/// Scans the directory stored in UserDefaults (group: dev.ctok.shared) under
/// the key "scanDirectory", falling back to the user's home directory.
/// Inserts a comment block at the top of the file summarising the result.
///
/// To set the scan directory without opening the host app, run:
///   defaults write dev.ctok.shared scanDirectory /path/to/your/project
class ScanProjectCommand: NSObject, XCSourceEditorCommand {

    private static let suiteName = "dev.ctok.shared"
    private static let dirKey    = "scanDirectory"

    func perform(
        with invocation: XCSourceEditorCommandInvocation,
        completionHandler: @escaping (Error?) -> Void
    ) {
        let directory = scanDirectory()

        do {
            let json = try CtokRunner.run(["scan", "--json", directory])
            let comment = formatComment(json, directory: directory)
            insert(lines: comment, into: invocation.buffer)
            completionHandler(nil)
        } catch {
            completionHandler(error)
        }
    }

    // MARK: - Helpers

    private func scanDirectory() -> String {
        let defaults = UserDefaults(suiteName: Self.suiteName)
        if let path = defaults?.string(forKey: Self.dirKey), !path.isEmpty {
            return path
        }
        return NSHomeDirectory()
    }

    private func formatComment(_ json: String, directory: String) -> [String] {
        guard
            let data = json.data(using: .utf8),
            let obj  = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else {
            return ["// ctok scan: (parse error)\n"]
        }

        let totalFiles = obj["totalFiles"]       as? Int    ?? 0
        let tokens     = obj["estimatedTokens"]  as? Int    ?? 0
        let kind       = obj["projectType"]      as? String ?? "unknown"

        let tokStr = tokens >= 1_000_000
            ? String(format: "%.1fM", Double(tokens) / 1_000_000)
            : tokens >= 1_000
            ? String(format: "%.1fk", Double(tokens) / 1_000)
            : "\(tokens)"

        return [
            "// ctok scan: \(directory)\n",
            "// Project type : \(kind)\n",
            "// Total files  : \(totalFiles)\n",
            "// Est. tokens  : \(tokStr)\n",
        ]
    }

    private func insert(lines: [String], into buffer: XCSourceEditorBuffer) {
        for (i, line) in lines.reversed().enumerated() {
            _ = i  // suppress warning
            buffer.lines.insert(line as NSString, at: 0)
        }
        // Re-insert in correct order
        for _ in 0 ..< lines.count { buffer.lines.removeObject(at: 0) }
        for (i, line) in lines.enumerated() {
            buffer.lines.insert(line as NSString, at: i)
        }
    }
}

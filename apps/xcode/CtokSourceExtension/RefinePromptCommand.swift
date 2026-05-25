import Foundation
import XcodeKit

/// Refines the selected text in-place using the ctok heuristic refiner.
/// Replaces the selection with the tighter version and appends a comment
/// showing how many tokens were saved.
class RefinePromptCommand: NSObject, XCSourceEditorCommand {

    func perform(
        with invocation: XCSourceEditorCommandInvocation,
        completionHandler: @escaping (Error?) -> Void
    ) {
        let buffer = invocation.buffer
        guard
            let range = (buffer.selections as? [XCSourceTextRange])?.first,
            !isEmpty(range)
        else {
            completionHandler(
                NSError(domain: "dev.ctok.xcode", code: 1,
                        userInfo: [NSLocalizedDescriptionKey: "Select some text to refine."])
            )
            return
        }

        let original = extractText(buffer, range: range)

        do {
            let json = try CtokRunner.run(["refine", "--json", original])
            guard
                let data    = json.data(using: .utf8),
                let obj     = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                let refined = obj["refined"] as? String
            else {
                completionHandler(
                    NSError(domain: "dev.ctok.xcode", code: 2,
                            userInfo: [NSLocalizedDescriptionKey: "ctok refine returned unexpected output."])
                )
                return
            }

            let saved    = obj["savedTokens"] as? Int    ?? 0
            let savedPct = obj["savedPct"]    as? Double ?? 0

            replaceText(buffer, range: range, with: refined)

            // Insert a trailing comment on the line after the replacement
            let afterLine = range.start.line + refined.components(separatedBy: "\n").count
            let note = "// ctok refined: saved \(saved) tokens (\(Int(savedPct))%)\n"
            buffer.lines.insert(note as NSString, at: min(afterLine, buffer.lines.count))

            completionHandler(nil)
        } catch {
            completionHandler(error)
        }
    }

    // MARK: - Helpers

    private func isEmpty(_ range: XCSourceTextRange) -> Bool {
        range.start.line == range.end.line && range.start.column == range.end.column
    }

    private func extractText(_ buffer: XCSourceEditorBuffer, range: XCSourceTextRange) -> String {
        let lines = buffer.lines as! [String]
        if range.start.line == range.end.line {
            let line  = lines[range.start.line]
            let start = line.index(line.startIndex, offsetBy: min(range.start.column, line.count))
            let end   = line.index(line.startIndex, offsetBy: min(range.end.column,   line.count))
            return String(line[start..<end])
        }
        var result = ""
        for i in range.start.line ... range.end.line {
            let line = lines[i]
            if i == range.start.line {
                let start = line.index(line.startIndex, offsetBy: min(range.start.column, line.count))
                result += String(line[start...])
            } else if i == range.end.line {
                let end = line.index(line.startIndex, offsetBy: min(range.end.column, line.count))
                result += String(line[..<end])
            } else {
                result += line
            }
        }
        return result
    }

    private func replaceText(
        _ buffer: XCSourceEditorBuffer,
        range: XCSourceTextRange,
        with replacement: String
    ) {
        // Remove affected lines and re-insert the refined content
        let lineCount = range.end.line - range.start.line + 1
        for _ in 0 ..< lineCount {
            buffer.lines.removeObject(at: range.start.line)
        }
        let newLines = replacement.components(separatedBy: "\n")
        for (offset, line) in newLines.enumerated() {
            let suffix = offset < newLines.count - 1 ? "\n" : ""
            buffer.lines.insert((line + suffix) as NSString, at: range.start.line + offset)
        }
    }
}

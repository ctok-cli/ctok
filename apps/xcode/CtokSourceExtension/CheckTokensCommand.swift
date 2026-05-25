import Foundation
import XcodeKit

/// Estimates token count for the selection (or entire buffer) and inserts a
/// comment above the selection with the result.
class CheckTokensCommand: NSObject, XCSourceEditorCommand {

    func perform(
        with invocation: XCSourceEditorCommandInvocation,
        completionHandler: @escaping (Error?) -> Void
    ) {
        let buffer = invocation.buffer
        let text = selectedText(buffer) ?? buffer.completeBuffer

        do {
            let json = try CtokRunner.run(["check", "--json", text])
            let comment = formatComment(json, uti: buffer.contentUTI)
            // Insert comment at the top of the selection (or file)
            let insertLine = insertionLine(buffer)
            buffer.lines.insert(comment as NSString, at: insertLine)
            completionHandler(nil)
        } catch {
            completionHandler(error)
        }
    }

    // MARK: - Helpers

    private func selectedText(_ buffer: XCSourceEditorBuffer) -> String? {
        guard
            let range = (buffer.selections as? [XCSourceTextRange])?.first,
            !isEmpty(range)
        else { return nil }

        let lines = buffer.lines as! [String]
        if range.start.line == range.end.line {
            let line = lines[range.start.line]
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

    private func isEmpty(_ range: XCSourceTextRange) -> Bool {
        range.start.line == range.end.line && range.start.column == range.end.column
    }

    private func insertionLine(_ buffer: XCSourceEditorBuffer) -> Int {
        (buffer.selections as? [XCSourceTextRange])?.first?.start.line ?? 0
    }

    private func formatComment(_ json: String, uti: String) -> String {
        guard
            let data = json.data(using: .utf8),
            let obj  = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else { return commentPrefix(uti) + "ctok: (parse error)\n" }

        let tokens = obj["tokens"] as? Int ?? 0
        let model  = obj["model"]  as? String ?? "?"
        let cost   = obj["cost"]   as? Double ?? 0
        let effort = obj["effort"] as? String ?? "?"
        let costStr = cost < 0.01 ? String(format: "$%.4f", cost) : String(format: "$%.2f", cost)
        return "\(commentPrefix(uti))ctok: ~\(tokens) tokens · \(costStr) · \(model) (\(effort))\n"
    }

    private func commentPrefix(_ uti: String) -> String {
        // Use # for Python/Ruby/Shell, -- for SQL/Lua, // for everything else
        if uti.contains("python") || uti.contains("ruby") || uti.contains("shell") || uti.contains("perl") {
            return "# "
        }
        if uti.contains("sql") || uti.contains("lua") {
            return "-- "
        }
        return "// "
    }
}

import Foundation
import XcodeKit

// MARK: - Check Tokens Command

public class CheckTokensCommand: NSObject, XCSourceEditorCommand {

    public func perform(
        with invocation: XCSourceEditorCommandInvocation,
        completionHandler: @escaping (Error?) -> Void
    ) {
        let buffer = invocation.buffer

        // Use selection if non-empty, else entire buffer
        let text: String
        if let range = buffer.selections.firstObject as? XCSourceTextRange,
           range.start.line != range.end.line || range.start.column != range.end.column {
            text = selectedText(buffer: buffer, range: range)
        } else {
            text = buffer.completeBuffer
        }

        guard !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            completionHandler(nil)
            return
        }

        DispatchQueue.global(qos: .userInitiated).async {
            do {
                let result = try CtokCli.check(prompt: text)
                let summary = Formatter.checkSummary(result: result)
                self.insertComment(summary, into: buffer, atTop: true)
                completionHandler(nil)
            } catch {
                completionHandler(error)
            }
        }
    }

    private func selectedText(buffer: XCSourceTextBuffer, range: XCSourceTextRange) -> String {
        let lines = buffer.lines as! [String]
        guard range.start.line < lines.count else { return buffer.completeBuffer }
        var result = ""
        for lineIdx in range.start.line...min(range.end.line, lines.count - 1) {
            let line = lines[lineIdx]
            if lineIdx == range.start.line && lineIdx == range.end.line {
                let start = line.index(line.startIndex, offsetBy: min(range.start.column, line.count))
                let end = line.index(line.startIndex, offsetBy: min(range.end.column, line.count))
                result += String(line[start..<end])
            } else if lineIdx == range.start.line {
                let start = line.index(line.startIndex, offsetBy: min(range.start.column, line.count))
                result += String(line[start...])
            } else if lineIdx == range.end.line {
                let end = line.index(line.startIndex, offsetBy: min(range.end.column, line.count))
                result += String(line[..<end])
            } else {
                result += line
            }
        }
        return result
    }

    private func insertComment(_ text: String, into buffer: XCSourceTextBuffer, atTop: Bool) {
        let commentLines = text.split(separator: "\n", omittingEmptySubsequences: false)
            .map { "// \($0)" }
            .joined(separator: "\n")
        let block = "/*\n\(text)\n*/\n\n"
        if atTop {
            buffer.lines.insert(block, at: 0)
        } else {
            buffer.lines.add(block)
        }
    }
}

// MARK: - Refine Prompt Command

public class RefinePromptCommand: NSObject, XCSourceEditorCommand {

    public func perform(
        with invocation: XCSourceEditorCommandInvocation,
        completionHandler: @escaping (Error?) -> Void
    ) {
        let buffer = invocation.buffer

        guard let range = buffer.selections.firstObject as? XCSourceTextRange,
              range.start.line != range.end.line || range.start.column != range.end.column
        else {
            completionHandler(makeError("Select the prompt text you want to refine."))
            return
        }

        let selected = selectedText(buffer: buffer, range: range)
        guard !selected.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            completionHandler(makeError("Selection is empty."))
            return
        }

        DispatchQueue.global(qos: .userInitiated).async {
            do {
                let result = try CtokCli.refine(prompt: selected)
                self.replaceSelection(in: buffer, range: range, with: result.refined)
                completionHandler(nil)
            } catch {
                completionHandler(error)
            }
        }
    }

    private func replaceSelection(
        in buffer: XCSourceTextBuffer,
        range: XCSourceTextRange,
        with replacement: String
    ) {
        let lines = buffer.lines as! [String]
        guard range.start.line < lines.count else { return }

        // Remove selected lines
        let removeRange = NSRange(location: range.start.line, length: range.end.line - range.start.line + 1)
        buffer.lines.removeObjects(in: removeRange)

        // Insert replacement
        buffer.lines.insert(replacement + "\n", at: range.start.line)
    }

    private func selectedText(buffer: XCSourceTextBuffer, range: XCSourceTextRange) -> String {
        let lines = buffer.lines as! [String]
        guard range.start.line < lines.count else { return "" }
        var result = ""
        for lineIdx in range.start.line...min(range.end.line, lines.count - 1) {
            result += lines[lineIdx]
        }
        return result
    }

    private func makeError(_ message: String) -> NSError {
        NSError(domain: "dev.ctok.xcode", code: 1, userInfo: [NSLocalizedDescriptionKey: message])
    }
}

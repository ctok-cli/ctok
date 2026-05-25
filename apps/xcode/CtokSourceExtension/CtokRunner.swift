import Foundation

enum CtokError: Error, LocalizedError {
    case notFound
    case failed(exitCode: Int32, stderr: String)

    var errorDescription: String? {
        switch self {
        case .notFound:
            return "ctok not found on PATH. Install with: npm i -g ctok"
        case .failed(let code, let msg):
            return "ctok exited \(code): \(msg)"
        }
    }
}

enum CtokRunner {
    // Run `ctok <args>` synchronously and return stdout.
    static func run(_ args: [String]) throws -> String {
        guard let exe = findCtok() else { throw CtokError.notFound }

        let proc = Process()
        proc.executableURL = URL(fileURLWithPath: exe)
        proc.arguments = args

        let outPipe = Pipe()
        let errPipe = Pipe()
        proc.standardOutput = outPipe
        proc.standardError = errPipe

        try proc.run()
        proc.waitUntilExit()

        let out = String(data: outPipe.fileHandleForReading.readDataToEndOfFile(), encoding: .utf8) ?? ""
        if proc.terminationStatus != 0 {
            let err = String(data: errPipe.fileHandleForReading.readDataToEndOfFile(), encoding: .utf8) ?? ""
            throw CtokError.failed(exitCode: proc.terminationStatus, stderr: err.trimmingCharacters(in: .whitespacesAndNewlines))
        }
        return out.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private static func findCtok() -> String? {
        let candidates = [
            "/opt/homebrew/bin/ctok",
            "/usr/local/bin/ctok",
            "\(NSHomeDirectory())/.ctok/bin/ctok",
            "\(NSHomeDirectory())/.npm-global/bin/ctok",
            "/usr/local/lib/node_modules/.bin/ctok",
        ]
        for path in candidates where FileManager.default.isExecutableFile(atPath: path) {
            return path
        }

        // Fallback: ask `which`
        let which = Process()
        which.executableURL = URL(fileURLWithPath: "/usr/bin/which")
        which.arguments = ["ctok"]
        let pipe = Pipe()
        which.standardOutput = pipe
        try? which.run()
        which.waitUntilExit()
        let result = String(data: pipe.fileHandleForReading.readDataToEndOfFile(), encoding: .utf8)?
            .trimmingCharacters(in: .whitespacesAndNewlines)
        if let path = result, !path.isEmpty { return path }
        return nil
    }
}

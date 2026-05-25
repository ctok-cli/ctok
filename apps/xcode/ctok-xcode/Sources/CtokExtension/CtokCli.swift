import Foundation

// MARK: - Result types

public struct TokenRange: Decodable {
    public let min: Int
    public let expected: Int
    public let max: Int
}

public struct CostBreakdown: Decodable {
    public let inputUsd: Double
    public let outputUsd: Double
    public let totalUsd: Double
    public let totalUsdRange: UsdRange
}

public struct UsdRange: Decodable {
    public let min: Double
    public let max: Double
}

public struct Estimate: Decodable {
    public let input: TokenRange
    public let output: TokenRange
    public let confidence: String
}

public struct EffortRec: Decodable {
    public let effort: String
    public let reason: String
}

public struct ModelRec: Decodable {
    public let model: String
    public let reason: String
}

public struct Recommendation: Decodable {
    public let effort: EffortRec
    public let model: ModelRec
}

public struct Suggestion: Decodable {
    public let title: String
    public let detail: String
    public let severity: String
}

public struct CheckResult: Decodable {
    public let estimate: Estimate
    public let recommendation: Recommendation
    public let suggestions: [Suggestion]
    public let cost: CostBreakdown
}

public struct RefineResult: Decodable {
    public let refined: String
    public let savedTokens: Int
    public let savedPct: Double
}

// MARK: - CLI runner

public enum CtokError: Error, LocalizedError {
    case notFound
    case exitFailure(code: Int32, stderr: String)
    case decodingFailure(underlying: Error, output: String)

    public var errorDescription: String? {
        switch self {
        case .notFound:
            return "ctok not found on PATH. Install with: npm i -g ctok"
        case .exitFailure(let code, let stderr):
            return "ctok exited \(code): \(stderr)"
        case .decodingFailure(let err, _):
            return "Failed to parse ctok output: \(err.localizedDescription)"
        }
    }
}

public struct CtokCli {

    // MARK: Public API

    public static func check(
        prompt: String,
        taskType: String = "general",
        model: String? = nil
    ) throws -> CheckResult {
        var args = ["check", "--json", "--task-type", taskType]
        if let m = model, !m.isEmpty { args += ["--model", m] }
        args.append(prompt)
        let output = try run(args: args)
        return try decode(CheckResult.self, from: output)
    }

    public static func refine(prompt: String) throws -> RefineResult {
        let output = try run(args: ["refine", "--json", prompt])
        return try decode(RefineResult.self, from: output)
    }

    // MARK: Private helpers

    static func findExecutable() -> String? {
        let candidates = ["/usr/local/bin/ctok", "/opt/homebrew/bin/ctok", "/usr/bin/ctok"]
        for path in candidates {
            if FileManager.default.isExecutableFile(atPath: path) { return path }
        }
        // Try resolving via `which`
        if let which = try? run(args: [], executable: "/usr/bin/which", extraEnv: [:]),
           !which.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return which.trimmingCharacters(in: .whitespacesAndNewlines)
        }
        // Walk PATH
        let pathEnv = ProcessInfo.processInfo.environment["PATH"] ?? ""
        for dir in pathEnv.split(separator: ":") {
            let full = "\(dir)/ctok"
            if FileManager.default.isExecutableFile(atPath: full) { return full }
        }
        return nil
    }

    private static func run(args: [String]) throws -> String {
        guard let exe = findExecutable() else { throw CtokError.notFound }
        return try run(args: args, executable: exe, extraEnv: [:])
    }

    private static func run(
        args: [String],
        executable: String,
        extraEnv: [String: String]
    ) throws -> String {
        let process = Process()
        process.executableURL = URL(fileURLWithPath: executable)
        process.arguments = args

        var env = ProcessInfo.processInfo.environment
        for (k, v) in extraEnv { env[k] = v }
        process.environment = env

        let stdoutPipe = Pipe()
        let stderrPipe = Pipe()
        process.standardOutput = stdoutPipe
        process.standardError = stderrPipe

        try process.run()
        process.waitUntilExit()

        let stdout = String(data: stdoutPipe.fileHandleForReading.readDataToEndOfFile(), encoding: .utf8) ?? ""
        let stderr = String(data: stderrPipe.fileHandleForReading.readDataToEndOfFile(), encoding: .utf8) ?? ""

        guard process.terminationStatus == 0 else {
            throw CtokError.exitFailure(code: process.terminationStatus, stderr: stderr.trimmingCharacters(in: .whitespacesAndNewlines))
        }
        return stdout
    }

    private static func decode<T: Decodable>(_ type: T.Type, from json: String) throws -> T {
        guard let data = json.data(using: .utf8) else {
            throw CtokError.decodingFailure(underlying: NSError(domain: "ctok", code: 1), output: json)
        }
        do {
            let decoder = JSONDecoder()
            decoder.keyDecodingStrategy = .convertFromSnakeCase
            return try decoder.decode(type, from: data)
        } catch {
            throw CtokError.decodingFailure(underlying: error, output: json)
        }
    }
}

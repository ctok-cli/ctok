import Foundation

public struct Formatter {

    public static func fmtTokens(_ n: Int) -> String {
        switch n {
        case 1_000_000...: return String(format: "%.1fM", Double(n) / 1_000_000)
        case 1_000...:     return String(format: "%.1fk", Double(n) / 1_000)
        default:           return "\(n)"
        }
    }

    public static func fmtUsd(_ n: Double) -> String {
        n < 0.01 ? String(format: "$%.4f", n) : String(format: "$%.2f", n)
    }

    public static func effortEmoji(_ effort: String) -> String {
        switch effort {
        case "low":    return "🟢"
        case "medium": return "🟡"
        case "high":   return "🟠"
        case "xhigh":  return "🔴"
        default:       return "⚪"
        }
    }

    // MARK: - Rich text builders

    public static func checkSummary(result: CheckResult) -> String {
        let est = result.estimate
        let rec = result.recommendation
        let cost = result.cost

        var lines: [String] = [
            "⚡ ctok — Token Estimate",
            "",
            "Input:      \(fmtTokens(est.input.min))–\(fmtTokens(est.input.max))  (est. \(fmtTokens(est.input.expected)))",
            "Output:     \(fmtTokens(est.output.min))–\(fmtTokens(est.output.max))",
            "Confidence: \(est.confidence)",
            "",
            "Cost:       \(fmtUsd(cost.totalUsd))  (\(fmtUsd(cost.totalUsdRange.min))–\(fmtUsd(cost.totalUsdRange.max)))",
            "",
            "\(effortEmoji(rec.effort.effort)) \(rec.effort.effort) effort → \(rec.model.model)",
            "  \(rec.model.reason)",
        ]

        if !result.suggestions.isEmpty {
            lines.append("")
            lines.append("Suggestions:")
            for s in result.suggestions.prefix(3) {
                lines.append("  • \(s.title): \(s.detail)")
            }
        }

        lines.append("")
        lines.append("─────────────────────────────────────────")
        return lines.joined(separator: "\n")
    }

    public static func refineSummary(result: RefineResult) -> String {
        [
            "✂️ ctok — Refined Prompt",
            "",
            "Tokens saved: ~\(fmtTokens(result.savedTokens)) (\(Int(result.savedPct))% reduction)",
            "",
            result.refined,
            "",
            "─────────────────────────────────────────",
        ].joined(separator: "\n")
    }
}

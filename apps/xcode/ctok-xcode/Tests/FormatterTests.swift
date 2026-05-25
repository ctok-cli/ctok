import XCTest
@testable import CtokExtension

final class FormatterTests: XCTestCase {

    // MARK: - fmtTokens

    func testFmtTokensSmall() {
        XCTAssertEqual(Formatter.fmtTokens(500), "500")
    }

    func testFmtTokensThousands() {
        XCTAssertEqual(Formatter.fmtTokens(1_500), "1.5k")
        XCTAssertEqual(Formatter.fmtTokens(10_000), "10.0k")
    }

    func testFmtTokensMillions() {
        XCTAssertEqual(Formatter.fmtTokens(1_500_000), "1.5M")
    }

    // MARK: - fmtUsd

    func testFmtUsdSmall() {
        let result = Formatter.fmtUsd(0.001)
        XCTAssertTrue(result.hasPrefix("$"))
        XCTAssertTrue(result.contains("0.0010"))
    }

    func testFmtUsdNormal() {
        XCTAssertEqual(Formatter.fmtUsd(1.5), "$1.50")
        XCTAssertEqual(Formatter.fmtUsd(0.01), "$0.01")
    }

    // MARK: - effortEmoji

    func testEffortEmojiAllLevels() {
        XCTAssertEqual(Formatter.effortEmoji("low"),    "🟢")
        XCTAssertEqual(Formatter.effortEmoji("medium"), "🟡")
        XCTAssertEqual(Formatter.effortEmoji("high"),   "🟠")
        XCTAssertEqual(Formatter.effortEmoji("xhigh"),  "🔴")
        XCTAssertEqual(Formatter.effortEmoji("other"),  "⚪")
    }

    // MARK: - checkSummary

    func testCheckSummaryContainsExpectedFields() {
        let result = makeCheckResult()
        let summary = Formatter.checkSummary(result: result)

        XCTAssertTrue(summary.contains("Token Estimate"))
        XCTAssertTrue(summary.contains("Input:"))
        XCTAssertTrue(summary.contains("Output:"))
        XCTAssertTrue(summary.contains("Cost:"))
        XCTAssertTrue(summary.contains("effort"))
    }

    func testCheckSummaryIncludesSuggestions() {
        let result = makeCheckResult(withSuggestions: true)
        let summary = Formatter.checkSummary(result: result)
        XCTAssertTrue(summary.contains("Suggestions:"))
        XCTAssertTrue(summary.contains("Use shorter variable names"))
    }

    func testCheckSummaryNoSuggestionsSection() {
        let result = makeCheckResult(withSuggestions: false)
        let summary = Formatter.checkSummary(result: result)
        XCTAssertFalse(summary.contains("Suggestions:"))
    }

    // MARK: - refineSummary

    func testRefineSummaryContainsRefinedText() {
        let refineResult = RefineResult(refined: "Fix the auth bug.", savedTokens: 12, savedPct: 30.0)
        let summary = Formatter.refineSummary(result: refineResult)
        XCTAssertTrue(summary.contains("Refined Prompt"))
        XCTAssertTrue(summary.contains("Fix the auth bug."))
        XCTAssertTrue(summary.contains("12"))
    }

    // MARK: - CtokCli.findExecutable (smoke test)

    func testFindExecutableReturnsNilOrString() {
        // Just assert it doesn't crash — ctok may not be on PATH in CI
        let result = CtokCli.findExecutable()
        if let path = result {
            XCTAssertFalse(path.isEmpty)
        }
        // nil is acceptable
    }

    // MARK: - Helpers

    private func makeCheckResult(withSuggestions: Bool = false) -> CheckResult {
        let suggestions: [Suggestion] = withSuggestions
            ? [Suggestion(title: "Use shorter variable names", detail: "Replace verbose names", severity: "info")]
            : []

        return CheckResult(
            estimate: Estimate(
                input: TokenRange(min: 100, expected: 150, max: 200),
                output: TokenRange(min: 50, expected: 100, max: 200),
                confidence: "high"
            ),
            recommendation: Recommendation(
                effort: EffortRec(effort: "medium", reason: "Moderate complexity"),
                model: ModelRec(model: "claude-haiku-4-5", reason: "Short prompt")
            ),
            suggestions: suggestions,
            cost: CostBreakdown(
                inputUsd: 0.0001,
                outputUsd: 0.0002,
                totalUsd: 0.0003,
                totalUsdRange: UsdRange(min: 0.0001, max: 0.0005)
            )
        )
    }
}

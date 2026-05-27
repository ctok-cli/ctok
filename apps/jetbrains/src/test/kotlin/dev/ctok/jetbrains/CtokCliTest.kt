package dev.ctok.jetbrains

import kotlinx.serialization.json.Json
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.condition.DisabledIfEnvironmentVariable

private val JSON = Json { ignoreUnknownKeys = true }

class CtokCliTest {

    // CLI discovery

    @Test
    fun `findExecutable returns null or a non-blank string`() {
        val result = CtokCli.findExecutable()
        if (result != null) assertTrue(result.isNotBlank())
        // null is valid - ctok may not be installed in this environment
    }

    @Test
    @DisabledIfEnvironmentVariable(named = "CI_NO_CTOK", matches = "true")
    fun `check returns Ok or Err without throwing`() {
        val result = CtokCli.check("Fix the login bug.", "bug-fix")
        assertTrue(result is CtokResult.Ok || result is CtokResult.Err)
    }

    // JSON deserialization

    @Test
    fun `CheckResult deserialises from ctok JSON output`() {
        val json = """
            {
              "estimate": {
                "input": {"min": 10, "expected": 12, "max": 15},
                "output": {"min": 50, "expected": 100, "max": 200},
                "confidence": "high",
                "totalExpected": 112
              },
              "recommendation": {
                "effort": {"effort": "low", "reason": "short prompt"},
                "model": {"model": "haiku-4-5", "reason": "short and simple", "alternatives": []}
              },
              "suggestions": [],
              "cost": {
                "inputUsd": 0.0001,
                "outputUsd": 0.0008,
                "totalUsd": 0.0009,
                "totalUsdRange": {"min": 0.0005, "max": 0.0015},
                "model": "haiku-4-5"
              }
            }
        """.trimIndent()
        val result = JSON.decodeFromString<CheckResult>(json)
        assertEquals(12, result.estimate.input.expected)
        assertEquals("haiku-4-5", result.recommendation.model.model)
        assertEquals("low", result.recommendation.effort.effort)
        assertEquals(0.0009, result.cost.totalUsd, 1e-6)
        assertTrue(result.suggestions.isEmpty())
    }

    @Test
    fun `RefineResult deserialises correctly`() {
        val json = """{"refined": "Fix auth bug.", "savedTokens": 5, "savedPct": 10.0}"""
        val result = JSON.decodeFromString<RefineResult>(json)
        assertEquals("Fix auth bug.", result.refined)
        assertEquals(5, result.savedTokens)
        assertEquals(10.0, result.savedPct, 1e-6)
    }

    @Test
    fun `ScanResult deserialises correctly`() {
        val json = """
            {
              "totalFiles": 42,
              "estimatedTokens": 15000,
              "projectType": "node",
              "topHeavyFiles": [
                {"path": "src/index.ts", "tokens": 3000}
              ]
            }
        """.trimIndent()
        val result = JSON.decodeFromString<ScanResult>(json)
        assertEquals(42, result.totalFiles)
        assertEquals("node", result.projectType)
        assertEquals(1, result.topHeavyFiles.size)
        assertEquals("src/index.ts", result.topHeavyFiles[0].path)
    }

    @Test
    fun `CtokResult sealed class Ok and Err are distinct`() {
        val ok: CtokResult<Int> = CtokResult.Ok(42)
        val err: CtokResult<Int> = CtokResult.Err("something went wrong")
        assertTrue(ok is CtokResult.Ok)
        assertTrue(err is CtokResult.Err)
        assertEquals(42, (ok as CtokResult.Ok).value)
        assertEquals("something went wrong", (err as CtokResult.Err).message)
    }

    // Format helpers

    @Test
    fun `fmtTokens formats small, kilo, and mega values`() {
        assertEquals("500", fmtTokens(500))
        assertEquals("1.5k", fmtTokens(1_500))
        assertEquals("10.0k", fmtTokens(10_000))
        assertEquals("1.5M", fmtTokens(1_500_000))
    }

    @Test
    fun `fmtUsd formats sub-cent to 4dp`() {
        val r = fmtUsd(0.001)
        assertTrue(r.startsWith("$"))
        assertTrue(r.contains("0.0010"))
    }

    @Test
    fun `fmtUsd formats normal amounts to 2dp`() {
        assertEquals("\$1.50", fmtUsd(1.5))
        assertEquals("\$0.01", fmtUsd(0.01))
    }
}

// Mirror package-private helpers from CtokToolWindowPanel for testing
private fun fmtTokens(n: Int): String = when {
    n >= 1_000_000 -> "${"%.1f".format(n / 1_000_000.0)}M"
    n >= 1_000     -> "${"%.1f".format(n / 1_000.0)}k"
    else           -> n.toString()
}

private fun fmtUsd(n: Double): String =
    if (n < 0.01) "$${"%.4f".format(n)}" else "$${"%.2f".format(n)}"

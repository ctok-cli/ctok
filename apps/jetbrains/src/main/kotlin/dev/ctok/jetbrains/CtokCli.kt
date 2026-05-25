package dev.ctok.jetbrains

import com.intellij.openapi.diagnostic.Logger
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

private val LOG = Logger.getInstance("dev.ctok.jetbrains.CtokCli")

private val JSON = Json { ignoreUnknownKeys = true }

// Deserialization models

@Serializable
data class TokenRange(val min: Int, val expected: Int, val max: Int)

@Serializable
data class CostRange(val min: Double, val expected: Double, val max: Double)

@Serializable
data class CostBreakdown(
    val inputUsd: Double,
    val outputUsd: Double,
    val totalUsd: Double,
    val totalUsdRange: UsdRange,
)

@Serializable
data class UsdRange(val min: Double, val max: Double)

@Serializable
data class Estimate(
    val input: TokenRange,
    val output: TokenRange,
    val confidence: String,
)

@Serializable
data class EffortRec(val effort: String, val reason: String)

@Serializable
data class ModelRec(val model: String, val reason: String)

@Serializable
data class Recommendation(val effort: EffortRec, val model: ModelRec)

@Serializable
data class Suggestion(val title: String, val detail: String, val severity: String)

@Serializable
data class CheckResult(
    val estimate: Estimate,
    val recommendation: Recommendation,
    val suggestions: List<Suggestion>,
    val cost: CostBreakdown,
)

@Serializable
data class ScanFile(val path: String, val tokens: Int)

@Serializable
data class ScanResult(
    val totalFiles: Int,
    val estimatedTokens: Int,
    val projectType: String,
    val topHeavyFiles: List<ScanFile>,
)

@Serializable
data class RefineResult(
    val refined: String,
    val savedTokens: Int,
    val savedPct: Double,
)

// CLI runner

sealed class CtokResult<out T> {
    data class Ok<T>(val value: T) : CtokResult<T>()
    data class Err(val message: String) : CtokResult<Nothing>()
}

object CtokCli {

    /** Locate the ctok executable. Returns null if not found on PATH. */
    fun findExecutable(): String? {
        val os = System.getProperty("os.name").lowercase()
        val names = if (os.contains("win")) listOf("ctok.cmd", "ctok.exe", "ctok") else listOf("ctok")
        val path = System.getenv("PATH") ?: return null
        val sep = if (os.contains("win")) ";" else ":"
        for (dir in path.split(sep)) {
            for (name in names) {
                val f = java.io.File(dir, name)
                if (f.exists() && f.canExecute()) return f.absolutePath
            }
        }
        return null
    }

    fun check(prompt: String, taskType: String = "general", model: String? = null): CtokResult<CheckResult> {
        val args = buildList {
            add("check")
            add("--json")
            add("--task-type"); add(taskType)
            if (!model.isNullOrBlank()) { add("--model"); add(model) }
            add(prompt)
        }
        return run(args) { JSON.decodeFromString(it) }
    }

    fun refine(prompt: String): CtokResult<RefineResult> {
        return run(listOf("refine", "--json", prompt)) { JSON.decodeFromString(it) }
    }

    fun scan(directory: String): CtokResult<ScanResult> {
        return run(listOf("scan", "--json", directory)) { JSON.decodeFromString(it) }
    }

    private fun <T> run(args: List<String>, parse: (String) -> T): CtokResult<T> {
        val exe = findExecutable()
            ?: return CtokResult.Err("ctok not found on PATH. Install it with: npm i -g ctok")

        return try {
            val cmd = listOf(exe) + args
            LOG.debug("Running: ${cmd.joinToString(" ")}")
            val proc = ProcessBuilder(cmd)
                .redirectErrorStream(false)
                .start()

            val stdout = proc.inputStream.bufferedReader().readText()
            val stderr = proc.errorStream.bufferedReader().readText()
            val exit = proc.waitFor()

            if (exit != 0) {
                val msg = stderr.trim().ifBlank { "ctok exited with code $exit" }
                CtokResult.Err(msg)
            } else {
                CtokResult.Ok(parse(stdout.trim()))
            }
        } catch (e: Exception) {
            LOG.warn("ctok invocation failed", e)
            CtokResult.Err(e.message ?: "Unknown error")
        }
    }
}

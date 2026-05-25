package dev.ctok.jetbrains

import com.intellij.icons.AllIcons
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.project.Project
import com.intellij.ui.components.JBLabel
import com.intellij.ui.components.JBScrollPane
import com.intellij.ui.components.JBTextArea
import com.intellij.util.ui.JBUI
import java.awt.BorderLayout
import java.awt.FlowLayout
import java.awt.Font
import javax.swing.*

class CtokToolWindowPanel(private val project: Project) : JPanel(BorderLayout()) {

    private val promptArea = JBTextArea(8, 40).apply {
        lineWrap = true
        wrapStyleWord = true
        font = Font(Font.MONOSPACED, Font.PLAIN, 12)
        emptyText.text = "Paste your prompt here, or select text in the editor and use Ctrl+Shift+T"
    }
    private val resultPane = JEditorPane("text/html", "<html><body><p style='color: gray'>Results will appear here.</p></body></html>").apply {
        isEditable = false
        border = JBUI.Borders.empty(8)
    }
    private val checkBtn = JButton("Estimate Tokens", AllIcons.Actions.Execute)
    private val refineBtn = JButton("Refine", AllIcons.Actions.RefactoringBulb)
    private val statusLabel = JBLabel("").apply { font = font.deriveFont(Font.ITALIC) }

    init {
        border = JBUI.Borders.empty(8)

        val topPanel = JPanel(BorderLayout()).apply {
            add(JBScrollPane(promptArea), BorderLayout.CENTER)
        }

        val btnPanel = JPanel(FlowLayout(FlowLayout.LEFT)).apply {
            add(checkBtn)
            add(refineBtn)
            add(statusLabel)
        }

        val bottomPanel = JPanel(BorderLayout()).apply {
            add(btnPanel, BorderLayout.NORTH)
            add(JBScrollPane(resultPane), BorderLayout.CENTER)
        }

        val splitPane = JSplitPane(JSplitPane.VERTICAL_SPLIT, topPanel, bottomPanel).apply {
            resizeWeight = 0.3
            border = null
        }

        add(splitPane, BorderLayout.CENTER)

        checkBtn.addActionListener { runCheck() }
        refineBtn.addActionListener { runRefine() }
    }

    fun setPromptText(text: String) {
        promptArea.text = text
    }

    fun showCheckResult(result: CheckResult) {
        setLoading(false, "")
        resultPane.text = buildCheckHtml(result)
    }

    fun showRefineResult(result: RefineResult) {
        setLoading(false, "")
        resultPane.text = buildRefineHtml(result)
        promptArea.text = result.refined
    }

    fun showScanResult(result: ScanResult) {
        val html = buildScanHtml(result)
        SwingUtilities.invokeLater { resultPane.text = html }
    }

    private fun runCheck() {
        val prompt = promptArea.text.trim()
        if (prompt.isEmpty()) {
            statusLabel.text = "Enter a prompt first."
            return
        }
        setLoading(true, "Analysing…")
        val settings = CtokSettings.getInstance().state
        ApplicationManager.getApplication().executeOnPooledThread {
            val res = CtokCli.check(prompt, settings.defaultTaskType, settings.modelOverride.ifBlank { null })
            SwingUtilities.invokeLater {
                setLoading(false, "")
                when (res) {
                    is CtokResult.Ok -> resultPane.text = buildCheckHtml(res.value)
                    is CtokResult.Err -> showError(res.message)
                }
            }
        }
    }

    private fun runRefine() {
        val prompt = promptArea.text.trim()
        if (prompt.isEmpty()) {
            statusLabel.text = "Enter a prompt first."
            return
        }
        setLoading(true, "Refining…")
        ApplicationManager.getApplication().executeOnPooledThread {
            val res = CtokCli.refine(prompt)
            SwingUtilities.invokeLater {
                setLoading(false, "")
                when (res) {
                    is CtokResult.Ok -> {
                        resultPane.text = buildRefineHtml(res.value)
                        promptArea.text = res.value.refined
                    }
                    is CtokResult.Err -> showError(res.message)
                }
            }
        }
    }

    private fun setLoading(loading: Boolean, msg: String) {
        checkBtn.isEnabled = !loading
        refineBtn.isEnabled = !loading
        statusLabel.text = msg
    }

    private fun showError(msg: String) {
        resultPane.text = """
            <html><body style='font-family:sans-serif; padding:8px'>
            <p style='color:#cc0000'><b>Error</b></p>
            <p>${msg.replace("<", "&lt;")}</p>
            </body></html>
        """.trimIndent()
    }
}

// HTML builders

private fun fmtTokens(n: Int): String = when {
    n >= 1_000_000 -> "${"%.1f".format(n / 1_000_000.0)}M"
    n >= 1_000 -> "${"%.1f".format(n / 1_000.0)}k"
    else -> n.toString()
}

private fun fmtUsd(n: Double): String = if (n < 0.01) "$${"%.4f".format(n)}" else "$${"%.2f".format(n)}"

private fun effortColor(effort: String): String = when (effort) {
    "low" -> "#22863a"
    "medium" -> "#b08800"
    "high" -> "#e36209"
    "xhigh" -> "#cb2431"
    else -> "#586069"
}

private fun buildCheckHtml(r: CheckResult): String {
    val effort = r.recommendation.effort.effort
    val color = effortColor(effort)
    val suggestions = if (r.suggestions.isEmpty()) "" else buildString {
        append("<h3>Suggestions</h3><ul>")
        r.suggestions.forEach { s ->
            append("<li><b>${s.title}</b>: ${s.detail}</li>")
        }
        append("</ul>")
    }

    return """
        <html><body style='font-family:sans-serif; padding:8px; font-size:12px'>
        <h2 style='margin-top:0'>Token Estimate</h2>
        <table cellpadding='3'>
          <tr><td><b>Input tokens</b></td><td>${fmtTokens(r.estimate.input.min)}–${fmtTokens(r.estimate.input.max)}
              (est. ${fmtTokens(r.estimate.input.expected)})</td></tr>
          <tr><td><b>Output tokens</b></td><td>${fmtTokens(r.estimate.output.min)}–${fmtTokens(r.estimate.output.max)}</td></tr>
          <tr><td><b>Confidence</b></td><td>${r.estimate.confidence}</td></tr>
        </table>

        <h3>Cost</h3>
        <table cellpadding='3'>
          <tr><td><b>Input</b></td><td>${fmtUsd(r.cost.inputUsd)}</td></tr>
          <tr><td><b>Output</b></td><td>${fmtUsd(r.cost.outputUsd)}</td></tr>
          <tr><td><b>Total</b></td><td>${fmtUsd(r.cost.totalUsd)}</td></tr>
          <tr><td><b>Range</b></td><td>${fmtUsd(r.cost.totalUsdRange.min)}–${fmtUsd(r.cost.totalUsdRange.max)}</td></tr>
        </table>

        <h3>Recommendation</h3>
        <p><span style='color:$color'><b>$effort</b></span> — ${r.recommendation.model.model}</p>
        <p style='color:#586069'>${r.recommendation.model.reason}</p>

        $suggestions
        </body></html>
    """.trimIndent()
}

private fun buildRefineHtml(r: RefineResult): String = """
    <html><body style='font-family:sans-serif; padding:8px; font-size:12px'>
    <h2 style='margin-top:0'>Prompt Refined</h2>
    <p><b>Tokens saved:</b> ~${fmtTokens(r.savedTokens)} (${r.savedPct.toInt()}% reduction)</p>
    <p style='color:#22863a'>The refined prompt has been loaded into the editor above.</p>
    </body></html>
""".trimIndent()

private fun buildScanHtml(r: ScanResult): String {
    val files = r.topHeavyFiles.take(15).joinToString("") { f ->
        "<tr><td><code>${f.path}</code></td><td align='right'>${fmtTokens(f.tokens)}</td></tr>"
    }
    return """
        <html><body style='font-family:sans-serif; padding:8px; font-size:12px'>
        <h2 style='margin-top:0'>Project Scan</h2>
        <table cellpadding='3'>
          <tr><td><b>Project type</b></td><td>${r.projectType}</td></tr>
          <tr><td><b>Total files</b></td><td>${r.totalFiles}</td></tr>
          <tr><td><b>Total tokens</b></td><td>${fmtTokens(r.estimatedTokens)}</td></tr>
        </table>
        <h3>Heaviest Files</h3>
        <table cellpadding='3' width='100%'>
          <tr><th align='left'>File</th><th align='right'>Tokens</th></tr>
          $files
        </table>
        </body></html>
    """.trimIndent()
}

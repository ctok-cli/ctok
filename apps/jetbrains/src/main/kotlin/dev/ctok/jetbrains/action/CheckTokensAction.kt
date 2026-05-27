package dev.ctok.jetbrains.action

import com.intellij.openapi.actionSystem.ActionUpdateThread
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.actionSystem.CommonDataKeys
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.wm.ToolWindowManager
import dev.ctok.jetbrains.CtokCli
import dev.ctok.jetbrains.CtokResult
import dev.ctok.jetbrains.CtokSettings
import dev.ctok.jetbrains.CtokToolWindowPanel
import dev.ctok.jetbrains.notify

class CheckTokensAction : AnAction() {

    override fun getActionUpdateThread() = ActionUpdateThread.BGT

    override fun update(e: AnActionEvent) {
        val editor = e.getData(CommonDataKeys.EDITOR)
        val file = e.getData(CommonDataKeys.VIRTUAL_FILE)
        e.presentation.isEnabled = editor != null || file != null
    }

    override fun actionPerformed(e: AnActionEvent) {
        val project = e.project ?: return
        val editor = e.getData(CommonDataKeys.EDITOR)

        val text: String = if (editor != null) {
            val selected = editor.selectionModel.selectedText
            if (!selected.isNullOrBlank()) selected
            else editor.document.text
        } else {
            val file = e.getData(CommonDataKeys.VIRTUAL_FILE) ?: return
            String(file.contentsToByteArray())
        }

        if (text.isBlank()) {
            notify(project, "Nothing to analyse - file or selection is empty.")
            return
        }

        val settings = CtokSettings.getInstance().state
        val tw = ToolWindowManager.getInstance(project).getToolWindow("ctok") ?: return
        tw.activate {
            val panel = tw.contentManager.getContent(0)?.component as? CtokToolWindowPanel ?: return@activate
            panel.setPromptText(text)
        }

        ApplicationManager.getApplication().executeOnPooledThread {
            val result = CtokCli.check(text, settings.defaultTaskType, settings.modelOverride.ifBlank { null })
            javax.swing.SwingUtilities.invokeLater {
                val panel = tw.contentManager.getContent(0)?.component as? CtokToolWindowPanel
                when (result) {
                    is CtokResult.Ok -> panel?.showCheckResult(result.value)
                    is CtokResult.Err -> notify(project, "ctok error: ${result.message}")
                }
            }
        }
    }
}

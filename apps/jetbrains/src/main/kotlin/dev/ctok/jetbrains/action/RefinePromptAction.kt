package dev.ctok.jetbrains.action

import com.intellij.openapi.actionSystem.ActionUpdateThread
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.actionSystem.CommonDataKeys
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.command.WriteCommandAction
import com.intellij.openapi.wm.ToolWindowManager
import dev.ctok.jetbrains.CtokCli
import dev.ctok.jetbrains.CtokResult
import dev.ctok.jetbrains.CtokToolWindowPanel
import dev.ctok.jetbrains.notify

class RefinePromptAction : AnAction() {

    override fun getActionUpdateThread() = ActionUpdateThread.BGT

    override fun update(e: AnActionEvent) {
        val editor = e.getData(CommonDataKeys.EDITOR)
        e.presentation.isEnabled = editor?.selectionModel?.hasSelection() == true
    }

    override fun actionPerformed(e: AnActionEvent) {
        val project = e.project ?: return
        val editor = e.getData(CommonDataKeys.EDITOR) ?: return
        val selection = editor.selectionModel.selectedText?.trim() ?: return
        if (selection.isBlank()) return

        ApplicationManager.getApplication().executeOnPooledThread {
            val result = CtokCli.refine(selection)
            when (result) {
                is CtokResult.Ok -> {
                    WriteCommandAction.runWriteCommandAction(project) {
                        val doc = editor.document
                        val start = editor.selectionModel.selectionStart
                        val end = editor.selectionModel.selectionEnd
                        doc.replaceString(start, end, result.value.refined)
                    }

                    val tw = ToolWindowManager.getInstance(project).getToolWindow("ctok")
                    tw?.activate {
                        val panel = tw.contentManager.getContent(0)?.component as? CtokToolWindowPanel
                        panel?.showRefineResult(result.value)
                    }
                }
                is CtokResult.Err -> notify(project, "ctok refine error: ${result.message}")
            }
        }
    }
}

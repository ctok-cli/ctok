package dev.ctok.jetbrains.action

import com.intellij.openapi.actionSystem.ActionUpdateThread
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.actionSystem.CommonDataKeys
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.wm.ToolWindowManager
import dev.ctok.jetbrains.CtokCli
import dev.ctok.jetbrains.CtokResult
import dev.ctok.jetbrains.CtokToolWindowPanel
import dev.ctok.jetbrains.notify

class ScanProjectAction : AnAction() {

    override fun getActionUpdateThread() = ActionUpdateThread.BGT

    override fun update(e: AnActionEvent) {
        e.presentation.isEnabled = e.project != null
    }

    override fun actionPerformed(e: AnActionEvent) {
        val project = e.project ?: return

        val dir: String = run {
            val file = e.getData(CommonDataKeys.VIRTUAL_FILE)
            if (file != null && file.isDirectory) file.path
            else project.basePath ?: return
        }

        ApplicationManager.getApplication().executeOnPooledThread {
            val result = CtokCli.scan(dir)
            when (result) {
                is CtokResult.Ok -> {
                    val tw = ToolWindowManager.getInstance(project).getToolWindow("ctok") ?: return@executeOnPooledThread
                    tw.activate {
                        val panel = tw.contentManager.getContent(0)?.component as? CtokToolWindowPanel
                        panel?.showScanResult(result.value)
                    }
                }
                is CtokResult.Err -> notify(project, "ctok scan error: ${result.message}")
            }
        }
    }
}

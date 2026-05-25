package dev.ctok.jetbrains

import com.intellij.openapi.options.Configurable
import com.intellij.openapi.ui.ComboBox
import com.intellij.ui.components.JBCheckBox
import com.intellij.ui.components.JBLabel
import com.intellij.ui.components.JBTextField
import com.intellij.util.ui.FormBuilder
import javax.swing.JComponent
import javax.swing.JPanel

class CtokSettingsConfigurable : Configurable {

    private val planCombo = ComboBox(arrayOf("free", "pro", "max5x", "max20x", "team", "enterprise", "api"))
    private val modelField = JBTextField()
    private val taskTypeCombo = ComboBox(
        arrayOf("general", "bug-fix", "feature", "refactor", "review", "architecture", "debugging", "docs", "test")
    )
    private val statusBarCheck = JBCheckBox("Show token count in status bar")
    private var panel: JPanel? = null

    override fun getDisplayName() = "ctok"

    override fun createComponent(): JComponent {
        panel = FormBuilder.createFormBuilder()
            .addLabeledComponent(JBLabel("Claude plan:"), planCombo, 1, false)
            .addLabeledComponent(JBLabel("Model override:"), modelField, 1, false)
            .addLabeledComponent(JBLabel("Default task type:"), taskTypeCombo, 1, false)
            .addComponent(statusBarCheck, 1)
            .addComponentFillVertically(JPanel(), 0)
            .panel
        return panel!!
    }

    override fun isModified(): Boolean {
        val s = CtokSettings.getInstance().state
        return planCombo.selectedItem != s.plan ||
            modelField.text != s.modelOverride ||
            taskTypeCombo.selectedItem != s.defaultTaskType ||
            statusBarCheck.isSelected != s.showInStatusBar
    }

    override fun apply() {
        val s = CtokSettings.getInstance().state
        s.plan = planCombo.selectedItem as String
        s.modelOverride = modelField.text
        s.defaultTaskType = taskTypeCombo.selectedItem as String
        s.showInStatusBar = statusBarCheck.isSelected
    }

    override fun reset() {
        val s = CtokSettings.getInstance().state
        planCombo.selectedItem = s.plan
        modelField.text = s.modelOverride
        taskTypeCombo.selectedItem = s.defaultTaskType
        statusBarCheck.isSelected = s.showInStatusBar
    }
}

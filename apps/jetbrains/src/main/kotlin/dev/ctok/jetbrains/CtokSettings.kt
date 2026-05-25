package dev.ctok.jetbrains

import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.components.PersistentStateComponent
import com.intellij.openapi.components.State
import com.intellij.openapi.components.Storage

@State(name = "CtokSettings", storages = [Storage("ctok.xml")])
class CtokSettings : PersistentStateComponent<CtokSettings.State> {

    data class State(
        var plan: String = "pro",
        var modelOverride: String = "",
        var defaultTaskType: String = "general",
        var showInStatusBar: Boolean = true,
    )

    private var state = State()

    override fun getState(): State = state

    override fun loadState(state: State) {
        this.state = state
    }

    companion object {
        fun getInstance(): CtokSettings =
            ApplicationManager.getApplication().getService(CtokSettings::class.java)
    }
}

package dev.ctok.jetbrains

import com.intellij.notification.NotificationGroupManager
import com.intellij.notification.NotificationType
import com.intellij.openapi.project.Project

fun notify(project: Project, message: String, type: NotificationType = NotificationType.WARNING) {
    NotificationGroupManager.getInstance()
        .getNotificationGroup("ctok")
        .createNotification(message, type)
        .notify(project)
}

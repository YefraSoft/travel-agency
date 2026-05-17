package com.api.travel_api.escalation.model

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "escalations", indexes = [
    Index(name = "idx_escalations_phone", columnList = "phone"),
    Index(name = "idx_escalations_status", columnList = "status")
])
data class Escalation(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Int? = null,

    @Column(name = "chat_id")
    val chatId: Int? = null,

    @Column(length = 14, nullable = false)
    val phone: String = "",

    @Column(length = 20, nullable = false)
    val reason: String = "",

    @Column(name = "client_question", columnDefinition = "TEXT")
    val clientQuestion: String = "",

    @Column(columnDefinition = "TEXT")
    val context: String? = null,

    @Column(name = "suggested_action", columnDefinition = "TEXT")
    val suggestedAction: String? = null,

    @Column(length = 20, nullable = false)
    val status: String = "pending",

    @Column(name = "attended_by", length = 100)
    val attendedBy: String? = null,

    @Column(name = "attended_at")
    val attendedAt: LocalDateTime? = null,

    @Column(name = "resolved_at")
    val resolvedAt: LocalDateTime? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)

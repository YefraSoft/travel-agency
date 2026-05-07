package com.api.travel_api.model.entities

import com.api.travel_api.model.enums.UserRole
import com.api.travel_api.model.enums.UserRoleConverter
import jakarta.persistence.*
import jakarta.validation.constraints.NotBlank
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.time.LocalDateTime

@Entity
@Table(name = "chats")
data class Chat(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Int? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    var customer: Customer? = null,

    @field:NotBlank
    @Column(nullable = false, length = 14)
    var phone: String,

    @Convert(converter = UserRoleConverter::class)
    @Column(name = "attended_by", nullable = false)
    var attendedBy: UserRole = UserRole.IA_AGENT,

    @Convert(converter = UserRoleConverter::class)
    @Column(name = "closed_by")
    var closedBy: UserRole? = null,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "chat_history", columnDefinition = "jsonb")
    var chatHistory: MutableList<Map<String, Any?>> = mutableListOf(),

    @Column(name = "context_summary", columnDefinition = "TEXT")
    var contextSummary: String? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "closed_at")
    var closedAt: LocalDateTime? = null,

    @OneToMany(mappedBy = "chat", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.LAZY)
    var ragMessages: MutableList<RagChat> = mutableListOf()
)


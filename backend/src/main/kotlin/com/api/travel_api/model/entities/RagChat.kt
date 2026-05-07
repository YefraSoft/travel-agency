package com.api.travel_api.model.entities

import com.api.travel_api.model.enums.ChatIntention
import jakarta.persistence.*
import org.hibernate.annotations.JdbcType
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.dialect.type.PostgreSQLEnumJdbcType
import org.hibernate.type.SqlTypes
import java.time.LocalDateTime

@Entity
@Table(name = "rag_chats")
data class RagChat(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Int? = null,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "chat_id", nullable = false)
    var chat: Chat,

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType::class)
    @Column(nullable = false, columnDefinition = "chat_intention")
    var intention: ChatIntention = ChatIntention.UNKNOWN,

    @Column(nullable = false)
    var escalated: Boolean = false,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    var interaction: Map<String, Any?> = emptyMap(),

    @Column(name = "received_at", nullable = false, updatable = false)
    var receivedAt: LocalDateTime = LocalDateTime.now()
)

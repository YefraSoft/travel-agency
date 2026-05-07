package com.api.travel_api.rag

import com.api.travel_api.model.entities.Chat
import com.api.travel_api.model.entities.RagChat
import org.springframework.data.jpa.repository.JpaRepository

interface ChatRepository : JpaRepository<Chat, Int> {
    fun findFirstByPhoneAndClosedAtIsNullOrderByCreatedAtDesc(phone: String): Chat?
    fun findByPhoneOrderByCreatedAtDesc(phone: String): List<Chat>
}

interface RagChatRepository : JpaRepository<RagChat, Int>


package com.api.travel_api.chat

import com.api.travel_api.model.entities.Chat
import org.springframework.data.jpa.repository.JpaRepository

interface ChatRepository : JpaRepository<Chat, Int> {
    fun findFirstByPhoneAndClosedAtIsNullOrderByCreatedAtDesc(phone: String): Chat?
    fun findByPhoneOrderByCreatedAtDesc(phone: String): List<Chat>
    fun findByPhone(phone: String): Chat?
    fun findByClosedAtIsNullOrderByCreatedAtDesc(): List<Chat>
}
package com.api.travel_api.rag

import com.api.travel_api.model.entities.Chat
import com.api.travel_api.model.entities.RagChat
import org.springframework.data.jpa.repository.JpaRepository

interface RagChatRepository : JpaRepository<RagChat, Int>


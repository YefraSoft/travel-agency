package com.api.travel_api.chat

import com.api.travel_api.api.ChatMessageResponse
import com.api.travel_api.common.NotFoundException
import com.api.travel_api.model.entities.Chat
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class ChatService(
    private val chatRepository: ChatRepository
) {

    @Transactional(readOnly = true)
    fun getChats(): List<ChatMessageResponse> {
        return chatRepository.findAll()
            .map { it.toResponse() }
    }

    @Transactional(readOnly = true)
    fun getChatByPhone(phone: String): ChatMessageResponse {
        val chat = chatRepository.findByPhone(phone)
            ?: throw NotFoundException("Chat not found")
        return chat.toResponse()
    }

    fun Chat.toResponse() = ChatMessageResponse(
        id = id!!,
        customerId = customer?.id,
        attendedBy = attendedBy,
        closedBy = closedBy,
        chatHistory = chatHistory,
        contextSummary = contextSummary
    )
}
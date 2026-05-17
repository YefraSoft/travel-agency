package com.api.travel_api.chat

import com.api.travel_api.api.ChatMessageResponse
import com.api.travel_api.common.NotFoundException
import com.api.travel_api.model.entities.Chat
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class ChatService(
    private val chatRepository: ChatRepository,
    private val chatContextCacheService: ChatContextCacheService
) {

    @Transactional(readOnly = true)
    fun getChats(): List<ChatMessageResponse> {
        return chatRepository.findAll()
            .map { it.toResponse() }
    }

    @Transactional(readOnly = true)
    fun getChatByPhone(phone: String): ChatMessageResponse {
        chatContextCacheService.get(phone)?.let { return it.toMessageResponse() }

        val chat = chatRepository.findFirstByPhoneAndClosedAtIsNullOrderByCreatedAtDesc(phone)
            ?: throw NotFoundException("Chat not found")
        chatContextCacheService.put(chat)
        return chat.toResponse()
    }

    @Transactional(readOnly = true)
    fun getActiveChats(): List<ChatMessageResponse> {
        return chatRepository.findByClosedAtIsNullOrderByCreatedAtDesc()
            .map { it.toResponse() }
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

package com.api.travel_api.rag

import com.api.travel_api.api.*
import com.api.travel_api.chat.ChatContextCacheService
import com.api.travel_api.chat.ChatRepository
import com.api.travel_api.common.NotFoundException
import com.api.travel_api.customer.CustomerRepository
import com.api.travel_api.customer.toResponse
import com.api.travel_api.escalation.EscalationService
import com.api.travel_api.model.entities.Chat
import com.api.travel_api.model.enums.MessageType
import com.api.travel_api.model.enums.UserRole
import com.api.travel_api.travel.TravelService
import com.fasterxml.jackson.databind.ObjectMapper
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.client.RestTemplate
import java.time.LocalDateTime

@Service
class RagService(
    private val chatRepository: ChatRepository,
    private val chatContextCacheService: ChatContextCacheService,
    private val travelService: TravelService,
    private val customerRepository: CustomerRepository,
    private val escalationService: EscalationService,
    @Value("\${rag.service.url:http://localhost:3000}") private val agentUrl: String,
    @Value("\${rag.api.key:}") private val apiKey: String
) {
    private val logger = LoggerFactory.getLogger(RagService::class.java)
    private val restTemplate = RestTemplate()
    private val objectMapper = ObjectMapper().findAndRegisterModules()

    data class AgentChatRequest(
        val message: String,
        val phone: String,
        val persist: Boolean = false,
        val history: List<AgentMessage> = emptyList()
    )

    data class AgentMessage(
        val role: String,
        val content: String
    )

    data class AgentChatResponse(
        val answer: String,
        val sources: List<String> = emptyList(),
        val model: String = "",
        val chat_id: Int? = null,
        val escalate: Boolean = false,
        val escalation: EscalationDetail? = null
    )

    data class EscalationDetail(
        val reason: String,
        val clientQuestion: String,
        val context: String?,
        val suggestedAction: String?
    )

    @Transactional
    fun processMessage(phone: String, message: String): RagAssistantResponse {
        logger.info("Processing RAG message for phoneSuffix={}", phone.takeLast(4))

        val chat = getOrCreateChat(phone)

        val history = chatContextCacheService.get(phone)?.chatHistory
            ?: chat.chatHistory

        val agentHistory = history.map { msg ->
            AgentMessage(
                role = if (msg.type == MessageType.HUMAN) "user" else "assistant",
                content = msg.content
            )
        }

        val agentRequest = AgentChatRequest(
            message = message,
            phone = phone,
            persist = false,
            history = agentHistory
        )

        val headers = HttpHeaders().apply {
            contentType = MediaType.APPLICATION_JSON
            if (apiKey.isNotBlank()) {
                set("X-API-Key", apiKey)
            }
        }

        val httpEntity = HttpEntity(agentRequest, headers)

        val response: ResponseEntity<AgentChatResponse> = restTemplate.postForEntity(
            "$agentUrl/api/chat",
            httpEntity,
            AgentChatResponse::class.java
        )

        val agentResponse = response.body ?: throw RuntimeException("Empty response from agent")

        val newMessages = listOf(
            ChatMessage(MessageType.HUMAN, message),
            ChatMessage(MessageType.AI, agentResponse.answer)
        )

        chatContextCacheService.append(chat, newMessages)

        chat.chatHistory = chat.chatHistory + newMessages
        chatRepository.save(chat)

        if (agentResponse.escalate && agentResponse.escalation != null) {
            logger.info(
                "Escalation triggered for phoneSuffix={}, reason={}",
                phone.takeLast(4),
                agentResponse.escalation.reason
            )
            escalationService.create(
                EscalationRequest(
                    chatId = chat.id,
                    phone = phone,
                    reason = agentResponse.escalation.reason,
                    clientQuestion = agentResponse.escalation.clientQuestion,
                    context = agentResponse.escalation.context,
                    suggestedAction = agentResponse.escalation.suggestedAction
                )
            )
        }

        return RagAssistantResponse(
            answer = agentResponse.answer,
            sources = agentResponse.sources,
            model = agentResponse.model,
            chatId = agentResponse.chat_id ?: chat.id,
            legacyChatId = agentResponse.chat_id ?: chat.id,
            escalate = agentResponse.escalate,
            escalation = agentResponse.escalation?.let {
                EscalationDetailResponse(
                    reason = it.reason,
                    clientQuestion = it.clientQuestion,
                    context = it.context,
                    suggestedAction = it.suggestedAction
                )
            }
        )
    }

    fun getRagTravels(): List<RagTravelResponse> {
        val travels = travelService.publicList(null)
        return travels.map { travel ->
            RagTravelResponse(
                id = travel.id,
                name = travel.name,
                slug = travel.slug,
                type = travel.type,
                destination = travel.destination,
                minPrice = travel.minPrice,
                currency = travel.packages.firstOrNull()?.currency,
                availablePackages = travel.packages.filter { it.active }
            )
        }
    }

    fun getCustomerByPhone(phone: String): CustomerResponse? {
        return customerRepository.findByPhone(phone)?.toResponse()
    }

    @Transactional(readOnly = true)
    fun getChatByPhone(phone: String): ChatResponse {
        val cached = chatContextCacheService.get(phone)
        if (cached != null) {
            return ChatResponse(
                id = cached.id,
                phone = cached.phone,
                customerId = cached.customerId,
                attendedBy = cached.attendedBy,
                closedBy = cached.closedBy,
                chatHistory = cached.chatHistory,
                contextSummary = cached.contextSummary,
                closedAt = null
            )
        }

        val chat = chatRepository.findFirstByPhoneAndClosedAtIsNullOrderByCreatedAtDesc(phone)
            ?: throw NotFoundException("Chat not found for phone: $phone")

        return ChatResponse(
            id = chat.id!!,
            phone = chat.phone,
            customerId = chat.customer?.id,
            attendedBy = chat.attendedBy,
            closedBy = chat.closedBy,
            chatHistory = chat.chatHistory,
            contextSummary = chat.contextSummary,
            closedAt = chat.closedAt
        )
    }

    @Transactional
    fun createChat(phone: String, attendedBy: UserRole = UserRole.IA_AGENT): ChatResponse {
        val customer = customerRepository.findByPhone(phone)

        val chat = Chat(
            phone = phone,
            customer = customer,
            attendedBy = attendedBy,
            chatHistory = emptyList()
        )

        val saved = chatRepository.save(chat)
        chatContextCacheService.put(chat)

        return ChatResponse(
            id = saved.id!!,
            phone = saved.phone,
            customerId = saved.customer?.id,
            attendedBy = saved.attendedBy,
            closedBy = saved.closedBy,
            chatHistory = saved.chatHistory,
            contextSummary = saved.contextSummary,
            closedAt = saved.closedAt
        )
    }

    @Transactional
    fun addMessage(chatId: Int, messages: List<ChatMessage>): ChatResponse {
        val chat = chatRepository.findById(chatId)
            .orElseThrow { NotFoundException("Chat not found with id: $chatId") }

        chat.chatHistory = chat.chatHistory + messages
        chatRepository.save(chat)
        chatContextCacheService.append(chat, messages)

        return ChatResponse(
            id = chat.id!!,
            phone = chat.phone,
            customerId = chat.customer?.id,
            attendedBy = chat.attendedBy,
            closedBy = chat.closedBy,
            chatHistory = chat.chatHistory,
            contextSummary = chat.contextSummary,
            closedAt = chat.closedAt
        )
    }

    @Transactional
    fun closeChat(phone: String, contextSummary: String?): ChatResponse {
        val chat = chatRepository.findFirstByPhoneAndClosedAtIsNullOrderByCreatedAtDesc(phone)
            ?: throw NotFoundException("No active chat found for phone: $phone")

        chat.closedAt = LocalDateTime.now()
        chat.closedBy = UserRole.IA_AGENT
        if (contextSummary != null) {
            chat.contextSummary = contextSummary
        }
        chatRepository.save(chat)
        chatContextCacheService.delete(phone)

        return ChatResponse(
            id = chat.id!!,
            phone = chat.phone,
            customerId = chat.customer?.id,
            attendedBy = chat.attendedBy,
            closedBy = chat.closedBy,
            chatHistory = chat.chatHistory,
            contextSummary = chat.contextSummary,
            closedAt = chat.closedAt
        )
    }

    @Transactional(readOnly = true)
    fun getActiveChats(): List<ChatMessageResponse> {
        return chatRepository.findByClosedAtIsNullOrderByCreatedAtDesc()
            .map { it.toMessageResponse() }
    }

    private fun Chat.toMessageResponse() = ChatMessageResponse(
        id = id!!,
        customerId = customer?.id,
        attendedBy = attendedBy,
        closedBy = closedBy,
        chatHistory = chatHistory,
        contextSummary = contextSummary
    )

    private fun getOrCreateChat(phone: String): Chat {
        val cached = chatContextCacheService.get(phone)
        if (cached != null) {
            val cachedChat = chatRepository.findById(cached.id)
            if (cachedChat.isPresent) {
                return cachedChat.get()
            }

            logger.warn(
                "Discarding stale cached chat id={} for phoneSuffix={}",
                cached.id,
                phone.takeLast(4)
            )
            chatContextCacheService.delete(phone)
        }

        val existing = chatRepository.findFirstByPhoneAndClosedAtIsNullOrderByCreatedAtDesc(phone)
        if (existing != null) {
            chatContextCacheService.put(existing)
            return existing
        }

        val customer = customerRepository.findByPhone(phone)
        val chat = Chat(
            phone = phone,
            customer = customer,
            attendedBy = UserRole.IA_AGENT,
            chatHistory = emptyList()
        )
        val saved = chatRepository.save(chat)
        chatContextCacheService.put(saved)
        return saved
    }
}

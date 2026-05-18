package com.api.travel_api.rag

import com.api.travel_api.api.*
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/rag")
@Tag(name = "RAG - Chat and Escalations")
class RagController(
    private val ragService: RagService
) {

    @PostMapping("/whatsapp/messages")
    fun processMessage(@Valid @RequestBody request: WhatsAppInboundRequest): RagAssistantResponse {
        return ragService.processMessage(request.phone, request.message)
    }

    @GetMapping("/travels")
    fun getTravels(): List<RagTravelResponse> {
        return ragService.getRagTravels()
    }

    @GetMapping("/customers/phone/{phone}")
    fun getCustomerByPhone(@PathVariable phone: String): CustomerResponse? {
        return ragService.getCustomerByPhone(phone)
    }

    @GetMapping("/chats/{phone}")
    fun getChatByPhone(@PathVariable phone: String): ChatResponse {
        return ragService.getChatByPhone(phone)
    }

    @PostMapping("/chats")
    fun createChat(@Valid @RequestBody request: ChatCreateRequest): ChatResponse {
        return ragService.createChat(request.phone, request.attendedBy)
    }

    @PostMapping("/chats/{id}/messages")
    fun addMessage(@PathVariable id: Int, @Valid @RequestBody request: ChatMessageRequest): ChatResponse {
        return ragService.addMessage(id, request.interaction)
    }

    @PostMapping("/chats/phone/{phone}/close")
    fun closeChat(@PathVariable phone: String, @RequestBody request: ChatCloseRequest): ChatResponse {
        return ragService.closeChat(phone, request.contextSummary)
    }

    @GetMapping("/chats/active")
    fun getActiveChats(): List<ChatMessageResponse> {
        return ragService.getActiveChats()
    }
}

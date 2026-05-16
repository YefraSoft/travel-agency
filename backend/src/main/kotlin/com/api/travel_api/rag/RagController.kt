package com.api.travel_api.rag

import com.api.travel_api.api.*
import com.api.travel_api.chat.ChatService
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/rag")
@Tag(name = "RAG and n8n")
class RagController(
    private val ragService: RagService,
    private val chatService: ChatService,
    private val ragGatewayService: RagGatewayService
) {

    @GetMapping("/travels")
    fun travels(): List<RagTravelResponse> = ragService.travels()

    @GetMapping("/customers/phone/{phone}")
    fun customerByPhone(@PathVariable phone: String): CustomerResponse = ragService.customerByPhone(phone)

    @PostMapping("/quote")
    fun quote(@Valid @RequestBody request: RagQuoteRequest): BookingResponse = ragService.quote(request)

    @PostMapping("/whatsapp/messages")
    fun receiveWhatsAppMessage(@Valid @RequestBody request: WhatsAppInboundRequest): RagAssistantResponse =
        ragGatewayService.sendWhatsAppMessage(request)


    /*CHAT MANAGEMENT*/
    @PostMapping("/chats")
    fun createChat(@Valid @RequestBody request: ChatCreateRequest): ChatResponse = ragService.createChat(request)

    @PostMapping("/chats/{id}/messages")
    fun addMessage(@PathVariable id: Int, @RequestBody request: ChatMessageRequest): ChatResponse =
        ragService.addMessage(id, request)

    @PostMapping("/chats/{id}/close")
    fun closeChat(@PathVariable id: Int, @RequestBody request: ChatCloseRequest): ChatResponse =
        ragService.closeChat(id, request)

    @PostMapping("/chats/phone/{phone}/close")
    fun closeChatByPhone(@PathVariable phone: String, @RequestBody request: ChatCloseRequest): ChatResponse =
        ragService.closeActiveChat(phone, request)

    @GetMapping("/chats")
    fun getChats(): List<ChatMessageResponse> = chatService.getChats();

    @GetMapping("/chats/{phone}")
    fun getChatByNumber(@PathVariable phone: String): ChatMessageResponse? = chatService.getChatByPhone(phone);

}

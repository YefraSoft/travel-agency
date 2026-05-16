package com.api.travel_api.rag

import com.api.travel_api.api.*
import com.api.travel_api.booking.BookingService
import com.api.travel_api.chat.ChatContextCacheService
import com.api.travel_api.chat.ChatRepository
import com.api.travel_api.common.NotFoundException
import com.api.travel_api.customer.CustomerService
import com.api.travel_api.customer.toResponse
import com.api.travel_api.model.entities.Chat
import com.api.travel_api.model.enums.CustomerOrigin
import com.api.travel_api.model.enums.UserRole
import com.api.travel_api.travel.TravelRepository
import com.api.travel_api.travel.minCurrency
import com.api.travel_api.travel.toResponse
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class RagService(
    private val travelRepository: TravelRepository,
    private val customerService: CustomerService,
    private val bookingService: BookingService,
    private val chatRepository: ChatRepository,
    private val chatContextCacheService: ChatContextCacheService
) {

    @Transactional(readOnly = true)
    fun travels(): List<RagTravelResponse> =
        travelRepository.findAll()
            .filter { it.status.name == "ACTIVE" }
            .map {
                val activePackages = it.packages.filter { pkg -> pkg.active }
                RagTravelResponse(
                    id = it.id!!,
                    name = it.name,
                    slug = it.slug,
                    type = it.type,
                    destination = it.destination,
                    minPrice = activePackages.minOfOrNull { pkg -> pkg.pricePerPerson },
                    currency = it.minCurrency(),
                    availablePackages = activePackages.map { pkg -> pkg.toResponse() }
                )
            }

    @Transactional(readOnly = true)
    fun customerByPhone(phone: String): CustomerResponse =
        customerService.findByPhoneOrNull(phone)?.toResponse()
            ?: throw NotFoundException("Customer not found")

    @Transactional
    fun quote(request: RagQuoteRequest): BookingResponse {
        val customer = customerService.findByPhoneOrNull(request.phone)
            ?: customerService.create(
                CustomerRequest(
                    name = request.name,
                    email = request.email,
                    phone = request.phone,
                    origin = CustomerOrigin.WHATSAPP
                )
            ).let { customerService.findEntity(it.id) }

        return bookingService.create(
            BookingRequest(
                travelId = request.travelId,
                packageId = request.packageId,
                customerId = customer.id,
                customerPhone = request.phone,
                priceOfSale = request.priceOfSale,
                notes = request.notes
            )
        )
    }

    @Transactional
    fun createChat(request: ChatCreateRequest): ChatResponse {
        val customer = request.customerId?.let { customerService.findEntity(it) }
            ?: customerService.findByPhoneOrNull(request.phone)

        val chat = chatRepository.save(
            Chat(
                customer = customer,
                phone = request.phone,
                attendedBy = request.attendedBy,
                closedBy = request.closedBy,
                chatHistory = request.chatHistory,
                contextSummary = request.contextSummary,
            )
        )
        chatContextCacheService.put(chat)
        return chat.toResponse()
    }

    @Transactional
    fun addMessage(chatId: Int, request: ChatMessageRequest): ChatResponse {
        val chat = chatRepository.findById(chatId)
            .orElseThrow { NotFoundException("Chat not found") }

        val history = chat.chatHistory.toMutableList()
        history.addAll(request.interaction)
        chat.chatHistory = history

        val saved = chatRepository.save(chat)
        chatContextCacheService.append(saved, request.interaction)
        return saved.toResponse()
    }

    @Transactional
    fun closeChat(chatId: Int, request: ChatCloseRequest): ChatResponse {
        val chat = chatRepository.findById(chatId)
            .orElseThrow { NotFoundException("Chat not found") }

        return closeChat(chat, request)
    }

    @Transactional
    fun closeActiveChat(phone: String, request: ChatCloseRequest): ChatResponse {
        val chat = chatRepository.findFirstByPhoneAndClosedAtIsNullOrderByCreatedAtDesc(phone)
            ?: throw NotFoundException("Chat not found")

        return closeChat(chat, request)
    }

    private fun closeChat(chat: Chat, request: ChatCloseRequest): ChatResponse {
        chat.closedBy = UserRole.IA_AGENT
        chat.closedAt = LocalDateTime.now()
        chat.contextSummary = request.contextSummary ?: generateClosingSummary(chat)

        val saved = chatRepository.save(chat)
        chatContextCacheService.delete(saved.phone)
        return saved.toResponse()
    }

    private fun generateClosingSummary(chat: Chat): String {
        val totalMessages = chat.chatHistory.size
        val lastHumanMessage = chat.chatHistory.lastOrNull { it.type.name == "HUMAN" }?.content
        return buildString {
            append("Conversacion cerrada con ")
            append(totalMessages)
            append(" mensaje(s).")
            if (!lastHumanMessage.isNullOrBlank()) {
                append(" Ultima solicitud del cliente: ")
                append(lastHumanMessage.take(300))
            }
        }
    }
}

fun Chat.toResponse() = ChatResponse(
    id = id!!,
    phone = phone,
    customerId = customer?.id,
    contextSummary = contextSummary,
    closedAt = closedAt
)

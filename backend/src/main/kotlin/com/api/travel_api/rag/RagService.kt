package com.api.travel_api.rag

import com.api.travel_api.api.*
import com.api.travel_api.booking.BookingService
import com.api.travel_api.common.NotFoundException
import com.api.travel_api.customer.CustomerService
import com.api.travel_api.customer.toResponse
import com.api.travel_api.model.entities.Chat
import com.api.travel_api.model.entities.RagChat
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
    private val ragChatRepository: RagChatRepository
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

        return chatRepository.save(
            Chat(
                customer = customer,
                phone = request.phone,
                attendedBy = UserRole.IA_AGENT,
                contextSummary = request.contextSummary,
                chatHistory = mutableListOf()
            )
        ).toResponse()
    }

    @Transactional
    fun addMessage(chatId: Int, request: ChatMessageRequest): ChatResponse {
        val chat = chatRepository.findById(chatId)
            .orElseThrow { NotFoundException("Chat not found") }

        ragChatRepository.save(
            RagChat(
                chat = chat,
                intention = request.intention,
                escalated = request.escalated,
                interaction = request.interaction
            )
        )

        val history = chat.chatHistory.toMutableList()
        history.add(request.interaction)

        chat.chatHistory = history

        return chatRepository.save(chat).toResponse()
    }

    @Transactional
    fun closeChat(chatId: Int, request: ChatCloseRequest): ChatResponse {
        val chat = chatRepository.findById(chatId)
            .orElseThrow { NotFoundException("Chat not found") }

        chat.closedBy = UserRole.IA_AGENT
        chat.closedAt = LocalDateTime.now()
        chat.contextSummary = request.contextSummary ?: chat.contextSummary

        return chatRepository.save(chat).toResponse()
    }
}

fun Chat.toResponse() = ChatResponse(
    id = id!!,
    phone = phone,
    customerId = customer?.id,
    contextSummary = contextSummary,
    closedAt = closedAt
)

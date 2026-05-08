package com.api.travel_api.api

import com.api.travel_api.model.enums.*
import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty
import jakarta.validation.Valid
import jakarta.validation.constraints.*
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalDateTime

data class TravelPackageRequest(
    @field:NotBlank val name: String,
    @field:Positive val personsIncluded: Short,
    @field:Min(1) @field:Max(5) val hotelStars: Short? = null,
    @field:DecimalMin("0.01") val pricePerPerson: BigDecimal,
    val currency: Currency = Currency.MXN,
    @field:Positive val capacity: Short? = null,
    @field:PositiveOrZero val availableSpots: Short? = null,
    val active: Boolean = true
)

data class TravelHighlightRequest(
    @field:NotBlank val icon: String,
    @field:NotBlank val label: String,
    val sort: Short = 0
)

data class TravelIncludeRequest(
    val packageId: Int? = null,
    @field:NotBlank val icon: String,
    @field:NotBlank val label: String,
    val description: String? = null,
    val sort: Short = 0
)

data class TravelImageRequest(
    @field:NotBlank val url: String,
    @field:NotBlank val altText: String,
    val sort: Short = 0
)

data class TravelRequest(
    @field:NotBlank val name: String,
    @field:NotBlank val slug: String,
    val type: TravelType,
    @field:NotBlank val destination: String,
    val origin: String? = null,
    @field:Positive val durationDays: Short,
    @field:Positive val durationNights: Short,
    @field:Min(1) @field:Max(5) val stars: Short? = null,
    @field:NotBlank val description: String,
    val featured: Boolean = false,
    val status: TravelStatus = TravelStatus.ACTIVE,
    @field:Valid val packages: List<TravelPackageRequest> = emptyList(),
    @field:Valid val highlights: List<TravelHighlightRequest> = emptyList(),
    @field:Valid val includes: List<TravelIncludeRequest> = emptyList(),
    @field:Valid val images: List<TravelImageRequest> = emptyList()
)

data class TravelStatusRequest(val status: TravelStatus)

data class TravelPackageResponse(
    val id: Int,
    val name: String,
    val personsIncluded: Short,
    val hotelStars: Short?,
    val pricePerPerson: BigDecimal,
    val currency: Currency,
    val capacity: Short?,
    val availableSpots: Short?,
    val active: Boolean
)

data class TravelHighlightResponse(val id: Int, val icon: String, val label: String, val sort: Short)
data class TravelIncludeResponse(
    val id: Int,
    val packageId: Int?,
    val icon: String,
    val label: String,
    val description: String?,
    val sort: Short
)

data class TravelImageResponse(val id: Int, val url: String, val altText: String, val sort: Short)

data class TravelResponse(
    val id: Int,
    val name: String,
    val slug: String,
    val type: TravelType,
    val destination: String,
    val origin: String?,
    val durationDays: Short,
    val durationNights: Short,
    val stars: Short?,
    val description: String,
    val featured: Boolean,
    val status: TravelStatus,
    val minPrice: BigDecimal?,
    val rating: Double?,
    val coverImage: TravelImageResponse?,
    val packages: List<TravelPackageResponse>,
    val highlights: List<TravelHighlightResponse>,
    val includes: List<TravelIncludeResponse>,
    val images: List<TravelImageResponse>
)

data class CustomerRequest(
    @field:NotBlank val name: String,
    @field:Email val email: String? = null,
    @field:NotBlank val phone: String,
    val birthdate: LocalDate? = null,
    val origin: CustomerOrigin = CustomerOrigin.WHATSAPP
)

data class CustomerResponse(
    val id: Int,
    val name: String,
    val email: String?,
    val phone: String,
    val birthdate: LocalDate?,
    val origin: CustomerOrigin,
    val createdAt: LocalDateTime
)

data class CustomerChatResponse(
    val id: Int,
    val name: String,
    val phone: String,
    val origin: CustomerOrigin
)

data class BookingRequest(
    val travelId: Int,
    val packageId: Int,
    val customerId: Int? = null,
    val createdById: Int? = null,
    @field:NotBlank val customerPhone: String,
    @field:DecimalMin("0.01") val priceOfSale: BigDecimal,
    @field:DecimalMin("0.00") val discount: BigDecimal = BigDecimal.ZERO,
    val status: BookingStatus = BookingStatus.RESERVED,
    val notes: String? = null,
    val payLimit: LocalDate? = null
)

data class BookingStatusRequest(val status: BookingStatus)

data class BookingResponse(
    val id: Int,
    val travelId: Int,
    val travelName: String,
    val packageId: Int,
    val packageName: String,
    val customerId: Int?,
    val customerPhone: String,
    val priceOfSale: BigDecimal,
    val discount: BigDecimal,
    val paidAmount: BigDecimal,
    val pendingBalance: BigDecimal,
    val status: BookingStatus,
    val notes: String?,
    val payLimit: LocalDate?,
    val createdAt: LocalDateTime
)

data class PaymentRequest(
    @field:DecimalMin("0.01") val amount: BigDecimal,
    val method: PaymentMethod,
    val type: PaymentType,
    val customerId: Int? = null,
    val verifiedById: Int? = null,
    val reference: String? = null
)

data class PaymentResponse(
    val id: Int,
    val bookingId: Int,
    val amount: BigDecimal,
    val method: PaymentMethod,
    val type: PaymentType,
    val reference: String?,
    val active: Boolean,
    val createdAt: LocalDateTime
)

data class ReviewRequest(
    val travelId: Int? = null,
    val customerId: Int? = null,
    val bookingId: Int? = null,
    val type: ReviewType = ReviewType.POSITIVE,
    @field:Min(1) @field:Max(5) val calification: Short? = null,
    val commentary: String? = null,
    val visible: Boolean = true
)

data class ReviewResponse(
    val id: Int,
    val travelId: Int?,
    val customerId: Int?,
    val bookingId: Int?,
    val type: ReviewType,
    val calification: Short?,
    val commentary: String?,
    val visible: Boolean,
    val createdAt: LocalDateTime
)

data class RagTravelResponse(
    val id: Int,
    val name: String,
    val slug: String,
    val type: TravelType,
    val destination: String,
    val minPrice: BigDecimal?,
    val currency: Currency?,
    val availablePackages: List<TravelPackageResponse>
)

data class RagQuoteRequest(
    @field:NotBlank val phone: String,
    @field:NotBlank val name: String,
    val email: String? = null,
    val travelId: Int,
    val packageId: Int,
    @field:DecimalMin("0.01") val priceOfSale: BigDecimal,
    val notes: String? = null
)

data class ChatCreateRequest(
    @field:NotBlank val phone: String,
    val customerId: Int?,
    val attendedBy: UserRole,
    val closedBy: UserRole?,
    val chatHistory: List<ChatMessage>,
    val contextSummary: String?
)

data class ChatMessageRequest(
    val intention: ChatIntention = ChatIntention.UNKNOWN,
    val escalated: Boolean = false,
    val interaction: MutableList<ChatMessage>
)

data class ChatMessageResponse(
    val id: Int,
    val customerId: Int?,
    val attendedBy: UserRole,
    val closedBy: UserRole?,
    val chatHistory: List<ChatMessage>,
    val contextSummary: String?
)

data class ChatMessage @JsonCreator constructor(
    @JsonProperty("type") val type: MessageType,
    @JsonProperty("content") val content: String
)

data class ChatCloseRequest(val contextSummary: String? = null)

data class ChatResponse(
    val id: Int,
    val phone: String,
    val customerId: Int?,
    val contextSummary: String?,
    val closedAt: LocalDateTime?
)

data class PaymentAlertResponse(
    val bookingId: Int,
    val customerPhone: String,
    val travelName: String,
    val pendingBalance: BigDecimal,
    val payLimit: LocalDate?
)


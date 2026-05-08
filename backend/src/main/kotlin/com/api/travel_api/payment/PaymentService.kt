package com.api.travel_api.payment

import com.api.travel_api.api.PaymentRequest
import com.api.travel_api.api.PaymentResponse
import com.api.travel_api.booking.BookingService
import com.api.travel_api.common.BusinessException
import com.api.travel_api.common.NotFoundException
import com.api.travel_api.customer.CustomerService
import com.api.travel_api.model.entities.Payment
import com.api.travel_api.user.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class PaymentService(
    private val paymentRepository: PaymentRepository,
    private val bookingService: BookingService,
    private val customerService: CustomerService,
    private val userRepository: UserRepository
) {
    @Transactional(readOnly = true)
    fun listByBooking(bookingId: Int): List<PaymentResponse> {
        bookingService.findEntity(bookingId)
        return paymentRepository.findByBookingIdOrderByCreatedAtDesc(bookingId).map { it.toResponse() }
    }

    @Transactional
    fun create(bookingId: Int, request: PaymentRequest): PaymentResponse {
        val booking = bookingService.findEntity(bookingId)
        val paid = bookingService.activePaid(bookingId)
        if (paid + request.amount > booking.priceOfSale) {
            throw BusinessException("Payment exceeds pending balance")
        }
        val payment = Payment(
            booking = booking,
            customer = request.customerId?.let { customerService.findEntity(it) } ?: booking.customer,
            verifiedBy = request.verifiedById?.let {
                userRepository.findById(it).orElseThrow { NotFoundException("User not found") }
            },
            amount = request.amount,
            method = request.method,
            type = request.type,
            reference = request.reference
        )
        return paymentRepository.save(payment).toResponse()
    }

    @Transactional
    fun void(id: Int): PaymentResponse {
        val payment = paymentRepository.findById(id).orElseThrow { NotFoundException("Payment not found") }
        payment.active = false
        return paymentRepository.save(payment).toResponse()
    }
}

fun Payment.toResponse() = PaymentResponse(
    id = id!!,
    bookingId = booking.id!!,
    amount = amount,
    method = method,
    type = type,
    reference = reference,
    active = active,
    createdAt = createdAt
)


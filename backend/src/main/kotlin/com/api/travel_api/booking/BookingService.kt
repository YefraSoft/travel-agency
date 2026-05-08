package com.api.travel_api.booking

import com.api.travel_api.api.*
import com.api.travel_api.common.BusinessException
import com.api.travel_api.common.NotFoundException
import com.api.travel_api.customer.CustomerService
import com.api.travel_api.model.entities.Booking
import com.api.travel_api.model.enums.BookingStatus
import com.api.travel_api.payment.PaymentRepository
import com.api.travel_api.travel.TravelService
import com.api.travel_api.user.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.LocalDate

@Service
class BookingService(
    private val bookingRepository: BookingRepository,
    private val paymentRepository: PaymentRepository,
    private val travelService: TravelService,
    private val customerService: CustomerService,
    private val userRepository: UserRepository
) {
    @Transactional(readOnly = true)
    fun list(status: BookingStatus?, phone: String?): List<BookingResponse> {
        val bookings = when {
            status != null -> bookingRepository.findByStatus(status)
            phone != null -> bookingRepository.findByCustomerPhone(phone)
            else -> bookingRepository.findAll()
        }
        return bookings.map { it.toResponse(activePaid(it.id!!)) }
    }

    @Transactional(readOnly = true)
    fun get(id: Int): BookingResponse {
        val booking = findEntity(id)
        return booking.toResponse(activePaid(id))
    }

    @Transactional
    fun create(request: BookingRequest): BookingResponse {
        val travel = travelService.findEntity(request.travelId)
        val travelPackage = travelService.findPackage(request.packageId)
        if (travelPackage.travel.id != travel.id) throw BusinessException("Package does not belong to travel")
        val customer = request.customerId?.let { customerService.findEntity(it) }
        val createdBy = request.createdById?.let {
            userRepository.findById(it).orElseThrow { NotFoundException("User not found") }
        }
        val booking = Booking(
            travel = travel,
            travelPackage = travelPackage,
            customer = customer,
            createdBy = createdBy,
            customerPhone = request.customerPhone,
            priceOfSale = request.priceOfSale,
            discount = request.discount,
            status = BookingStatus.RESERVED,
            notes = request.notes,
            payLimit = request.payLimit
        )
        val saved = bookingRepository.save(booking)
        if (request.status != BookingStatus.RESERVED) {
            changeStatus(saved.id!!, request.status)
        }
        return findEntity(saved.id!!).toResponse(activePaid(saved.id!!))
    }

    @Transactional
    fun update(id: Int, request: BookingRequest): BookingResponse {
        val booking = findEntity(id)
        val travel = travelService.findEntity(request.travelId)
        val travelPackage = travelService.findPackage(request.packageId)
        if (travelPackage.travel.id != travel.id) throw BusinessException("Package does not belong to travel")
        booking.travel = travel
        booking.travelPackage = travelPackage
        booking.customer = request.customerId?.let { customerService.findEntity(it) }
        booking.createdBy = request.createdById?.let {
            userRepository.findById(it).orElseThrow { NotFoundException("User not found") }
        }
        booking.customerPhone = request.customerPhone
        booking.priceOfSale = request.priceOfSale
        booking.discount = request.discount
        booking.notes = request.notes
        booking.payLimit = request.payLimit
        bookingRepository.save(booking)
        if (booking.status != request.status) changeStatus(id, request.status)
        return findEntity(id).toResponse(activePaid(id))
    }

    @Transactional
    fun changeStatus(id: Int, status: BookingStatus): BookingResponse {
        val booking = findEntity(id)
        val oldStatus = booking.status
        if (oldStatus != BookingStatus.CONFIRMED && status == BookingStatus.CONFIRMED) {
            decrementCapacity(booking)
        }
        if (oldStatus == BookingStatus.CONFIRMED && status == BookingStatus.CANCELLED) {
            restoreCapacity(booking)
        }
        booking.status = status
        return bookingRepository.save(booking).toResponse(activePaid(id))
    }

    @Transactional(readOnly = true)
    fun paymentAlerts(today: LocalDate = LocalDate.now()): List<PaymentAlertResponse> =
        bookingRepository.findByStatus(BookingStatus.CONFIRMED)
            .filter { it.payLimit != null && !it.payLimit!!.isAfter(today.plusDays(7)) && it.toPendingBalance(activePaid(it.id!!)) > BigDecimal.ZERO }
            .map {
                PaymentAlertResponse(
                    bookingId = it.id!!,
                    customerPhone = it.customerPhone,
                    travelName = it.travel.name,
                    pendingBalance = it.toPendingBalance(activePaid(it.id!!)),
                    payLimit = it.payLimit
                )
            }

    fun findEntity(id: Int): Booking =
        bookingRepository.findById(id).orElseThrow { NotFoundException("Booking not found") }

    fun hasCompletedBooking(customerId: Int, travelId: Int): Boolean =
        bookingRepository.existsByCustomerIdAndTravelIdAndStatus(customerId, travelId, BookingStatus.COMPLETED)

    fun activePaid(bookingId: Int): BigDecimal =
        paymentRepository.findByBookingIdAndActiveTrue(bookingId).fold(BigDecimal.ZERO) { sum, payment -> sum + payment.amount }

    private fun decrementCapacity(booking: Booking) {
        val available = booking.travelPackage.availableSpots ?: return
        if (available <= 0) throw BusinessException("Package has no available spots")
        booking.travelPackage.availableSpots = (available - 1).toShort()
    }

    private fun restoreCapacity(booking: Booking) {
        val available = booking.travelPackage.availableSpots ?: return
        val capacity = booking.travelPackage.capacity
        val restored = (available + 1).toShort()
        booking.travelPackage.availableSpots = if (capacity != null && restored > capacity) capacity else restored
    }
}

fun Booking.toPendingBalance(paidAmount: BigDecimal): BigDecimal = priceOfSale.subtract(paidAmount)

fun Booking.toResponse(paidAmount: BigDecimal) = BookingResponse(
    id = id!!,
    travelId = travel.id!!,
    travelName = travel.name,
    packageId = travelPackage.id!!,
    packageName = travelPackage.name,
    customerId = customer?.id,
    customerPhone = customerPhone,
    priceOfSale = priceOfSale,
    discount = discount,
    paidAmount = paidAmount,
    pendingBalance = toPendingBalance(paidAmount),
    status = status,
    notes = notes,
    payLimit = payLimit,
    createdAt = createdAt
)


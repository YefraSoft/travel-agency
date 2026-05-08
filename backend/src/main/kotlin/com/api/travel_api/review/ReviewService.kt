package com.api.travel_api.review

import com.api.travel_api.api.ReviewRequest
import com.api.travel_api.api.ReviewResponse
import com.api.travel_api.booking.BookingService
import com.api.travel_api.common.BusinessException
import com.api.travel_api.common.ConflictException
import com.api.travel_api.customer.CustomerService
import com.api.travel_api.model.entities.Review
import com.api.travel_api.model.enums.BookingStatus
import com.api.travel_api.travel.TravelService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class ReviewService(
    private val reviewRepository: ReviewRepository,
    private val travelService: TravelService,
    private val customerService: CustomerService,
    private val bookingService: BookingService
) {
    @Transactional(readOnly = true)
    fun listByTravel(travelId: Int): List<ReviewResponse> {
        travelService.findEntity(travelId)
        return reviewRepository.findByTravelIdAndVisibleTrueOrderByCreatedAtDesc(travelId).map { it.toResponse() }
    }

    @Transactional
    fun create(request: ReviewRequest): ReviewResponse {
        val travel = request.travelId?.let { travelService.findEntity(it) }
        val customer = request.customerId?.let { customerService.findEntity(it) }
        val booking = request.bookingId?.let { bookingService.findEntity(it) }

        if (booking != null && booking.status != BookingStatus.COMPLETED) {
            throw BusinessException("Reviews require a completed booking")
        }
        if (booking != null && travel != null && booking.travel.id != travel.id) {
            throw BusinessException("Booking does not belong to travel")
        }
        if (booking != null && customer != null && booking.customer?.id != customer.id) {
            throw BusinessException("Booking does not belong to customer")
        }
        if (booking == null && travel != null && customer != null && !bookingService.hasCompletedBooking(customer.id!!, travel.id!!)) {
            throw BusinessException("Customer needs a completed booking to review this travel")
        }
        if (travel != null && customer != null && reviewRepository.existsByCustomerIdAndTravelId(customer.id!!, travel.id!!)) {
            throw ConflictException("Customer already reviewed this travel")
        }

        return reviewRepository.save(
            Review(
                travel = travel ?: booking?.travel,
                customer = customer ?: booking?.customer,
                booking = booking,
                type = request.type,
                calification = request.calification,
                commentary = request.commentary,
                visible = request.visible
            )
        ).toResponse()
    }
}

fun Review.toResponse() = ReviewResponse(
    id = id!!,
    travelId = travel?.id,
    customerId = customer?.id,
    bookingId = booking?.id,
    type = type,
    calification = calification,
    commentary = commentary,
    visible = visible,
    createdAt = createdAt
)


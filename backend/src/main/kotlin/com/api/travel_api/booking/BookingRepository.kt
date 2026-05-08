package com.api.travel_api.booking

import com.api.travel_api.model.entities.Booking
import com.api.travel_api.model.enums.BookingStatus
import org.springframework.data.jpa.repository.JpaRepository

interface BookingRepository : JpaRepository<Booking, Int> {
    fun findByCustomerPhone(customerPhone: String): List<Booking>
    fun findByStatus(status: BookingStatus): List<Booking>
    fun findByTravelId(travelId: Int): List<Booking>
    fun existsByCustomerIdAndTravelIdAndStatus(customerId: Int, travelId: Int, status: BookingStatus): Boolean
}


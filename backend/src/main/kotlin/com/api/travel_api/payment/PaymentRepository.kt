package com.api.travel_api.payment

import com.api.travel_api.model.entities.Payment
import org.springframework.data.jpa.repository.JpaRepository

interface PaymentRepository : JpaRepository<Payment, Int> {
    fun findByBookingIdOrderByCreatedAtDesc(bookingId: Int): List<Payment>
    fun findByBookingIdAndActiveTrue(bookingId: Int): List<Payment>
}


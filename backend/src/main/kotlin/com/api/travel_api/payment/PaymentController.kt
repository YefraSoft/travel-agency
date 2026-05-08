package com.api.travel_api.payment

import com.api.travel_api.api.PaymentRequest
import com.api.travel_api.api.PaymentResponse
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.*

@RestController
@Tag(name = "Admin payments")
class PaymentController(private val paymentService: PaymentService) {
    @GetMapping("/api/admin/bookings/{bookingId}/payments")
    fun list(@PathVariable bookingId: Int): List<PaymentResponse> = paymentService.listByBooking(bookingId)

    @PostMapping("/api/admin/bookings/{bookingId}/payments")
    fun create(@PathVariable bookingId: Int, @Valid @RequestBody request: PaymentRequest): PaymentResponse =
        paymentService.create(bookingId, request)

    @PatchMapping("/api/admin/payments/{id}/void")
    fun void(@PathVariable id: Int): PaymentResponse = paymentService.void(id)
}


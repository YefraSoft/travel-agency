package com.api.travel_api.booking

import com.api.travel_api.api.BookingRequest
import com.api.travel_api.api.BookingResponse
import com.api.travel_api.api.BookingStatusRequest
import com.api.travel_api.api.PaymentAlertResponse
import com.api.travel_api.model.enums.BookingStatus
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/admin/bookings")
@Tag(name = "Admin bookings")
class BookingController(private val bookingService: BookingService) {
    @GetMapping
    fun list(
        @RequestParam(required = false) status: BookingStatus?,
        @RequestParam(required = false) phone: String?
    ): List<BookingResponse> = bookingService.list(status, phone)

    @GetMapping("/{id}")
    fun get(@PathVariable id: Int): BookingResponse = bookingService.get(id)

    @PostMapping
    fun create(@Valid @RequestBody request: BookingRequest): BookingResponse = bookingService.create(request)

    @PutMapping("/{id}")
    fun update(@PathVariable id: Int, @Valid @RequestBody request: BookingRequest): BookingResponse =
        bookingService.update(id, request)

    @PatchMapping("/{id}/status")
    fun status(@PathVariable id: Int, @RequestBody request: BookingStatusRequest): BookingResponse =
        bookingService.changeStatus(id, request.status)
}

@RestController
@RequestMapping("/api/admin/collections")
@Tag(name = "Admin collections")
class CollectionsController(private val bookingService: BookingService) {
    @GetMapping("/payment-alerts")
    fun paymentAlerts(): List<PaymentAlertResponse> = bookingService.paymentAlerts()
}


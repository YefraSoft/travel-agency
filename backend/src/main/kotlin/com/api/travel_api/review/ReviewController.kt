package com.api.travel_api.review

import com.api.travel_api.api.ReviewRequest
import com.api.travel_api.api.ReviewResponse
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.*

@RestController
@Tag(name = "Reviews")
class ReviewController(private val reviewService: ReviewService) {
    @GetMapping("/api/reviews")
    fun listVisible(): List<ReviewResponse> = reviewService.listVisible()

    @GetMapping("/api/travels/{travelId}/reviews")
    fun listByTravel(@PathVariable travelId: Int): List<ReviewResponse> = reviewService.listByTravel(travelId)

    @PostMapping("/api/reviews")
    fun create(@Valid @RequestBody request: ReviewRequest): ReviewResponse = reviewService.create(request)
}

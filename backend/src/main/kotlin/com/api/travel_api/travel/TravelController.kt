package com.api.travel_api.travel

import com.api.travel_api.api.*
import com.api.travel_api.model.enums.TravelType
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/travels")
@Tag(name = "Public travels")
class PublicTravelController(private val travelService: TravelService) {
    @GetMapping
    @Operation(summary = "List active travels for the public catalog")
    fun list(@RequestParam(required = false) type: TravelType?): List<TravelResponse> = travelService.publicList(type)

    @GetMapping("/{id:\\d+}")
    fun get(@PathVariable id: Int): TravelResponse = travelService.getById(id)

    @GetMapping("/slug/{slug}")
    fun getBySlug(@PathVariable slug: String): TravelResponse = travelService.getBySlug(slug)

    @GetMapping("/{slug}")
    fun getBySlugPath(@PathVariable slug: String): TravelResponse = travelService.getBySlug(slug)
}

@RestController
@RequestMapping("/api/admin/travels")
@Tag(name = "Admin travels")
class AdminTravelController(private val travelService: TravelService) {
    @GetMapping
    fun list(): List<TravelResponse> = travelService.adminList()

    @PostMapping
    fun create(@Valid @RequestBody request: TravelRequest): TravelResponse = travelService.create(request)

    @PutMapping("/{id}")
    fun update(@PathVariable id: Int, @Valid @RequestBody request: TravelRequest): TravelResponse =
        travelService.update(id, request)

    @PatchMapping("/{id}/status")
    fun status(@PathVariable id: Int, @RequestBody request: TravelStatusRequest): TravelResponse =
        travelService.changeStatus(id, request.status)
}

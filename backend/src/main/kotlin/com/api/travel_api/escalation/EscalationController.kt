package com.api.travel_api.escalation

import com.api.travel_api.api.EscalationRequest
import com.api.travel_api.api.EscalationStatusRequest
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/rag/escalations")
@Tag(name = "Escalations")
class EscalationController(
    private val service: EscalationService
) {

    @PostMapping
    fun create(@Valid @RequestBody request: EscalationRequest) = service.create(request)

    @GetMapping("/pending")
    fun listPending() = service.listPending()

    @GetMapping("/{id}")
    fun getById(@PathVariable id: Int) = service.getById(id)

    @PatchMapping("/{id}/status")
    fun updateStatus(@PathVariable id: Int, @RequestBody request: EscalationStatusRequest) =
        service.updateStatus(id, request.status, request.attendedBy)
}

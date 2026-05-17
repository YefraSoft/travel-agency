package com.api.travel_api.escalation

import com.api.travel_api.api.EscalationRequest
import com.api.travel_api.api.EscalationResponse
import com.api.travel_api.common.NotFoundException
import com.api.travel_api.escalation.model.EscalationRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class EscalationService(
    private val repository: EscalationRepository
) {

    @Transactional
    fun create(request: EscalationRequest): EscalationResponse {
        val escalation = repository.save(
            com.api.travel_api.escalation.model.Escalation(
                chatId = request.chatId,
                phone = request.phone,
                reason = request.reason,
                clientQuestion = request.clientQuestion,
                context = request.context,
                suggestedAction = request.suggestedAction,
                status = "pending"
            )
        )
        return escalation.toResponse()
    }

    @Transactional(readOnly = true)
    fun listPending(): List<EscalationResponse> =
        repository.findByStatusOrderByCreatedAtDesc("pending")
            .map { it.toResponse() }

    @Transactional(readOnly = true)
    fun getById(id: Int): EscalationResponse =
        repository.findById(id)
            .orElseThrow { NotFoundException("Escalation not found with id: $id") }
            .toResponse()

    @Transactional
    fun updateStatus(id: Int, status: String, attendedBy: String?): EscalationResponse {
        val escalation = repository.findById(id)
            .orElseThrow { NotFoundException("Escalation not found with id: $id") }

        val now = LocalDateTime.now()
        val updated = when (status) {
            "attended" -> escalation.copy(
                status = status,
                attendedBy = attendedBy ?: escalation.attendedBy,
                attendedAt = now
            )
            "resolved" -> escalation.copy(
                status = status,
                attendedBy = attendedBy ?: escalation.attendedBy,
                attendedAt = escalation.attendedAt ?: now,
                resolvedAt = now
            )
            else -> escalation.copy(status = status)
        }

        return repository.save(updated).toResponse()
    }

    private fun com.api.travel_api.escalation.model.Escalation.toResponse() = EscalationResponse(
        id = id!!,
        chatId = chatId,
        phone = phone,
        reason = reason,
        clientQuestion = clientQuestion,
        context = context,
        suggestedAction = suggestedAction,
        status = status,
        attendedBy = attendedBy,
        attendedAt = attendedAt,
        resolvedAt = resolvedAt,
        createdAt = createdAt
    )
}

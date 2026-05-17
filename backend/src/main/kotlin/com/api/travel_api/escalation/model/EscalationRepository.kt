package com.api.travel_api.escalation.model

import org.springframework.data.jpa.repository.JpaRepository

interface EscalationRepository : JpaRepository<Escalation, Int> {
    fun findByStatusOrderByCreatedAtDesc(status: String): List<Escalation>
    fun findByPhoneOrderByCreatedAtDesc(phone: String): List<Escalation>
}

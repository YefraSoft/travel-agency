package com.api.travel_api.model.entities

import jakarta.persistence.*
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Positive
import java.time.LocalDateTime

@Entity
@Table(
    name = "companions"
)
data class Companion(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Int? = null,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
        name = "customer_id",
        nullable = false,
        foreignKey = ForeignKey(name = "fk_companions_customer")
    )
    var customer: Customer,

    @field:NotBlank
    @Column(nullable = false, length = 100)
    var name: String,

    @field:Positive
    @Column(nullable = false)
    var age: Short,

    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()
)

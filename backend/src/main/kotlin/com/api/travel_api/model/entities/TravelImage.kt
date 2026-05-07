package com.api.travel_api.model.entities

import jakarta.persistence.*
import jakarta.validation.constraints.NotBlank
import java.time.LocalDateTime

@Entity
@Table(name = "travel_images")
data class TravelImage(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Int? = null,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "travel_id", nullable = false)
    var travel: Travel,

    @field:NotBlank
    @Column(nullable = false, length = 500)
    var url: String,

    @field:NotBlank
    @Column(name = "alt_text", nullable = false, length = 255)
    var altText: String,

    @Column(nullable = false)
    var sort: Short = 0,

    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()
)


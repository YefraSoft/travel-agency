package com.api.travel_api.model.entities

import jakarta.persistence.*
import jakarta.validation.constraints.NotBlank

@Entity
@Table(name = "travel_highlights")
data class TravelHighlight(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Int? = null,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "travel_id", nullable = false)
    var travel: Travel,

    @field:NotBlank
    @Column(nullable = false, length = 100)
    var icon: String,

    @field:NotBlank
    @Column(nullable = false, length = 80)
    var label: String,

    @Column(nullable = false)
    var sort: Short = 0
)


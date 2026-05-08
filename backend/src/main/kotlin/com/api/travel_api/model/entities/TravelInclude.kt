package com.api.travel_api.model.entities

import jakarta.persistence.*
import jakarta.validation.constraints.NotBlank

@Entity
@Table(name = "travel_includes")
data class TravelInclude(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Int? = null,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "travel_id", nullable = false)
    var travel: Travel,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "package_id")
    var travelPackage: TravelPackage? = null,

    @field:NotBlank
    @Column(nullable = false, length = 100)
    var icon: String,

    @field:NotBlank
    @Column(nullable = false, length = 150)
    var label: String,

    @Column(length = 255)
    var description: String? = null,

    @Column(nullable = false)
    var sort: Short = 0
)


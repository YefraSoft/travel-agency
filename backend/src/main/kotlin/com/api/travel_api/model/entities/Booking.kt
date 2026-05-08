package com.api.travel_api.model.entities

import com.api.travel_api.model.enums.BookingStatus
import jakarta.persistence.*
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.NotBlank
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalDateTime

@Entity
@Table(name = "bookings")
data class Booking(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Int? = null,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "travel_id", nullable = false)
    var travel: Travel,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "package_id", nullable = false)
    var travelPackage: TravelPackage,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    var customer: Customer? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    var createdBy: User? = null,

    @field:NotBlank
    @Column(name = "customer_phone", nullable = false, length = 14)
    var customerPhone: String,

    @field:DecimalMin(value = "0.01")
    @Column(name = "price_of_sale", nullable = false, precision = 10, scale = 2)
    var priceOfSale: BigDecimal,

    @field:DecimalMin(value = "0.00")
    @Column(nullable = false, precision = 10, scale = 2)
    var discount: BigDecimal = BigDecimal.ZERO,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: BookingStatus = BookingStatus.RESERVED,

    @Column(columnDefinition = "TEXT")
    var notes: String? = null,

    @Column(name = "pay_limit")
    var payLimit: LocalDate? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),

    @OneToMany(mappedBy = "booking", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.LAZY)
    var companions: MutableList<BookingCompanion> = mutableListOf(),

    @OneToMany(mappedBy = "booking", fetch = FetchType.LAZY)
    var payments: MutableList<Payment> = mutableListOf()
)

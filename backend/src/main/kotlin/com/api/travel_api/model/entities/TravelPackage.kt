package com.api.travel_api.model.entities

import com.api.travel_api.model.enums.Currency
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.ForeignKey
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Positive
import org.hibernate.annotations.JdbcType
import org.hibernate.dialect.type.PostgreSQLEnumJdbcType
import java.math.BigDecimal
import java.time.LocalDateTime

@Entity
@Table(
    name = "travel_packages"
)
data class TravelPackage(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Int? = null,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
        name = "travel_id",
        nullable = false,
        foreignKey = ForeignKey(name = "fk_travel_packages_travel")
    )
    var travel: Travel,

    @field:NotBlank
    @Column(nullable = false, length = 100)
    var name: String,

    @field:Positive
    @Column(name = "persons_included", nullable = false)
    var personsIncluded: Short,

    @field:Min(1)
    @field:Max(5)
    @Column(name = "hotel_stars")
    var hotelStars: Short? = null,

    @field:DecimalMin(value = "0.01")
    @Column(
        name = "price_per_person",
        nullable = false,
        precision = 10,
        scale = 2
    )
    var pricePerPerson: BigDecimal,

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType::class)
    @Column(nullable = false, columnDefinition = "currency")
    var currency: Currency = Currency.MXN,

    @Column
    var capacity: Short? = null,

    @Column(name = "available_spots")
    var availableSpots: Short? = null,

    @Column(name = "is_active", nullable = false)
    var active: Boolean = true,

    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()
)

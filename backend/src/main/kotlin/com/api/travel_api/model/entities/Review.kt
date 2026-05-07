package com.api.travel_api.model.entities

import com.api.travel_api.model.enums.ReviewType
import jakarta.persistence.*
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import org.hibernate.annotations.JdbcType
import org.hibernate.dialect.type.PostgreSQLEnumJdbcType
import java.time.LocalDateTime

@Entity
@Table(
    name = "reviews",
    uniqueConstraints = [UniqueConstraint(name = "uq_review_customer_travel", columnNames = ["customer_id", "travel_id"])]
)
data class Review(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Int? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "travel_id")
    var travel: Travel? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    var customer: Customer? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id")
    var booking: Booking? = null,

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType::class)
    @Column(nullable = false, columnDefinition = "review_type")
    var type: ReviewType,

    @field:Min(1)
    @field:Max(5)
    @Column
    var calification: Short? = null,

    @Column(columnDefinition = "TEXT")
    var commentary: String? = null,

    @Column(name = "is_visible", nullable = false)
    var visible: Boolean = true,

    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()
)

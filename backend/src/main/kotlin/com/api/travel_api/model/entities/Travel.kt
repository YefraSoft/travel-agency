package com.api.travel_api.model.entities

import com.api.travel_api.model.enums.TravelStatus
import com.api.travel_api.model.enums.TravelType
import jakarta.persistence.*
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Positive
import org.hibernate.annotations.JdbcType
import org.hibernate.dialect.type.PostgreSQLEnumJdbcType
import java.time.LocalDateTime


@Entity
@Table(
    name = "travels"
)
data class Travel(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Int? = null,

    @field:NotBlank
    @Column(nullable = false, length = 150)
    var name: String,

    @field:NotBlank
    @Column(nullable = false, unique = true, length = 170)
    var slug: String,

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType::class)
    @Column(nullable = false, columnDefinition = "travel_type")
    var type: TravelType,

    @field:NotBlank
    @Column(nullable = false, length = 150)
    var destination: String,

    @Column(length = 150)
    var origin: String? = null,

    @field:Positive
    @Column(name = "duration_days", nullable = false)
    var durationDays: Short,

    @field:Positive
    @Column(name = "duration_nights", nullable = false)
    var durationNights: Short,

    @field:Min(1)
    @field:Max(5)
    @Column
    var stars: Short? = null,

    @field:NotBlank
    @Column(nullable = false)
    var description: String,

    @Column(name = "is_featured", nullable = false)
    var featured: Boolean = false,

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType::class)
    @Column(nullable = false, columnDefinition = "travel_status")
    var status: TravelStatus = TravelStatus.ACTIVE,

    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),

    @OneToMany(
        mappedBy = "travel",
        cascade = [CascadeType.ALL],
        orphanRemoval = true,
        fetch = FetchType.LAZY
    )
    var packages: MutableList<TravelPackage> = mutableListOf(),

    @OneToMany(
        mappedBy = "travel",
        cascade = [CascadeType.ALL],
        orphanRemoval = true,
        fetch = FetchType.LAZY
    )
    var highlights: MutableList<TravelHighlight> = mutableListOf(),

    @OneToMany(
        mappedBy = "travel",
        cascade = [CascadeType.ALL],
        orphanRemoval = true,
        fetch = FetchType.LAZY
    )
    var includes: MutableList<TravelInclude> = mutableListOf(),

    @OneToMany(
        mappedBy = "travel",
        cascade = [CascadeType.ALL],
        orphanRemoval = true,
        fetch = FetchType.LAZY
    )
    var images: MutableList<TravelImage> = mutableListOf()
)

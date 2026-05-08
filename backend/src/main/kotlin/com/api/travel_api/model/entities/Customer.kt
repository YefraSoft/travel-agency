package com.api.travel_api.model.entities

import com.api.travel_api.model.enums.CustomerOrigin
import jakarta.persistence.*
import jakarta.validation.constraints.NotBlank
import org.hibernate.annotations.JdbcType
import org.hibernate.dialect.type.PostgreSQLEnumJdbcType
import java.time.LocalDate
import java.time.LocalDateTime

@Entity
@Table(name = "customers")
data class Customer(

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Int? = null,

    @field:NotBlank
    @Column(name = "name", nullable = false, length = 100)
    var name: String,

    @Column(name = "email", unique = true, length = 100)
    var email: String? = null,

    @field:NotBlank
    @Column(name = "phone", nullable = false, unique = true, length = 14)
    var phone: String,

    @Column(name = "birthdate")
    var birthdate: LocalDate? = null,

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType::class)
    @Column(name = "origin", nullable = false, columnDefinition = "customer_origin")
    var origin: CustomerOrigin = CustomerOrigin.WHATSAPP,

    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @OneToMany(
        mappedBy = "customer",
        cascade = [CascadeType.ALL],
        orphanRemoval = true,
        fetch = FetchType.LAZY
    )
    var companions: MutableList<Companion> = mutableListOf()
)

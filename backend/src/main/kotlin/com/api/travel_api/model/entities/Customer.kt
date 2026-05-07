package com.api.travel_api.model.entities

import com.api.travel_api.model.enums.CustomerOrigin
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.LocalDate
import java.time.LocalDateTime

@Entity
@Table(name = "customers")
data class Customer(

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "name", nullable = false, length = 100)
    var name: String,

    @Column(name = "email", unique = true, length = 100)
    var email: String? = null,

    @Column(name = "phone", nullable = false, unique = true, length = 14)
    var phone: String,

    @Column(name = "birthdate")
    var birthdate: LocalDate? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "origin", nullable = false)
    var origin: CustomerOrigin = CustomerOrigin.WHATSAPP,

    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
)

package com.api.travel_api.model.entities

import jakarta.persistence.*
import java.io.Serializable

@Embeddable
data class BookingCompanionId(
    @Column(name = "booking_id")
    var bookingId: Int? = null,

    @Column(name = "companion_id")
    var companionId: Int? = null
) : Serializable

@Entity
@Table(name = "booking_companions")
data class BookingCompanion(
    @EmbeddedId
    var id: BookingCompanionId = BookingCompanionId(),

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("bookingId")
    @JoinColumn(name = "booking_id", nullable = false)
    var booking: Booking,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("companionId")
    @JoinColumn(name = "companion_id", nullable = false)
    var companion: Companion
)


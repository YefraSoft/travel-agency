package com.api.travel_api.review

import com.api.travel_api.model.entities.Review
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.math.BigDecimal

interface ReviewRepository : JpaRepository<Review, Int> {
    fun findByVisibleTrueOrderByCreatedAtDesc(): List<Review>
    fun findByTravelIdAndVisibleTrueOrderByCreatedAtDesc(travelId: Int): List<Review>
    fun existsByCustomerIdAndTravelId(customerId: Int, travelId: Int): Boolean

    @Query("select avg(r.calification) from Review r where r.travel.id = :travelId and r.visible = true and r.calification is not null")
    fun averageRating(travelId: Int): Double?
}

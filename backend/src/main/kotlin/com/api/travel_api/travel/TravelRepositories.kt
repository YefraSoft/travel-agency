package com.api.travel_api.travel

import com.api.travel_api.model.entities.Travel
import com.api.travel_api.model.entities.TravelPackage
import com.api.travel_api.model.enums.TravelStatus
import com.api.travel_api.model.enums.TravelType
import org.springframework.data.jpa.repository.JpaRepository

interface TravelRepository : JpaRepository<Travel, Int> {
    fun findBySlug(slug: String): Travel?
    fun findByStatus(status: TravelStatus): List<Travel>
    fun findByTypeAndStatus(type: TravelType, status: TravelStatus): List<Travel>
    fun existsBySlug(slug: String): Boolean
}

interface TravelPackageRepository : JpaRepository<TravelPackage, Int> {
    fun findByTravelId(travelId: Int): List<TravelPackage>
}


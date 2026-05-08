package com.api.travel_api.travel

import com.api.travel_api.api.*
import com.api.travel_api.common.ConflictException
import com.api.travel_api.common.NotFoundException
import com.api.travel_api.model.entities.*
import com.api.travel_api.model.enums.TravelStatus
import com.api.travel_api.model.enums.TravelType
import com.api.travel_api.review.ReviewRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class TravelService(
    private val travelRepository: TravelRepository,
    private val packageRepository: TravelPackageRepository,
    private val reviewRepository: ReviewRepository
) {
    @Transactional(readOnly = true)
    fun publicList(type: TravelType?): List<TravelResponse> {
        val travels = if (type == null) {
            travelRepository.findByStatus(TravelStatus.ACTIVE)
        } else {
            travelRepository.findByTypeAndStatus(type, TravelStatus.ACTIVE)
        }
        return travels.map { it.toResponse(reviewRepository.averageRating(it.id!!)) }
    }

    @Transactional(readOnly = true)
    fun adminList(): List<TravelResponse> =
        travelRepository.findAll().map { it.toResponse(reviewRepository.averageRating(it.id!!)) }

    @Transactional(readOnly = true)
    fun getById(id: Int): TravelResponse {
        val travel = findEntity(id)
        return travel.toResponse(reviewRepository.averageRating(id))
    }

    @Transactional(readOnly = true)
    fun getBySlug(slug: String): TravelResponse {
        val travel = travelRepository.findBySlug(slug) ?: throw NotFoundException("Travel not found")
        return travel.toResponse(reviewRepository.averageRating(travel.id!!))
    }

    @Transactional
    fun create(request: TravelRequest): TravelResponse {
        if (travelRepository.existsBySlug(request.slug)) {
            throw ConflictException("Travel slug already exists")
        }
        val travel = Travel(
            name = request.name,
            slug = request.slug,
            type = request.type,
            destination = request.destination,
            origin = request.origin,
            durationDays = request.durationDays,
            durationNights = request.durationNights,
            stars = request.stars,
            description = request.description,
            featured = request.featured,
            status = request.status
        )
        applyChildren(travel, request)
        return travelRepository.save(travel).toResponse()
    }

    @Transactional
    fun update(id: Int, request: TravelRequest): TravelResponse {
        val travel = findEntity(id)
        if (travel.slug != request.slug && travelRepository.existsBySlug(request.slug)) {
            throw ConflictException("Travel slug already exists")
        }
        travel.name = request.name
        travel.slug = request.slug
        travel.type = request.type
        travel.destination = request.destination
        travel.origin = request.origin
        travel.durationDays = request.durationDays
        travel.durationNights = request.durationNights
        travel.stars = request.stars
        travel.description = request.description
        travel.featured = request.featured
        travel.status = request.status
        travel.packages.clear()
        travel.highlights.clear()
        travel.includes.clear()
        travel.images.clear()
        applyChildren(travel, request)
        return travelRepository.save(travel).toResponse(reviewRepository.averageRating(id))
    }

    @Transactional
    fun changeStatus(id: Int, status: TravelStatus): TravelResponse {
        val travel = findEntity(id)
        travel.status = status
        return travelRepository.save(travel).toResponse(reviewRepository.averageRating(id))
    }

    fun findEntity(id: Int): Travel =
        travelRepository.findById(id).orElseThrow { NotFoundException("Travel not found") }

    fun findPackage(packageId: Int): TravelPackage =
        packageRepository.findById(packageId).orElseThrow { NotFoundException("Travel package not found") }

    private fun applyChildren(travel: Travel, request: TravelRequest) {
        val createdPackages = request.packages.map {
            TravelPackage(
                travel = travel,
                name = it.name,
                personsIncluded = it.personsIncluded,
                hotelStars = it.hotelStars,
                pricePerPerson = it.pricePerPerson,
                currency = it.currency,
                capacity = it.capacity,
                availableSpots = it.availableSpots,
                active = it.active
            )
        }
        travel.packages.addAll(createdPackages)
        travel.highlights.addAll(request.highlights.map { TravelHighlight(travel = travel, icon = it.icon, label = it.label, sort = it.sort) })
        travel.images.addAll(request.images.map { TravelImage(travel = travel, url = it.url, altText = it.altText, sort = it.sort) })
        travel.includes.addAll(request.includes.map { TravelInclude(travel = travel, icon = it.icon, label = it.label, description = it.description, sort = it.sort) })
    }
}


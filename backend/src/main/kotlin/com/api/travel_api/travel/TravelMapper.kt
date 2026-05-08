package com.api.travel_api.travel

import com.api.travel_api.api.*
import com.api.travel_api.model.entities.*
import java.math.BigDecimal

fun Travel.toResponse(rating: Double? = null): TravelResponse {
    val sortedImages = images.sortedBy { it.sort }
    return TravelResponse(
        id = id!!,
        name = name,
        slug = slug,
        type = type,
        destination = destination,
        origin = origin,
        durationDays = durationDays,
        durationNights = durationNights,
        stars = stars,
        description = description,
        featured = featured,
        status = status,
        minPrice = packages.filter { it.active }.minOfOrNull { it.pricePerPerson },
        rating = rating,
        coverImage = sortedImages.firstOrNull()?.toResponse(),
        packages = packages.sortedBy { it.id ?: 0 }.map { it.toResponse() },
        highlights = highlights.sortedBy { it.sort }.map { it.toResponse() },
        includes = includes.sortedBy { it.sort }.map { it.toResponse() },
        images = sortedImages.map { it.toResponse() }
    )
}

fun TravelPackage.toResponse() = TravelPackageResponse(
    id = id!!,
    name = name,
    personsIncluded = personsIncluded,
    hotelStars = hotelStars,
    pricePerPerson = pricePerPerson,
    currency = currency,
    capacity = capacity,
    availableSpots = availableSpots,
    active = active
)

fun TravelHighlight.toResponse() = TravelHighlightResponse(id = id!!, icon = icon, label = label, sort = sort)

fun TravelInclude.toResponse() = TravelIncludeResponse(
    id = id!!,
    packageId = travelPackage?.id,
    icon = icon,
    label = label,
    description = description,
    sort = sort
)

fun TravelImage.toResponse() = TravelImageResponse(id = id!!, url = url, altText = altText, sort = sort)

fun Travel.minCurrency() = packages.filter { it.active }.minByOrNull { it.pricePerPerson }?.currency


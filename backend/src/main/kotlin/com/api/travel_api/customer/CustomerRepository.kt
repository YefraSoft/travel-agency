package com.api.travel_api.customer

import com.api.travel_api.model.entities.Customer
import org.springframework.data.jpa.repository.JpaRepository

interface CustomerRepository: JpaRepository<Customer, Long> {
    fun findByPhone(phone: String): Customer?
    fun findByEmail(email: String): Customer?
}
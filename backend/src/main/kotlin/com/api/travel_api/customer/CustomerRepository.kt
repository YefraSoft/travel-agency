package com.api.travel_api.customer

import com.api.travel_api.model.entities.Customer
import org.springframework.data.jpa.repository.JpaRepository

interface CustomerRepository: JpaRepository<Customer, Int> {
    fun findByPhone(phone: String): Customer?
    fun findByEmail(email: String): Customer?
    fun existsByPhone(phone: String): Boolean
    fun existsByEmail(email: String): Boolean
}

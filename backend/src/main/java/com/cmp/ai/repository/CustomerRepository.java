package com.cmp.ai.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.cmp.ai.entity.Customer;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
}

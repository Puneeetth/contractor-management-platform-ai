package com.cmp.ai.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.cmp.ai.entity.Country;

public interface CountryRepository extends JpaRepository<Country, String> {
    
}

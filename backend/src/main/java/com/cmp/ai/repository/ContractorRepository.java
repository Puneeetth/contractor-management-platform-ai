package com.cmp.ai.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.cmp.ai.entity.Contractor;

public interface ContractorRepository extends JpaRepository<Contractor, Long> {
    
    Optional<Contractor> findByEmail(String email);
    
    Optional<Contractor> findByUserId(Long userId);
}

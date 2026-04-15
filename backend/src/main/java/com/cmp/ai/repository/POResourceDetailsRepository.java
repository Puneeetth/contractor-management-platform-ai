package com.cmp.ai.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.cmp.ai.entity.POResourceDetails;

public interface POResourceDetailsRepository extends JpaRepository<POResourceDetails, Long> {
    
    Optional<POResourceDetails> findByPurchaseOrderId(Long purchaseOrderId);
}

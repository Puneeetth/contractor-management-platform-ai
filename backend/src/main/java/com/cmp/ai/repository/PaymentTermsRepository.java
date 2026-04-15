package com.cmp.ai.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.cmp.ai.entity.PaymentTerms;

public interface PaymentTermsRepository extends JpaRepository<PaymentTerms, Long> {
    
    List<PaymentTerms> findByCustomerId(Long customerId);
}

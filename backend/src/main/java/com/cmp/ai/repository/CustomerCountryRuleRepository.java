package com.cmp.ai.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.cmp.ai.entity.CustomerCountryRule;

public interface CustomerCountryRuleRepository extends JpaRepository<CustomerCountryRule, Long> {
    
    List<CustomerCountryRule> findByCustomerId(Long customerId);
    
    List<CustomerCountryRule> findByCustomerIdAndAllowed(Long customerId, boolean allowed);
}

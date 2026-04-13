package com.cmp.ai.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cmp.ai.entity.Contract;

public interface ContractRepository extends JpaRepository<Contract, Long> {
    List<Contract> findByContractorId(Long id);

    
    
}

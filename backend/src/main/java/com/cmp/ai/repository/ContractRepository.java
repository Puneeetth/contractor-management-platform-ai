package com.cmp.ai.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cmp.ai.entity.Contract;
import com.cmp.ai.enums.ContractStatus;

public interface ContractRepository extends JpaRepository<Contract, Long> {
    List<Contract> findByContractorId(Long id);
    List<Contract> findByContractorIdAndStatus(Long contractorId, ContractStatus status);
    List<Contract> findByPoAllocationAndStatus(String poAllocation, ContractStatus status);
}
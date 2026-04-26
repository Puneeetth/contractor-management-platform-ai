package com.cmp.ai.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.cmp.ai.entity.Contract;
import com.cmp.ai.enums.ContractStatus;

public interface ContractRepository extends JpaRepository<Contract, Long> {
    List<Contract> findByContractorId(Long id);
    List<Contract> findByContractorIdAndStatus(Long contractorId, ContractStatus status);
    List<Contract> findByPoAllocationAndStatus(String poAllocation, ContractStatus status);

    @Query("""
        select c from Contract c
        join fetch c.contractor contractor
        left join fetch c.customer customer
        where c.startDate <= :monthEnd
          and c.endDate >= :monthStart
          and (:customerId is null or customer.id = :customerId)
          and (:status is null or c.status = :status)
        order by contractor.id asc, c.startDate asc
    """)
    List<Contract> findContractsForExport(
        @Param("monthStart") LocalDate monthStart,
        @Param("monthEnd") LocalDate monthEnd,
        @Param("customerId") Long customerId,
        @Param("status") ContractStatus status
    );
}

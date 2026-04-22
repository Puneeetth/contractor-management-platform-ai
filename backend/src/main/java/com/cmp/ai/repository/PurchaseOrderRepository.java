package com.cmp.ai.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cmp.ai.entity.PurchaseOrder;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder,Long>{
 List<PurchaseOrder> findByContractId(Long contractId);
 Optional<PurchaseOrder> findByPoNumber(String poNumber);

}

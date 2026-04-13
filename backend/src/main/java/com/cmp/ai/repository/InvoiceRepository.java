package com.cmp.ai.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cmp.ai.entity.Invoice;

public interface InvoiceRepository extends JpaRepository<Invoice,Long>{
    Optional<Invoice> findByTimeSheetId(Long timesheetId);
    Optional<Invoice> findByContractorIdAndInvoiceMonth(Long contractorId,String invoiceMonth);
}
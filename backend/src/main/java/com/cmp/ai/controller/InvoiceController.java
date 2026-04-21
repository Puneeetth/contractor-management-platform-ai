package com.cmp.ai.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.cmp.ai.dto.request.InvoiceRequest;
import com.cmp.ai.dto.response.InvoiceResponse;
import com.cmp.ai.service.InvoiceService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @PostMapping
    @PreAuthorize("hasRole('CONTRACTOR')")
    public InvoiceResponse createInvoice(
            @RequestParam Long contractorId,
            @RequestParam String invoiceMonth,
            @RequestParam Double amount,
            @RequestParam(value = "invoiceFile", required = false) MultipartFile invoiceFile,
            @RequestParam(value = "timesheetFile", required = false) MultipartFile timesheetFile) {
        InvoiceRequest request = new InvoiceRequest(contractorId, invoiceMonth, amount);
        return invoiceService.createInvoice(request, invoiceFile, timesheetFile);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','FINANCE','MANAGER')")
    public List<InvoiceResponse> getAllInvoices() {
        return invoiceService.getAllInvoices();
    }

    @GetMapping("/contractor/{contractorId}")
    @PreAuthorize("hasAnyRole('ADMIN','FINANCE','MANAGER','CONTRACTOR')")
    public List<InvoiceResponse> getInvoicesByContractor(@PathVariable Long contractorId) {
        return invoiceService.getInvoicesByContractor(contractorId);
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('FINANCE','ADMIN')")
    public InvoiceResponse approveInvoice(@PathVariable Long id) {
        return invoiceService.approveInvoice(id);
    }
}

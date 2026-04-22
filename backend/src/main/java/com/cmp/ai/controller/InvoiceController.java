package com.cmp.ai.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
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

    // ✅ Create Invoice (Enhanced Logic)
    @PostMapping
    @PreAuthorize("hasRole('CONTRACTOR')")
    public InvoiceResponse createInvoice(
            @RequestParam Long contractorId,
            @RequestParam String invoiceMonth,
            @RequestParam Double totalHours,
            @RequestParam Double taxPercentage,
            @RequestParam(value = "invoiceFile", required = false) MultipartFile invoiceFile,
            @RequestParam(value = "timesheetFile", required = false) MultipartFile timesheetFile) {

        InvoiceRequest request = new InvoiceRequest(
                contractorId,
                invoiceMonth,
                totalHours,
                taxPercentage
        );

        return invoiceService.createInvoice(request, invoiceFile, timesheetFile);
    }

    // ✅ Get contractor rate from active contract
    @GetMapping("/contractor/{contractorId}/rate")
    @PreAuthorize("hasAnyRole('ADMIN','FINANCE','MANAGER','CONTRACTOR')")
    public Double getContractorRate(@PathVariable Long contractorId) {
        return invoiceService.getActiveContractRate(contractorId);
    }

    // ✅ Get all invoices (Admin / Finance / Manager)
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','FINANCE','MANAGER')")
    public List<InvoiceResponse> getAllInvoices() {
        return invoiceService.getAllInvoices();
    }

    // ✅ Get invoices by contractor
    @GetMapping("/contractor/{contractorId}")
    @PreAuthorize("hasAnyRole('ADMIN','FINANCE','MANAGER','CONTRACTOR')")
    public List<InvoiceResponse> getInvoicesByContractor(@PathVariable Long contractorId) {
        return invoiceService.getInvoicesByContractor(contractorId);
    }

    // ✅ Approve invoice (legacy route keeps finance approval behavior)
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('FINANCE','ADMIN')")
    public InvoiceResponse approveInvoice(@PathVariable Long id) {
        return invoiceService.approveInvoice(id);
    }

    @PutMapping("/{id}/approve/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public InvoiceResponse approveInvoiceByAdmin(@PathVariable Long id) {
        return invoiceService.approveInvoiceByAdmin(id);
    }

    @PutMapping("/{id}/approve/finance")
    @PreAuthorize("hasRole('FINANCE')")
    public InvoiceResponse approveInvoiceByFinance(@PathVariable Long id) {
        return invoiceService.approveInvoiceByFinance(id);
    }

    @PutMapping("/{id}/reject/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public InvoiceResponse rejectInvoiceByAdmin(
            @PathVariable Long id,
            @RequestBody RejectInvoiceRequest request) {
        return invoiceService.rejectInvoiceByAdmin(id, request.rejectionReason());
    }

    @PutMapping("/{id}/reject/finance")
    @PreAuthorize("hasRole('FINANCE')")
    public InvoiceResponse rejectInvoiceByFinance(
            @PathVariable Long id,
            @RequestBody RejectInvoiceRequest request) {
        return invoiceService.rejectInvoiceByFinance(id, request.rejectionReason());
    }

    private record RejectInvoiceRequest(String rejectionReason) {}
}

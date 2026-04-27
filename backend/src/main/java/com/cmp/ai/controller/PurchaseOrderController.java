package com.cmp.ai.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.cmp.ai.dto.request.PORequest;
import com.cmp.ai.dto.response.POResponse;
import com.cmp.ai.service.PurchaseOrderService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/purchase-orders")
@RequiredArgsConstructor
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public POResponse createPurchaseOrder(
            @ModelAttribute @Valid @RequestBody PORequest request, 
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "sowFile", required = false) MultipartFile sowFile) {
        return purchaseOrderService.createPurchaseOrder(request, file, sowFile);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<POResponse> getAllPurchaseOrders() {
        return purchaseOrderService.getAllPurchaseOrders();
    }

    @GetMapping("/contract/{contractId}")
    @PreAuthorize("hasRole('ADMIN')")
    public List<POResponse> getPurchaseOrdersByContractId(@PathVariable Long contractId) {
        return purchaseOrderService.getPurchaseOrdersByContractId(contractId);
    }

}

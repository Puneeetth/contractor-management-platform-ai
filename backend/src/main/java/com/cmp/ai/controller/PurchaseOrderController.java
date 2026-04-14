package com.cmp.ai.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cmp.ai.dto.request.PORequest;
import com.cmp.ai.dto.response.POResponse;
import com.cmp.ai.service.PurchaseOrderService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/purchase-orders")
@RequiredArgsConstructor
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public POResponse createPurchaseOrder(@Valid @RequestBody PORequest request) {
        return purchaseOrderService.createPurchaseOrder(request);
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

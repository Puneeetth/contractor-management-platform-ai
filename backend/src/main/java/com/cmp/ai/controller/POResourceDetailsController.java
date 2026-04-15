package com.cmp.ai.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cmp.ai.dto.request.POResourceDetailsRequest;
import com.cmp.ai.dto.response.POResourceDetailsResponse;
import com.cmp.ai.service.POResourceDetailsService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/po-resource-details")
@RequiredArgsConstructor
public class POResourceDetailsController {

    private final POResourceDetailsService poResourceDetailsService;

    @PostMapping
    public ResponseEntity<POResourceDetailsResponse> createPOResourceDetails(@Valid @RequestBody POResourceDetailsRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(poResourceDetailsService.createPOResourceDetails(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<POResourceDetailsResponse> getPOResourceDetailsById(@PathVariable Long id) {
        return ResponseEntity.ok(poResourceDetailsService.getPOResourceDetailsById(id));
    }

    @GetMapping("/po/{purchaseOrderId}")
    public ResponseEntity<POResourceDetailsResponse> getPOResourceDetailsByPurchaseOrderId(@PathVariable Long purchaseOrderId) {
        return ResponseEntity.ok(poResourceDetailsService.getPOResourceDetailsByPurchaseOrderId(purchaseOrderId));
    }

    @GetMapping
    public ResponseEntity<List<POResourceDetailsResponse>> getAllPOResourceDetails() {
        return ResponseEntity.ok(poResourceDetailsService.getAllPOResourceDetails());
    }

    @PutMapping("/{id}")
    public ResponseEntity<POResourceDetailsResponse> updatePOResourceDetails(@PathVariable Long id, @Valid @RequestBody POResourceDetailsRequest request) {
        return ResponseEntity.ok(poResourceDetailsService.updatePOResourceDetails(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePOResourceDetails(@PathVariable Long id) {
        poResourceDetailsService.deletePOResourceDetails(id);
        return ResponseEntity.noContent().build();
    }
}

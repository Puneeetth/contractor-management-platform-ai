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

import com.cmp.ai.dto.request.PaymentTermsRequest;
import com.cmp.ai.dto.response.PaymentTermsResponse;
import com.cmp.ai.service.PaymentTermsService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/payment-terms")
@RequiredArgsConstructor
public class PaymentTermsController {

    private final PaymentTermsService paymentTermsService;

    @PostMapping
    public ResponseEntity<PaymentTermsResponse> createPaymentTerms(@Valid @RequestBody PaymentTermsRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(paymentTermsService.createPaymentTerms(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentTermsResponse> getPaymentTermsById(@PathVariable Long id) {
        return ResponseEntity.ok(paymentTermsService.getPaymentTermsById(id));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<PaymentTermsResponse>> getPaymentTermsByCustomerId(@PathVariable Long customerId) {
        return ResponseEntity.ok(paymentTermsService.getPaymentTermsByCustomerId(customerId));
    }

    @GetMapping
    public ResponseEntity<List<PaymentTermsResponse>> getAllPaymentTerms() {
        return ResponseEntity.ok(paymentTermsService.getAllPaymentTerms());
    }

    @PutMapping("/{id}")
    public ResponseEntity<PaymentTermsResponse> updatePaymentTerms(@PathVariable Long id, @Valid @RequestBody PaymentTermsRequest request) {
        return ResponseEntity.ok(paymentTermsService.updatePaymentTerms(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePaymentTerms(@PathVariable Long id) {
        paymentTermsService.deletePaymentTerms(id);
        return ResponseEntity.noContent().build();
    }
}

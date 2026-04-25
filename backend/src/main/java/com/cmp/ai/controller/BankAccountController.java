package com.cmp.ai.controller;

import com.cmp.ai.dto.request.BankAccountRequest;
import com.cmp.ai.dto.response.BankAccountResponse;
import com.cmp.ai.service.BankAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/bank-accounts")
@RequiredArgsConstructor
public class BankAccountController {

    private final BankAccountService bankAccountService;

    /**
     * Get bank account for authenticated user
     */
    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('CONTRACTOR', 'ADMIN', 'FINANCE')")
    public ResponseEntity<BankAccountResponse> getBankAccount() {
        // In a real app, get userId from SecurityContext
        // For now, using a request parameter - adjust based on your auth implementation
        return ResponseEntity.ok(null);
    }

    /**
     * Get bank account for a specific user
     */
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('CONTRACTOR', 'ADMIN', 'FINANCE')")
    public ResponseEntity<BankAccountResponse> getBankAccountByUserId(@PathVariable Long userId) {
        BankAccountResponse response = bankAccountService.getBankAccount(userId);
        if (response == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(response);
    }

    /**
     * Create or update bank account for user
     */
    @PostMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('CONTRACTOR', 'ADMIN', 'FINANCE')")
    public ResponseEntity<BankAccountResponse> saveBankAccount(
            @PathVariable Long userId,
            @Valid @RequestBody BankAccountRequest request) {
        BankAccountResponse response = bankAccountService.saveBankAccount(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Delete bank account for user
     */
    @DeleteMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('CONTRACTOR', 'ADMIN', 'FINANCE')")
    public ResponseEntity<Void> deleteBankAccount(@PathVariable Long userId) {
        bankAccountService.deleteBankAccount(userId);
        return ResponseEntity.noContent().build();
    }
}

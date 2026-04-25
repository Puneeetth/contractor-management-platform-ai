package com.cmp.ai.service;

import com.cmp.ai.dto.request.BankAccountRequest;
import com.cmp.ai.dto.response.BankAccountResponse;
import com.cmp.ai.entity.BankAccount;
import com.cmp.ai.entity.User;
import com.cmp.ai.exception.BadRequestException;
import com.cmp.ai.exception.ResourceNotFoundException;
import com.cmp.ai.repository.BankAccountRepository;
import com.cmp.ai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BankAccountService {

    private final BankAccountRepository bankAccountRepository;
    private final UserRepository userRepository;

    /**
     * Get bank account for a user
     */
    public BankAccountResponse getBankAccount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Optional<BankAccount> bankAccount = bankAccountRepository.findByUserId(userId);
        
        if (bankAccount.isEmpty()) {
            return null;
        }

        return convertToResponse(bankAccount.get());
    }

    /**
     * Create or update bank account
     */
    @Transactional
    public BankAccountResponse saveBankAccount(Long userId, BankAccountRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        BankAccount bankAccount = bankAccountRepository.findByUserId(userId)
                .orElse(new BankAccount());

        bankAccount.setUser(user);
        bankAccount.setAccountHolderName(request.getAccountHolderName());
        bankAccount.setBankName(request.getBankName());
        bankAccount.setAccountNumber(request.getAccountNumber());
        bankAccount.setIfscCode(request.getIfscCode());
        bankAccount.setBranch(request.getBranch());

        BankAccount saved = bankAccountRepository.save(bankAccount);
        return convertToResponse(saved);
    }

    /**
     * Delete bank account
     */
    @Transactional
    public void deleteBankAccount(Long userId) {
        BankAccount bankAccount = bankAccountRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Bank account not found"));
        
        bankAccountRepository.delete(bankAccount);
    }

    /**
     * Convert entity to response with masked account number
     */
    private BankAccountResponse convertToResponse(BankAccount bankAccount) {
        String maskedAccountNumber = maskAccountNumber(bankAccount.getAccountNumber());
        
        return BankAccountResponse.builder()
                .id(bankAccount.getId())
                .accountHolderName(bankAccount.getAccountHolderName())
                .bankName(bankAccount.getBankName())
                .accountNumber(bankAccount.getAccountNumber())
                .maskedAccountNumber(maskedAccountNumber)
                .ifscCode(bankAccount.getIfscCode())
                .branch(bankAccount.getBranch())
                .createdAt(bankAccount.getCreatedAt())
                .updatedAt(bankAccount.getUpdatedAt())
                .build();
    }

    /**
     * Mask account number - show only last 4 digits
     */
    private String maskAccountNumber(String accountNumber) {
        if (accountNumber == null || accountNumber.length() <= 4) {
            return "****";
        }
        String lastFour = accountNumber.substring(accountNumber.length() - 4);
        return "****" + lastFour;
    }
}

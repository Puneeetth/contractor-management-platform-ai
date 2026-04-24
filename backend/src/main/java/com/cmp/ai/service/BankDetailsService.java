package com.cmp.ai.service;

import com.cmp.ai.dto.request.BankDetailsRequest;
import com.cmp.ai.dto.response.BankDetailsResponse;
import com.cmp.ai.entity.BankDetails;
import com.cmp.ai.entity.User;
import com.cmp.ai.exception.ResourceNotFoundException;
import com.cmp.ai.repository.BankDetailsRepository;
import com.cmp.ai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BankDetailsService {

    private final BankDetailsRepository bankDetailsRepository;
    private final UserRepository userRepository;

    public BankDetailsResponse getByUserId(Long userId) {
        return bankDetailsRepository.findByUserId(userId)
                .map(this::toResponse)
                .orElse(BankDetailsResponse.builder()
                        .userId(userId)
                        .accountHolderName("")
                        .bankName("")
                        .accountNumber("")
                        .ifscSwift("")
                        .upiId("")
                        .build());
    }

    public BankDetailsResponse save(Long userId, BankDetailsRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        BankDetails bankDetails = bankDetailsRepository.findByUserId(userId)
                .orElse(BankDetails.builder().user(user).build());

        bankDetails.setAccountHolderName(request.getAccountHolderName());
        bankDetails.setBankName(request.getBankName());
        bankDetails.setAccountNumber(request.getAccountNumber());
        bankDetails.setIfscSwift(request.getIfscSwift());
        bankDetails.setUpiId(request.getUpiId());

        return toResponse(bankDetailsRepository.save(bankDetails));
    }

    private BankDetailsResponse toResponse(BankDetails b) {
        return BankDetailsResponse.builder()
                .id(b.getId())
                .userId(b.getUser().getId())
                .accountHolderName(b.getAccountHolderName())
                .bankName(b.getBankName())
                .accountNumber(b.getAccountNumber())
                .ifscSwift(b.getIfscSwift())
                .upiId(b.getUpiId())
                .build();
    }
}

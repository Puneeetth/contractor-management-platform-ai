package com.cmp.ai.controller;

import com.cmp.ai.dto.request.BankDetailsRequest;
import com.cmp.ai.dto.response.BankDetailsResponse;
import com.cmp.ai.entity.User;
import com.cmp.ai.repository.UserRepository;
import com.cmp.ai.service.BankDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bank-details")
@RequiredArgsConstructor
public class BankDetailsController {

    private final BankDetailsService bankDetailsService;
    private final UserRepository userRepository;

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public BankDetailsResponse getMyBankDetails() {
        return bankDetailsService.getByUserId(getCurrentUserId());
    }

    @PostMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public BankDetailsResponse saveMyBankDetails(@RequestBody BankDetailsRequest request) {
        return bankDetailsService.save(getCurrentUserId(), request);
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'MANAGER')")
    public BankDetailsResponse getBankDetailsByUserId(@PathVariable Long userId) {
        return bankDetailsService.getByUserId(userId);
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }
}

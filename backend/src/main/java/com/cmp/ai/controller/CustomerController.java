package com.cmp.ai.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.cmp.ai.dto.request.CustomerRequest;
import com.cmp.ai.dto.response.CustomerResponse;
import com.cmp.ai.service.CustomerService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public CustomerResponse createCustomer(
            @Valid @ModelAttribute CustomerRequest request,
            @RequestParam(value = "msaFile", required = false) MultipartFile msaFile) {
        return customerService.createCustomer(request, msaFile);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public CustomerResponse updateCustomer(
            @PathVariable Long id,
            @Valid @ModelAttribute CustomerRequest request,
            @RequestParam(value = "msaFile", required = false) MultipartFile msaFile) {
        return customerService.updateCustomer(id, request, msaFile);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<CustomerResponse> getAllCustomers() {
        return customerService.getAllCustomers();
    }
}

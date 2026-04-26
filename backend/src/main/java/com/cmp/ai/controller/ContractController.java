package com.cmp.ai.controller;

import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cmp.ai.dto.request.ContractRequest;
import com.cmp.ai.dto.response.ContractResponse;
import com.cmp.ai.service.ContractService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/contracts")
@RequiredArgsConstructor
public class ContractController {

    private final ContractService contractService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ContractResponse createContract(@Valid @RequestBody ContractRequest request) {
        return contractService.createContract(request);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public List<ContractResponse> getAllContracts() {
        return contractService.getAllContracts();
    }

    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<byte[]> exportContracts(
            @RequestParam String month,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long contractorId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "false") boolean includeFinancialDetails) {
        byte[] fileBytes = contractService.exportContracts(month, customerId, contractorId, status, includeFinancialDetails);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=contracts-export-" + month + ".xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(fileBytes);
    }

    @GetMapping("/contractor/{contractorId}/active")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'CONTRACTOR')")
    public List<ContractResponse> getActiveContractsByContractor(@PathVariable Long contractorId) {
        return contractService.getActiveContractsByContractor(contractorId);
    }
}

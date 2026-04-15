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

import com.cmp.ai.dto.request.ContractorRequest;
import com.cmp.ai.dto.response.ContractorResponse;
import com.cmp.ai.service.ContractorService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/contractors")
@RequiredArgsConstructor
public class ContractorController {

    private final ContractorService contractorService;

    @PostMapping
    public ResponseEntity<ContractorResponse> createContractor(@Valid @RequestBody ContractorRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(contractorService.createContractor(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContractorResponse> getContractorById(@PathVariable Long id) {
        return ResponseEntity.ok(contractorService.getContractorById(id));
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<ContractorResponse> getContractorByEmail(@PathVariable String email) {
        return ResponseEntity.ok(contractorService.getContractorByEmail(email));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ContractorResponse> getContractorByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(contractorService.getContractorByUserId(userId));
    }

    @GetMapping
    public ResponseEntity<List<ContractorResponse>> getAllContractors() {
        return ResponseEntity.ok(contractorService.getAllContractors());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ContractorResponse> updateContractor(@PathVariable Long id, @Valid @RequestBody ContractorRequest request) {
        return ResponseEntity.ok(contractorService.updateContractor(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteContractor(@PathVariable Long id) {
        contractorService.deleteContractor(id);
        return ResponseEntity.noContent().build();
    }
}

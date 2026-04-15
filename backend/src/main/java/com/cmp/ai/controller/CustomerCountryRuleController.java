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

import com.cmp.ai.dto.request.CustomerCountryRuleRequest;
import com.cmp.ai.dto.response.CustomerCountryRuleResponse;
import com.cmp.ai.service.CustomerCountryRuleService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/customer-country-rules")
@RequiredArgsConstructor
public class CustomerCountryRuleController {

    private final CustomerCountryRuleService ruleService;

    @PostMapping
    public ResponseEntity<CustomerCountryRuleResponse> createRule(@Valid @RequestBody CustomerCountryRuleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ruleService.createRule(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomerCountryRuleResponse> getRuleById(@PathVariable Long id) {
        return ResponseEntity.ok(ruleService.getRuleById(id));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<CustomerCountryRuleResponse>> getRulesByCustomerId(@PathVariable Long customerId) {
        return ResponseEntity.ok(ruleService.getRulesByCustomerId(customerId));
    }

    @GetMapping("/customer/{customerId}/allowed")
    public ResponseEntity<List<CustomerCountryRuleResponse>> getAllowedCountriesByCustomerId(@PathVariable Long customerId) {
        return ResponseEntity.ok(ruleService.getAllowedCountriesByCustomerId(customerId));
    }

    @GetMapping
    public ResponseEntity<List<CustomerCountryRuleResponse>> getAllRules() {
        return ResponseEntity.ok(ruleService.getAllRules());
    }

    @PutMapping("/{id}")
    public ResponseEntity<CustomerCountryRuleResponse> updateRule(@PathVariable Long id, @Valid @RequestBody CustomerCountryRuleRequest request) {
        return ResponseEntity.ok(ruleService.updateRule(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRule(@PathVariable Long id) {
        ruleService.deleteRule(id);
        return ResponseEntity.noContent().build();
    }
}

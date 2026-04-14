package com.cmp.ai.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cmp.ai.dto.request.ExpenseRequest;
import com.cmp.ai.dto.response.ExpenseResponse;
import com.cmp.ai.service.ExpenseService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    @PostMapping
    @PreAuthorize("hasRole('CONTRACTOR')")
    public ExpenseResponse submitExpense(@RequestParam Long contractorId, @Valid @RequestBody ExpenseRequest request) {
        return expenseService.createExpense(contractorId, request);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','FINANCE')")
    public List<ExpenseResponse> getAllExpenses() {
        return expenseService.getAllExpenses();
    }

    @GetMapping("/contractor/{contractorId}")
    @PreAuthorize("hasAnyRole('ADMIN','FINANCE','CONTRACTOR')")
    public List<ExpenseResponse> getExpensesByContractor(@PathVariable Long contractorId) {
        return expenseService.getExpensesByContractor(contractorId);
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('FINANCE','ADMIN')")
    public ExpenseResponse approveExpense(@PathVariable Long id) {
        return expenseService.approveExpense(id);
    }
}

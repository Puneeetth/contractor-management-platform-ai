package com.cmp.ai.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import com.cmp.ai.dto.request.ExpenseRequest;
import com.cmp.ai.dto.response.ExpenseResponse;
import com.cmp.ai.entity.Expense;
import com.cmp.ai.entity.User;
import com.cmp.ai.enums.Status;
import com.cmp.ai.exception.BadRequestException;
import com.cmp.ai.exception.ResourceNotFoundException;
import com.cmp.ai.repository.ExpenseRepositoy;
import com.cmp.ai.repository.UserRepository;
import com.cmp.ai.transformer.ExpenseTransformer;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepositoy expenseRepositoy;
    private final UserRepository userRepository;
    private final AuditTrailService auditTrailService;

    public ExpenseResponse createExpense(@NonNull Long contractorId, ExpenseRequest request) {
        User contractor = userRepository.findById(contractorId)
                .orElseThrow(() -> new ResourceNotFoundException("Contractor not found"));

        if (request.getAmount() == null || request.getAmount() <= 0) {
            throw new BadRequestException("Expense amount must be greater than zero");
        }

        Expense expense = ExpenseTransformer.expenseRequestToExpense(request, contractor);
        Expense savedExpense = expenseRepositoy.save(expense);
        auditTrailService.logSystemAction("EXPENSE", savedExpense.getId(), "CREATE_EXPENSE", "Submitted expense", savedExpense.getDescription());
        auditTrailService.logWorkflowAction("EXPENSE", savedExpense.getId(), "EXPENSE_APPROVAL", "SUBMITTED", savedExpense.getStatus().name(), null);
        return ExpenseTransformer.expenseToExpenseResponse(savedExpense);
    }

    public List<ExpenseResponse> getAllExpenses() {
        return expenseRepositoy.findAll().stream()
                .map(ExpenseTransformer::expenseToExpenseResponse)
                .toList();
    }

    public List<ExpenseResponse> getExpensesByContractor(@NonNull Long contractorId) {
        return expenseRepositoy.findByContractorId(contractorId).stream()
                .map(ExpenseTransformer::expenseToExpenseResponse)
                .toList();
    }

    public ExpenseResponse approveExpense(@NonNull Long expenseId) {
        Expense expense = expenseRepositoy.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found"));

        expense.setStatus(Status.APPROVED);
        Expense savedExpense = expenseRepositoy.save(expense);
        auditTrailService.logSystemAction("EXPENSE", savedExpense.getId(), "APPROVE_EXPENSE", "Approved expense", null);
        auditTrailService.logWorkflowAction("EXPENSE", savedExpense.getId(), "EXPENSE_APPROVAL", "APPROVED", savedExpense.getStatus().name(), null);
        return ExpenseTransformer.expenseToExpenseResponse(savedExpense);
    }
}

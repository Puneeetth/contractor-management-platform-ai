package com.cmp.ai.transformer;

import com.cmp.ai.dto.request.ExpenseRequest;
import com.cmp.ai.dto.response.ExpenseResponse;
import com.cmp.ai.entity.Expense;
import com.cmp.ai.entity.User;
import com.cmp.ai.enums.Status;

public class ExpenseTransformer {

    public static ExpenseResponse expenseToExpenseResponse(Expense e) {
        return ExpenseResponse.builder()
                .id(e.getId())
                .amount(e.getAmount())
                .description(e.getDescription())
                .proofUrl(e.getProofUrl())
                .status(e.getStatus().name())
                .build();
    }

    public static Expense expenseRequestToExpense(ExpenseRequest req, User contractor) {
        return Expense.builder()
                .contractor(contractor)
                .amount(req.getAmount())
                .description(req.getDescription())
                .proofUrl(req.getProofUrl())
                .status(Status.PENDING)
                .build();
    }
}
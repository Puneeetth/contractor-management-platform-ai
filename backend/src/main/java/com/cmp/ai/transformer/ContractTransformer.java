package com.cmp.ai.transformer;

import java.time.LocalDate;

import com.cmp.ai.dto.request.ContractRequest;
import com.cmp.ai.dto.response.ContractResponse;
import com.cmp.ai.entity.Contract;
import com.cmp.ai.entity.Customer;
import com.cmp.ai.entity.Contractor;
import com.cmp.ai.enums.ContractStatus;

public class ContractTransformer {

    public static ContractResponse contractToContractResponse(Contract c) {
        return ContractResponse.builder()
                .id(c.getId())
                .contractorId(c.getContractor() != null ? c.getContractor().getId() : null)
                .customerId(c.getCustomer() == null ? null : c.getCustomer().getId())
                .billRate(c.getBillRate())
                .payRate(c.getPayRate())
                .poAllocation(c.getPoAllocation())
                .estimatedHours(c.getEstimatedHours())
                .estimatedBudget(c.getEstimatedBudget())
                .startDate(c.getStartDate() == null ? null : c.getStartDate().toString())
                .endDate(c.getEndDate() == null ? null : c.getEndDate().toString())
                .noticePeriodDays(c.getNoticePeriodDays())
                .throughEor(c.getThroughEor())
                .remarks(c.getRemarks())
                .status(c.getStatus().name())
                .build();
    }

    public static Contract contractRequestToContract(ContractRequest req, Contractor contractor, Customer customer) {
        return Contract.builder()
                .contractor(contractor)
                .customer(customer)
                .billRate(req.getBillRate())
                .payRate(req.getPayRate())
                .poAllocation(req.getPoAllocation())
                .estimatedHours(req.getEstimatedHours())
                .estimatedBudget(req.getEstimatedBudget())
                .startDate(parseDate(req.getStartDate()))
                .endDate(parseDate(req.getEndDate()))
                .noticePeriodDays(req.getNoticePeriodDays())
                .throughEor(req.getThroughEor())
                .remarks(req.getRemarks())
                .status(ContractStatus.ACTIVE)
                .build();
    }

    private static LocalDate parseDate(String date) {
        return date == null || date.isBlank() ? null : LocalDate.parse(date);
    }
}
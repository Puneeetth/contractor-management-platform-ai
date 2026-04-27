package com.cmp.ai.controller;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cmp.ai.dto.response.ContractResponse;
import com.cmp.ai.dto.response.InvoiceResponse;
import com.cmp.ai.dto.response.TimesheetResponse;
import com.cmp.ai.entity.User;
import com.cmp.ai.enums.ContractStatus;
import com.cmp.ai.enums.Status;
import com.cmp.ai.repository.ContractRepository;
import com.cmp.ai.repository.InvoiceRepository;
import com.cmp.ai.repository.TimesheetRepository;
import com.cmp.ai.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final ContractRepository contractRepository;
    private final InvoiceRepository invoiceRepository;
    private final TimesheetRepository timesheetRepository;
    private final UserRepository userRepository;

    @GetMapping("/stats")
    public Map<String, Object> getContractorStats() {
        Long contractorId = getCurrentContractorId();

        // Get active contracts
        List<ContractResponse> activeContracts = contractRepository.findByContractorId(contractorId)
                .stream()
                .filter(c -> c.getStatus() == ContractStatus.ACTIVE)
                .map(c -> {
                    ContractResponse resp = new ContractResponse();
                    resp.setId(c.getId());
                    resp.setContractorId(c.getContractor() != null ? c.getContractor().getId() : null);
                    resp.setContractorName(c.getContractor() != null ? c.getContractor().getName() : null);
                    resp.setCustomerId(c.getCustomer() != null ? c.getCustomer().getId() : null);
                    resp.setCustomerName(c.getCustomer() != null ? c.getCustomer().getName() : null);
                    resp.setBillRate(c.getBillRate());
                    resp.setPayRate(c.getPayRate());
                    resp.setPoAllocation(c.getPoAllocation());
                    resp.setEstimatedHours(c.getEstimatedHours());
                    resp.setEstimatedBudget(c.getEstimatedBudget());
                    resp.setStartDate(c.getStartDate() != null ? c.getStartDate().toString() : null);
                    resp.setEndDate(c.getEndDate() != null ? c.getEndDate().toString() : null);
                    resp.setNoticePeriodDays(c.getNoticePeriodDays());
                    resp.setThroughEor(c.getThroughEor());
                    resp.setRemarks(c.getRemarks());
                    resp.setTerminationRemarks(c.getTerminationRemarks());
                    resp.setStatus(c.getStatus() != null ? c.getStatus().name() : null);
                    return resp;
                })
                .toList();

        double totalContractValue = activeContracts.stream()
                .mapToDouble(c -> c.getEstimatedBudget() != null ? c.getEstimatedBudget() : 0)
                .sum();

        // Get invoices
        List<InvoiceResponse> invoices = invoiceRepository.findAll().stream()
                .filter(i -> i.getContractor() != null && i.getContractor().getId().equals(contractorId))
                .map(i -> {
                    Double billRate = i.getContract() != null ? i.getContract().getBillRate() : null;
                    Double payRate = i.getContract() != null ? i.getContract().getPayRate() : null;
                    return com.cmp.ai.transformer.InvoiceTransformer.invoiceToInvoiceResponse(i, billRate, payRate);
                })
                .toList();

        // Monthly earnings (approved invoices this month)
        YearMonth currentMonth = YearMonth.now();
        double monthlyEarnings = invoices.stream()
                .filter(inv -> {
                    String month = inv.getInvoiceMonth();
                    if (month == null) return false;
                    try {
                        YearMonth invMonth = YearMonth.parse(month);
                        return invMonth.equals(currentMonth);
                    } catch (Exception e) {
                        return false;
                    }
                })
                .filter(inv -> "APPROVED".equals(inv.getStatus()))
                .mapToDouble(inv -> inv.getAmount() != null ? inv.getAmount() : 0)
                .sum();

        // Pending invoices
        long pendingInvoices = invoices.stream()
                .filter(inv -> "PENDING".equals(inv.getAdminApprovalStatus())
                        || "PENDING".equals(inv.getFinanceApprovalStatus()))
                .count();

        // Get timesheets
        long pendingTimesheets = timesheetRepository.findAll().stream()
                .filter(ts -> ts.getContractor() != null && ts.getContractor().getId().equals(contractorId))
                .filter(ts -> ts.getStatus() != null && ts.getStatus() == Status.PENDING)
                .count();

        return Map.of(
                "activeContracts", activeContracts.size(),
                "totalContractValue", totalContractValue,
                "monthlyEarnings", monthlyEarnings,
                "pendingInvoices", pendingInvoices,
                "pendingTimesheets", pendingTimesheets,
                "pendingApprovals", pendingInvoices + pendingTimesheets
        );
    }

    @GetMapping("/alerts")
    public Map<String, Object> getContractorAlerts() {
        Long contractorId = getCurrentContractorId();
        List<Map<String, Object>> alerts = new ArrayList<>();

        // Check contract expiry (next 30 days)
        LocalDate now = LocalDate.now();
        LocalDate nextThirtyDays = now.plusDays(30);

        contractRepository.findByContractorId(contractorId).stream()
                .filter(c -> c.getStatus() == ContractStatus.ACTIVE && c.getEndDate() != null)
                .filter(c -> !c.getEndDate().isBefore(now) && !c.getEndDate().isAfter(nextThirtyDays))
                .forEach(c -> {
                    long daysLeft = java.time.temporal.ChronoUnit.DAYS.between(now, c.getEndDate());
                    boolean urgent = daysLeft <= 14;
                    alerts.add(Map.of(
                            "id", "contract-expiring-" + c.getId(),
                            "type", urgent ? "urgent" : "warning",
                            "title", "Contract expiring: " + (c.getCustomer() != null ? c.getCustomer().getName() : "Contract"),
                            "description", c.getCustomer().getName() + " expires in " + daysLeft + " days (ends " + c.getEndDate() + ")",
                            "icon", urgent ? "alert-circle" : "alert-triangle"
                    ));
                });

        // Check pending invoices
        List<InvoiceResponse> invoices = invoiceRepository.findAll().stream()
                .filter(i -> i.getContractor() != null && i.getContractor().getId().equals(contractorId))
                .filter(i -> "PENDING".equals(i.getAdminApprovalStatus())
                        || "PENDING".equals(i.getFinanceApprovalStatus()))
                .map(i -> {
                    Double billRate = i.getContract() != null ? i.getContract().getBillRate() : null;
                    Double payRate = i.getContract() != null ? i.getContract().getPayRate() : null;
                    return com.cmp.ai.transformer.InvoiceTransformer.invoiceToInvoiceResponse(i, billRate, payRate);
                })
                .toList();

        if (!invoices.isEmpty()) {
            alerts.add(Map.of(
                    "id", "pending-invoices",
                    "type", "warning",
                    "title", invoices.size() + " invoice(s) awaiting approval",
                    "description", "Your invoices are under review by the finance team",
                    "icon", "alert-triangle"
            ));
        }

        // Check pending timesheets
        List<TimesheetResponse> pendingTimesheetList = timesheetRepository.findAll().stream()
                .filter(ts -> ts.getContractor() != null && ts.getContractor().getId().equals(contractorId))
                .filter(ts -> ts.getStatus() != null && ts.getStatus() == Status.PENDING)
                .map(com.cmp.ai.transformer.TimesheetTransformer::timesheetToTimesheetResponse)
                .toList();

        if (!pendingTimesheetList.isEmpty()) {
            alerts.add(Map.of(
                    "id", "pending-timesheets",
                    "type", "urgent",
                    "title", pendingTimesheetList.size() + " timesheet(s) pending approval",
                    "description", "Your timesheets are awaiting manager approval",
                    "icon", "alert-circle"
            ));
        }

        return Map.of("alerts", alerts);
    }

    @GetMapping("/contracts")
    public List<ContractResponse> getContractorContracts() {
        Long contractorId = getCurrentContractorId();
        return contractRepository.findByContractorId(contractorId).stream()
                .map(c -> {
                    ContractResponse resp = new ContractResponse();
                    resp.setId(c.getId());
                    resp.setContractorId(c.getContractor() != null ? c.getContractor().getId() : null);
                    resp.setContractorName(c.getContractor() != null ? c.getContractor().getName() : null);
                    resp.setCustomerId(c.getCustomer() != null ? c.getCustomer().getId() : null);
                    resp.setCustomerName(c.getCustomer() != null ? c.getCustomer().getName() : null);
                    resp.setBillRate(c.getBillRate());
                    resp.setPayRate(c.getPayRate());
                    resp.setPoAllocation(c.getPoAllocation());
                    resp.setEstimatedHours(c.getEstimatedHours());
                    resp.setEstimatedBudget(c.getEstimatedBudget());
                    resp.setStartDate(c.getStartDate() != null ? c.getStartDate().toString() : null);
                    resp.setEndDate(c.getEndDate() != null ? c.getEndDate().toString() : null);
                    resp.setNoticePeriodDays(c.getNoticePeriodDays());
                    resp.setThroughEor(c.getThroughEor());
                    resp.setRemarks(c.getRemarks());
                    resp.setTerminationRemarks(c.getTerminationRemarks());
                    resp.setStatus(c.getStatus() != null ? c.getStatus().name() : null);
                    return resp;
                })
                .toList();
    }

    @GetMapping("/invoices")
    public List<InvoiceResponse> getContractorInvoices() {
        Long contractorId = getCurrentContractorId();
        return invoiceRepository.findAll().stream()
                .filter(i -> i.getContractor() != null && i.getContractor().getId().equals(contractorId))
                .map(i -> {
                    Double billRate = i.getContract() != null ? i.getContract().getBillRate() : null;
                    Double payRate = i.getContract() != null ? i.getContract().getPayRate() : null;
                    return com.cmp.ai.transformer.InvoiceTransformer.invoiceToInvoiceResponse(i, billRate, payRate);
                })
                .toList();
    }

    private Long getCurrentContractorId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new RuntimeException("Not authenticated");
        }
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
        return user.getId();
    }
}

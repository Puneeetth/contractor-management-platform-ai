package com.cmp.ai.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import com.cmp.ai.dto.request.InvoiceRequest;
import com.cmp.ai.dto.response.InvoiceResponse;
import com.cmp.ai.entity.Contract;
import com.cmp.ai.entity.Invoice;
import com.cmp.ai.entity.Timesheet;
import com.cmp.ai.enums.ContractStatus;
import com.cmp.ai.enums.Status;
import com.cmp.ai.exception.BadRequestException;
import com.cmp.ai.exception.ResourceNotFoundException;
import com.cmp.ai.repository.ContractRepository;
import com.cmp.ai.repository.InvoiceRepository;
import com.cmp.ai.repository.TimesheetRepository;
import com.cmp.ai.transformer.InvoiceTransformer;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final TimesheetRepository timesheetRepository;
    private final ContractRepository contractRepository;

    public InvoiceResponse createInvoice(InvoiceRequest request) {
        Timesheet timesheet = timesheetRepository.findById(request.getTimesheetId())
                .orElseThrow(() -> new ResourceNotFoundException("Timesheet not found"));

        if (timesheet.getStatus() != Status.APPROVED) {
            throw new BadRequestException("Only approved timesheets can be invoiced");
        }

        invoiceRepository.findByContractorIdAndInvoiceMonth(timesheet.getContractor().getId(), timesheet.getMonth())
                .ifPresent(i -> {
                    throw new BadRequestException("Invoice already exists for this contractor and month");
                });

        Contract activeContract = contractRepository.findByContractorId(timesheet.getContractor().getId()).stream()
                .filter(c -> c.getStatus() == ContractStatus.ACTIVE)
                .findFirst()
                .orElseThrow(() -> new BadRequestException("No active contract found for this contractor"));

        Double hourlyRate = activeContract.getBillRate();
        if (hourlyRate == null) {
            throw new BadRequestException("Active contract hourly rate is not set");
        }

        double baseAmount = timesheet.getTotalHours() * hourlyRate;
        double taxAmount = baseAmount * 0.10;
        double totalAmount = baseAmount + taxAmount;

        Invoice invoice = Invoice.builder()
                .timesheet(timesheet)
                .contractor(timesheet.getContractor())
                .invoiceMonth(timesheet.getMonth())
                .totalHours(timesheet.getTotalHours())
                .baseAmount(baseAmount)
                .taxAmount(taxAmount)
                .totalAmount(totalAmount)
                .status(Status.PENDING)
                .build();

        return InvoiceTransformer.invoiceToInvoiceResponse(invoiceRepository.save(invoice));
    }

    public List<InvoiceResponse> getAllInvoices() {
        return invoiceRepository.findAll().stream()
                .map(InvoiceTransformer::invoiceToInvoiceResponse)
                .toList();
    }

    public List<InvoiceResponse> getInvoicesByContractor(@NonNull Long contractorId) {
        return invoiceRepository.findAll().stream()
                .filter(i -> i.getContractor().getId().equals(contractorId))
                .map(InvoiceTransformer::invoiceToInvoiceResponse)
                .toList();
    }

    public InvoiceResponse approveInvoice(@NonNull Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found"));

        invoice.setStatus(Status.APPROVED);
        return InvoiceTransformer.invoiceToInvoiceResponse(invoiceRepository.save(invoice));
    }
}

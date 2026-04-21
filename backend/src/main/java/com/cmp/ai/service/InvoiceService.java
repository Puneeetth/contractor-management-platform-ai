package com.cmp.ai.service;

import java.util.List;

import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.cmp.ai.dto.request.InvoiceRequest;
import com.cmp.ai.dto.response.InvoiceResponse;
import com.cmp.ai.entity.Invoice;
import com.cmp.ai.entity.User;
import com.cmp.ai.enums.ContractStatus;
import com.cmp.ai.enums.Status;
import com.cmp.ai.exception.BadRequestException;
import com.cmp.ai.exception.ResourceNotFoundException;
import com.cmp.ai.repository.ContractRepository;
import com.cmp.ai.repository.InvoiceRepository;
import com.cmp.ai.repository.UserRepository;
import com.cmp.ai.transformer.InvoiceTransformer;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final ContractRepository contractRepository;
    private final UserRepository userRepository;
    private final FileService fileService;

    public InvoiceResponse createInvoice(InvoiceRequest request, MultipartFile invoiceFile, MultipartFile timesheetFile) {
        User contractor = userRepository.findById(request.getContractorId())
                .orElseThrow(() -> new ResourceNotFoundException("Contractor not found"));

        invoiceRepository.findByContractorIdAndInvoiceMonth(contractor.getId(), request.getInvoiceMonth())
                .ifPresent(i -> {
                    throw new BadRequestException("Invoice already exists for this contractor and month");
                });

        contractRepository.findByContractorId(contractor.getId()).stream()
                .filter(c -> c.getStatus() == ContractStatus.ACTIVE)
                .findFirst()
                .orElseThrow(() -> new BadRequestException("No active contract found for this contractor"));

        String invoiceFileUrl = invoiceFile != null && !invoiceFile.isEmpty()
                ? fileService.uploadFile(invoiceFile)
                : null;
        String timesheetFileUrl = timesheetFile != null && !timesheetFile.isEmpty()
                ? fileService.uploadFile(timesheetFile)
                : null;

        Invoice invoice = Invoice.builder()
                .contractor(contractor)
                .invoiceMonth(request.getInvoiceMonth())
                .totalAmount(request.getAmount())
                .invoiceFileUrl(invoiceFileUrl)
                .timesheetFileUrl(timesheetFileUrl)
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

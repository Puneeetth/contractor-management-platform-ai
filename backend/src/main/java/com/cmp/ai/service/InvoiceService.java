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

        // ✅ Get contractor
        User contractor = userRepository.findById(request.getContractorId())
                .orElseThrow(() -> new ResourceNotFoundException("Contractor not found"));

        // ✅ Prevent duplicate invoice for same month
        invoiceRepository.findByContractorIdAndInvoiceMonth(contractor.getId(), request.getInvoiceMonth())
                .ifPresent(i -> {
                    throw new BadRequestException("Invoice already exists for this contractor and month");
                });

        // ✅ Get active contract rate
        Double activeContractRate = contractRepository.findByContractorId(contractor.getId()).stream()
                .filter(c -> c.getStatus() == ContractStatus.ACTIVE)
                .findFirst()
                .map(c -> c.getBillRate())
                .orElseThrow(() -> new BadRequestException("No active contract found for this contractor"));

        if (activeContractRate == null || activeContractRate <= 0) {
            throw new BadRequestException("Active contract does not have a valid rate");
        }

        // ✅ Calculate amounts
        Double baseAmount = request.getTotalHours() * activeContractRate;
        Double taxAmount = baseAmount * (request.getTaxPercentage() / 100.0);
        Double totalAmount = baseAmount + taxAmount;

        // ✅ File upload
        String invoiceFileUrl = (invoiceFile != null && !invoiceFile.isEmpty())
                ? fileService.uploadFile(invoiceFile)
                : null;

        String timesheetFileUrl = (timesheetFile != null && !timesheetFile.isEmpty())
                ? fileService.uploadFile(timesheetFile)
                : null;

        // ✅ Create invoice
        Invoice invoice = Invoice.builder()
                .contractor(contractor)
                .invoiceMonth(request.getInvoiceMonth())
                .totalHours(request.getTotalHours())
                .baseAmount(baseAmount)
                .taxAmount(taxAmount)
                .totalAmount(totalAmount)
                .invoiceFileUrl(invoiceFileUrl)
                .timesheetFileUrl(timesheetFileUrl)
                .status(Status.PENDING)
                .build();

        return InvoiceTransformer.invoiceToInvoiceResponse(invoiceRepository.save(invoice));
    }

    public Double getActiveContractRate(@NonNull Long contractorId) {
        userRepository.findById(contractorId)
                .orElseThrow(() -> new ResourceNotFoundException("Contractor not found"));

        return contractRepository.findByContractorId(contractorId).stream()
                .filter(c -> c.getStatus() == ContractStatus.ACTIVE)
                .findFirst()
                .map(c -> c.getBillRate())
                .filter(rate -> rate != null && rate > 0)
                .orElseThrow(() -> new BadRequestException("No active contract with valid rate found for this contractor"));
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
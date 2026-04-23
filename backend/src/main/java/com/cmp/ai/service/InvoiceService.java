package com.cmp.ai.service;

import java.util.List;
import java.util.Optional;

import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.cmp.ai.dto.request.InvoiceRequest;
import com.cmp.ai.dto.response.InvoiceResponse;
import com.cmp.ai.entity.Contract;
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

        // ✅ Enforce one invoice per contractor/month.
        // If existing invoice is REJECTED, we allow resubmission by updating the same record.
        Optional<Invoice> existingInvoiceOptional =
                invoiceRepository.findByContractorIdAndInvoiceMonth(contractor.getId(), request.getInvoiceMonth());

        // ✅ Get active contract rate
        Double activeContractRate = contractRepository.findByContractorId(contractor.getId()).stream()
                .filter(c -> c.getStatus() == ContractStatus.ACTIVE)
                .findFirst()
                .map(c -> c.getPayRate())
                .orElseThrow(() -> new BadRequestException("No active contract found for this contractor"));

        if (activeContractRate == null || activeContractRate <= 0) {
            throw new BadRequestException("Active contract does not have a valid pay rate");
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

        if (existingInvoiceOptional.isPresent()) {
            Invoice existingInvoice = existingInvoiceOptional.get();
            if (existingInvoice.getStatus() != Status.REJECTED) {
                throw new BadRequestException("Invoice already exists for this contractor and month");
            }

            existingInvoice.setTotalHours(request.getTotalHours());
            existingInvoice.setBaseAmount(baseAmount);
            existingInvoice.setTaxAmount(taxAmount);
            existingInvoice.setTotalAmount(totalAmount);
            if (invoiceFileUrl != null) {
                existingInvoice.setInvoiceFileUrl(invoiceFileUrl);
            }
            if (timesheetFileUrl != null) {
                existingInvoice.setTimesheetFileUrl(timesheetFileUrl);
            }
            existingInvoice.setStatus(Status.PENDING);
            existingInvoice.setAdminApprovalStatus(Status.PENDING);
            existingInvoice.setFinanceApprovalStatus(Status.PENDING);
            existingInvoice.setAdminRejectionReason(null);
            existingInvoice.setFinanceRejectionReason(null);
            return toInvoiceResponseWithRates(invoiceRepository.save(existingInvoice));
        }

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
                .adminApprovalStatus(Status.PENDING)
                .financeApprovalStatus(Status.PENDING)
                .build();

        return toInvoiceResponseWithRates(invoiceRepository.save(invoice));
    }

    public Double getActiveContractRate(@NonNull Long contractorId) {
        userRepository.findById(contractorId)
                .orElseThrow(() -> new ResourceNotFoundException("Contractor not found"));

        return contractRepository.findByContractorId(contractorId).stream()
                .filter(c -> c.getStatus() == ContractStatus.ACTIVE)
                .findFirst()
                .map(c -> c.getPayRate())
                .filter(rate -> rate != null && rate > 0)
                .orElseThrow(() -> new BadRequestException("No active contract with valid pay rate found for this contractor"));
    }



    public List<InvoiceResponse> getAllInvoices() {
        return invoiceRepository.findAll().stream()
                .map(this::toInvoiceResponseWithRates)
                .toList();
    }

    public List<InvoiceResponse> getInvoicesByContractor(@NonNull Long contractorId) {
        return invoiceRepository.findAll().stream()
                .filter(i -> i.getContractor().getId().equals(contractorId))
                .map(this::toInvoiceResponseWithRates)
                .toList();
    }

    public InvoiceResponse approveInvoice(@NonNull Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found"));

        invoice.setFinanceApprovalStatus(Status.APPROVED);
        if (Status.APPROVED.equals(invoice.getAdminApprovalStatus())) {
            invoice.setStatus(Status.APPROVED);
        }
        return toInvoiceResponseWithRates(invoiceRepository.save(invoice));
    }

    public InvoiceResponse approveInvoiceByAdmin(@NonNull Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found"));

        invoice.setAdminApprovalStatus(Status.APPROVED);
        invoice.setAdminRejectionReason(null);
        if (Status.APPROVED.equals(invoice.getFinanceApprovalStatus())) {
            invoice.setStatus(Status.APPROVED);
        }
        return toInvoiceResponseWithRates(invoiceRepository.save(invoice));
    }

    public InvoiceResponse approveInvoiceByFinance(@NonNull Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found"));

        invoice.setFinanceApprovalStatus(Status.APPROVED);
        invoice.setFinanceRejectionReason(null);
        if (Status.APPROVED.equals(invoice.getAdminApprovalStatus())) {
            invoice.setStatus(Status.APPROVED);
        }
        return toInvoiceResponseWithRates(invoiceRepository.save(invoice));
    }

    public InvoiceResponse rejectInvoiceByAdmin(@NonNull Long invoiceId, String rejectionReason) {
        if (rejectionReason == null || rejectionReason.trim().isEmpty()) {
            throw new BadRequestException("Rejection reason is required");
        }

        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found"));

        invoice.setAdminApprovalStatus(Status.REJECTED);
        invoice.setAdminRejectionReason(rejectionReason.trim());
        invoice.setStatus(Status.REJECTED);
        return toInvoiceResponseWithRates(invoiceRepository.save(invoice));
    }

    public InvoiceResponse rejectInvoiceByFinance(@NonNull Long invoiceId, String rejectionReason) {
        if (rejectionReason == null || rejectionReason.trim().isEmpty()) {
            throw new BadRequestException("Rejection reason is required");
        }

        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found"));

        invoice.setFinanceApprovalStatus(Status.REJECTED);
        invoice.setFinanceRejectionReason(rejectionReason.trim());
        invoice.setStatus(Status.REJECTED);
        return toInvoiceResponseWithRates(invoiceRepository.save(invoice));
    }

    private InvoiceResponse toInvoiceResponseWithRates(Invoice invoice) {
        Contract activeContract = contractRepository.findByContractorId(invoice.getContractor().getId()).stream()
                .filter(c -> c.getStatus() == ContractStatus.ACTIVE)
                .findFirst()
                .orElse(null);

        Double billRate = activeContract != null
                ? activeContract.getBillRate()
                : deriveBillRateFromInvoice(invoice);
        Double payRate = activeContract != null ? activeContract.getPayRate() : null;

        return InvoiceTransformer.invoiceToInvoiceResponse(invoice, billRate, payRate);
    }

    private Double deriveBillRateFromInvoice(Invoice invoice) {
        if (invoice.getTotalHours() == null || invoice.getTotalHours() <= 0 || invoice.getBaseAmount() == null) {
            return null;
        }
        return invoice.getBaseAmount() / invoice.getTotalHours();
    }
}

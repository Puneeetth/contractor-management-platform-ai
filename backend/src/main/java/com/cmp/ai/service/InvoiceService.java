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
    private final AuditTrailService auditTrailService;

    public InvoiceResponse createInvoice(InvoiceRequest request, MultipartFile invoiceFile, MultipartFile timesheetFile) {

        // ✅ Get contractor
        User contractor = userRepository.findById(request.getContractorId())
                .orElseThrow(() -> new ResourceNotFoundException("Contractor not found"));

        // ✅ Get specific contract by ID
        Contract selectedContract = contractRepository.findById(request.getContractId())
                .orElseThrow(() -> new BadRequestException("Contract not found"));

        // ✅ Validate contract belongs to contractor and is active
        if (!selectedContract.getContractor().getId().equals(request.getContractorId())) {
            throw new BadRequestException("Contract does not belong to this contractor");
        }
        if (selectedContract.getStatus() != ContractStatus.ACTIVE) {
            throw new BadRequestException("Selected contract is not active");
        }

        // ✅ Get contract rate
        Double contractRate = selectedContract.getPayRate();
        if (contractRate == null || contractRate <= 0) {
            throw new BadRequestException("Contract does not have a valid pay rate");
        }

        // ✅ Enforce one invoice per contractor/month.
        // If existing invoice is REJECTED, we allow resubmission by updating the same record.
        Optional<Invoice> existingInvoiceOptional =
                invoiceRepository.findByContractorIdAndInvoiceMonth(contractor.getId(), request.getInvoiceMonth());

        // ✅ Calculate amounts
        Double baseAmount = request.getTotalHours() * contractRate;
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
            existingInvoice.setContract(selectedContract);
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
            Invoice savedInvoice = invoiceRepository.save(existingInvoice);
            auditTrailService.logSystemAction("INVOICE", savedInvoice.getId(), "RESUBMIT_INVOICE", "Resubmitted rejected invoice", savedInvoice.getInvoiceMonth());
            auditTrailService.logWorkflowAction("INVOICE", savedInvoice.getId(), "INVOICE_SUBMISSION", "RESUBMITTED", savedInvoice.getStatus().name(), null);
            return toInvoiceResponseWithRates(savedInvoice);
        }

        // ✅ Create invoice
        Invoice invoice = Invoice.builder()
                .contractor(contractor)
                .contract(selectedContract)
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

        Invoice savedInvoice = invoiceRepository.save(invoice);
        auditTrailService.logSystemAction("INVOICE", savedInvoice.getId(), "CREATE_INVOICE", "Submitted invoice", savedInvoice.getInvoiceMonth());
        auditTrailService.logWorkflowAction("INVOICE", savedInvoice.getId(), "INVOICE_SUBMISSION", "SUBMITTED", savedInvoice.getStatus().name(), null);
        return toInvoiceResponseWithRates(savedInvoice);
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
        Invoice savedInvoice = invoiceRepository.save(invoice);
        auditTrailService.logSystemAction("INVOICE", savedInvoice.getId(), "APPROVE_INVOICE", "Approved invoice via legacy route", null);
        auditTrailService.logWorkflowAction("INVOICE", savedInvoice.getId(), "INVOICE_FINANCE_APPROVAL", "APPROVED", savedInvoice.getFinanceApprovalStatus().name(), null);
        return toInvoiceResponseWithRates(savedInvoice);
    }

    public InvoiceResponse approveInvoiceByAdmin(@NonNull Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found"));

        invoice.setAdminApprovalStatus(Status.APPROVED);
        invoice.setAdminRejectionReason(null);
        if (Status.APPROVED.equals(invoice.getFinanceApprovalStatus())) {
            invoice.setStatus(Status.APPROVED);
        }
        Invoice savedInvoice = invoiceRepository.save(invoice);
        auditTrailService.logSystemAction("INVOICE", savedInvoice.getId(), "ADMIN_APPROVE_INVOICE", "Admin approved invoice", null);
        auditTrailService.logWorkflowAction("INVOICE", savedInvoice.getId(), "INVOICE_ADMIN_APPROVAL", "APPROVED", savedInvoice.getAdminApprovalStatus().name(), null);
        return toInvoiceResponseWithRates(savedInvoice);
    }

    public InvoiceResponse approveInvoiceByFinance(@NonNull Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found"));

        invoice.setFinanceApprovalStatus(Status.APPROVED);
        invoice.setFinanceRejectionReason(null);
        if (Status.APPROVED.equals(invoice.getAdminApprovalStatus())) {
            invoice.setStatus(Status.APPROVED);
        }
        Invoice savedInvoice = invoiceRepository.save(invoice);
        auditTrailService.logSystemAction("INVOICE", savedInvoice.getId(), "FINANCE_APPROVE_INVOICE", "Finance approved invoice", null);
        auditTrailService.logWorkflowAction("INVOICE", savedInvoice.getId(), "INVOICE_FINANCE_APPROVAL", "APPROVED", savedInvoice.getFinanceApprovalStatus().name(), null);
        return toInvoiceResponseWithRates(savedInvoice);
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
        Invoice savedInvoice = invoiceRepository.save(invoice);
        auditTrailService.logSystemAction("INVOICE", savedInvoice.getId(), "ADMIN_REJECT_INVOICE", "Admin rejected invoice", rejectionReason.trim());
        auditTrailService.logWorkflowAction("INVOICE", savedInvoice.getId(), "INVOICE_ADMIN_APPROVAL", "REJECTED", savedInvoice.getAdminApprovalStatus().name(), rejectionReason.trim());
        return toInvoiceResponseWithRates(savedInvoice);
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
        Invoice savedInvoice = invoiceRepository.save(invoice);
        auditTrailService.logSystemAction("INVOICE", savedInvoice.getId(), "FINANCE_REJECT_INVOICE", "Finance rejected invoice", rejectionReason.trim());
        auditTrailService.logWorkflowAction("INVOICE", savedInvoice.getId(), "INVOICE_FINANCE_APPROVAL", "REJECTED", savedInvoice.getFinanceApprovalStatus().name(), rejectionReason.trim());
        return toInvoiceResponseWithRates(savedInvoice);
    }

    private InvoiceResponse toInvoiceResponseWithRates(Invoice invoice) {
        Contract contract = invoice.getContract();
        
        Double billRate = contract != null ? contract.getBillRate() : deriveBillRateFromInvoice(invoice);
        Double payRate = contract != null ? contract.getPayRate() : null;

        return InvoiceTransformer.invoiceToInvoiceResponse(invoice, billRate, payRate);
    }

    private Double deriveBillRateFromInvoice(Invoice invoice) {
        if (invoice.getTotalHours() == null || invoice.getTotalHours() <= 0 || invoice.getBaseAmount() == null) {
            return null;
        }
        return invoice.getBaseAmount() / invoice.getTotalHours();
    }
}

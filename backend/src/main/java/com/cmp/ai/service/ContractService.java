package com.cmp.ai.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.cmp.ai.dto.request.ContractRequest;
import com.cmp.ai.dto.response.ContractResponse;
import com.cmp.ai.entity.Contract;
import com.cmp.ai.entity.Contractor;
import com.cmp.ai.entity.PurchaseOrder;
import com.cmp.ai.entity.User;
import com.cmp.ai.enums.ContractStatus;
import com.cmp.ai.exception.BadRequestException;
import com.cmp.ai.exception.ResourceNotFoundException;
import com.cmp.ai.repository.ContractRepository;
import com.cmp.ai.repository.CustomerRepository;
import com.cmp.ai.repository.ContractorRepository;
import com.cmp.ai.repository.PurchaseOrderRepository;
import com.cmp.ai.transformer.ContractTransformer;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ContractService {

    private final ContractRepository contractRepository;
    private final ContractorRepository contractorRepository;
    private final CustomerRepository customerRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;

    public ContractResponse createContract(ContractRequest request) {
        String normalizedPoNumber = request.getPoAllocation() == null ? "" : request.getPoAllocation().trim();
        if (normalizedPoNumber.isBlank()) {
            throw new BadRequestException("Purchase order is required");
        }

        PurchaseOrder purchaseOrder = purchaseOrderRepository.findByPoNumber(normalizedPoNumber)
                .orElseThrow(() -> new BadRequestException("Purchase order not found: " + normalizedPoNumber));

        Contractor contractorEntity = contractorRepository.findById(request.getContractorId())
                .orElseThrow(() -> new ResourceNotFoundException("Contractor not found"));
        User contractor = contractorEntity.getUser();
        if (contractor == null) {
            throw new ResourceNotFoundException("User not found for contractor");
        }

        if (request.getCustomerId() != null) {
            customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        }

        if (purchaseOrder.getCustomer() == null) {
            throw new BadRequestException("Selected purchase order is not linked to a customer");
        }

        if (request.getCustomerId() != null && !purchaseOrder.getCustomer().getId().equals(request.getCustomerId())) {
            throw new BadRequestException("Customer does not match selected purchase order");
        }

        LocalDate contractStartDate = parseDateOrThrow(request.getStartDate(), "startDate");
        LocalDate contractEndDate = parseDateOrThrow(request.getEndDate(), "endDate");

        if (purchaseOrder.getStartDate() != null && contractStartDate.isBefore(purchaseOrder.getStartDate())) {
            throw new BadRequestException("Contract start date cannot be before purchase order start date");
        }
        if (purchaseOrder.getEndDate() != null && contractEndDate.isAfter(purchaseOrder.getEndDate())) {
            throw new BadRequestException("Contract end date cannot be after purchase order end date");
        }

        Integer maxResources = purchaseOrder.getNumberOfResources();
        if (maxResources != null && maxResources > 0) {
            List<Contract> activePoContracts = contractRepository.findByPoAllocationAndStatus(
                    normalizedPoNumber,
                    ContractStatus.ACTIVE
            );

            Set<Long> activeContractorIds = activePoContracts.stream()
                    .map(Contract::getContractor)
                    .filter(existingContractor -> existingContractor != null && existingContractor.getId() != null)
                    .map(User::getId)
                    .collect(Collectors.toSet());

            boolean isAlreadyActiveOnPo = activeContractorIds.contains(contractor.getId());
            if (!isAlreadyActiveOnPo && activeContractorIds.size() >= maxResources) {
                throw new BadRequestException("Purchase order resource capacity exceeded");
            }
        }

        request.setPoAllocation(normalizedPoNumber);
        request.setCustomerId(purchaseOrder.getCustomer().getId());
        Contract contract = ContractTransformer.contractRequestToContract(request, contractor, purchaseOrder.getCustomer());
        return ContractTransformer.contractToContractResponse(contractRepository.save(contract));
    }

    public List<ContractResponse> getAllContracts() {
        return contractRepository.findAll().stream()
                .map(ContractTransformer::contractToContractResponse)
                .toList();
    }

    private LocalDate parseDateOrThrow(String value, String fieldName) {
        try {
            return LocalDate.parse(value);
        } catch (Exception ex) {
            throw new BadRequestException("Invalid date format for " + fieldName);
        }
    }
}

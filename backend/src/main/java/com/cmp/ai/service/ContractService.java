package com.cmp.ai.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.cmp.ai.dto.request.ContractRequest;
import com.cmp.ai.dto.response.ContractResponse;
import com.cmp.ai.entity.Contract;
import com.cmp.ai.entity.Contractor;
import com.cmp.ai.entity.Customer;
import com.cmp.ai.entity.PurchaseOrder;
import com.cmp.ai.entity.User;
import com.cmp.ai.enums.ContractStatus;
import com.cmp.ai.exception.BadRequestException;
import com.cmp.ai.exception.ResourceNotFoundException;
import com.cmp.ai.repository.ContractRepository;
import com.cmp.ai.repository.CustomerRepository;
import com.cmp.ai.repository.ContractorRepository;
import com.cmp.ai.repository.PurchaseOrderRepository;
import com.cmp.ai.repository.UserRepository;
import com.cmp.ai.transformer.ContractTransformer;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ContractService {

    private final ContractRepository contractRepository;
    private final ContractorRepository contractorRepository;
    private final CustomerRepository customerRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final UserRepository userRepository;

    public ContractResponse createContract(ContractRequest request) {
        String normalizedPoNumber = request.getPoAllocation() == null ? "" : request.getPoAllocation().trim();
        boolean hasPo = !normalizedPoNumber.isBlank();

        PurchaseOrder purchaseOrder = null;
        Customer customer = null;

        if (hasPo) {
            purchaseOrder = purchaseOrderRepository.findByPoNumber(normalizedPoNumber)
                    .orElseThrow(() -> new BadRequestException("Purchase order not found: " + normalizedPoNumber));

            if (purchaseOrder.getCustomer() == null) {
                throw new BadRequestException("Selected purchase order is not linked to a customer");
            }
            customer = purchaseOrder.getCustomer();
        } else {
            // No PO, customer must be provided
            if (request.getCustomerId() == null) {
                throw new BadRequestException("Customer is required when no purchase order is selected");
            }
            customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        }

        Contractor contractorEntity = contractorRepository.findById(request.getContractorId())
                .orElseThrow(() -> new ResourceNotFoundException("Contractor not found"));
        User contractor = contractorEntity.getUser();
        if (contractor == null) {
            throw new ResourceNotFoundException("User not found for contractor");
        }

        // Validate customer match if both PO and customerId are provided
        if (hasPo && request.getCustomerId() != null && !customer.getId().equals(request.getCustomerId())) {
            throw new BadRequestException("Customer does not match selected purchase order");
        }

        LocalDate contractStartDate = parseDateOrThrow(request.getStartDate(), "startDate");
        LocalDate contractEndDate = parseDateOrThrow(request.getEndDate(), "endDate");
        LocalDate today = LocalDate.now();

        if (contractEndDate.isBefore(contractStartDate)) {
            throw new BadRequestException("Contract end date cannot be before start date");
        }

        if (!contractStartDate.isAfter(today)) {
            throw new BadRequestException("Only upcoming contracts can be added. Start date must be in the future");
        }

        List<Contract> contractorContracts = syncContractStatuses(contractRepository.findByContractorId(contractor.getId()), today);

        boolean overlapsExistingContract = contractorContracts.stream()
                .anyMatch(existing -> rangesOverlap(
                        contractStartDate,
                        contractEndDate,
                        existing.getStartDate(),
                        existing.getEndDate()
                ));
        if (overlapsExistingContract) {
            throw new BadRequestException("Contract dates overlap with an existing contract for this contractor");
        }

        // PO-specific validations
        if (hasPo) {
            // Removed date validations to allow contracts outside PO date range

            Integer maxResources = purchaseOrder.getNumberOfResources();
            if (maxResources != null && maxResources > 0) {
                List<Contract> activePoContracts = contractRepository.findAll().stream()
                        .filter(contract -> normalizedPoNumber.equals(contract.getPoAllocation()))
                        .filter(contract -> resolveStatusByDate(contract, today) == ContractStatus.ACTIVE)
                        .toList();

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
        } else {
            request.setPoAllocation(null); // or empty string
        }

        request.setCustomerId(customer.getId());
        Contract contract = ContractTransformer.contractRequestToContract(request, contractor, customer);
        contract.setStatus(ContractStatus.UPCOMING);
        return ContractTransformer.contractToContractResponse(contractRepository.save(contract));
    }

    public List<ContractResponse> getAllContracts() {
        List<Contract> contracts = syncContractStatuses(contractRepository.findAll(), LocalDate.now());
        return contracts.stream()
                .map(ContractTransformer::contractToContractResponse)
                .toList();
    }

    public List<ContractResponse> getContractsByContractor(Long contractorId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdminOrManager = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_MANAGER"));

        if (!isAdminOrManager) {
            String currentUsername = authentication.getName();
            User currentUser = userRepository.findByEmail(currentUsername)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));

            // In this system, user.id is often used interchangeably with contractorId in the frontend
            // Let's check both user.id and contractor.id
            boolean isOwnData = currentUser.getId().equals(contractorId);

            if (!isOwnData) {
                // If not user.id, maybe it's the Contractor entity ID?
                Contractor currentContractor = contractorRepository.findByUserId(currentUser.getId()).orElse(null);
                if (currentContractor == null || !currentContractor.getId().equals(contractorId)) {
                    throw new BadRequestException("Access denied: Can only access your own contracts");
                }
            }
        }
        
        List<Contract> contracts = syncContractStatuses(contractRepository.findByContractorId(contractorId), LocalDate.now());
        return contracts.stream()
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

    private List<Contract> syncContractStatuses(List<Contract> contracts, LocalDate referenceDate) {
        List<Contract> contractsToUpdate = new ArrayList<>();

        for (Contract contract : contracts) {
            ContractStatus expectedStatus = resolveStatusByDate(contract, referenceDate);
            if (expectedStatus != contract.getStatus()) {
                contract.setStatus(expectedStatus);
                contractsToUpdate.add(contract);
            }
        }

        if (!contractsToUpdate.isEmpty()) {
            contractRepository.saveAll(contractsToUpdate);
        }

        return contracts;
    }

    private ContractStatus resolveStatusByDate(Contract contract, LocalDate referenceDate) {
        LocalDate startDate = contract.getStartDate();
        LocalDate endDate = contract.getEndDate();

        if (startDate == null || endDate == null) {
            return ContractStatus.INACTIVE;
        }

        if (endDate.isBefore(referenceDate)) {
            return ContractStatus.INACTIVE;
        }

        if (startDate.isAfter(referenceDate)) {
            return ContractStatus.UPCOMING;
        }

        return ContractStatus.ACTIVE;
    }

    private boolean rangesOverlap(LocalDate newStart, LocalDate newEnd, LocalDate existingStart, LocalDate existingEnd) {
        if (existingStart == null || existingEnd == null) {
            return false;
        }
        return !newStart.isAfter(existingEnd) && !existingStart.isAfter(newEnd);
    }
}
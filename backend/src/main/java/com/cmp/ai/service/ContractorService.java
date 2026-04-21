package com.cmp.ai.service;

import java.util.List;

import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import com.cmp.ai.dto.request.ContractorRequest;
import com.cmp.ai.dto.response.ContractorResponse;
import com.cmp.ai.entity.Contractor;
import com.cmp.ai.entity.User;
import com.cmp.ai.exception.ResourceNotFoundException;
import com.cmp.ai.repository.ContractorRepository;
import com.cmp.ai.repository.UserRepository;
import com.cmp.ai.transformer.ContractorTransformer;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ContractorService {

    private final ContractorRepository contractorRepository;
    private final UserRepository userRepository;

    public ContractorResponse createContractor(ContractorRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Contractor contractor = ContractorTransformer.contractorRequestToContractor(request, user);
        return ContractorTransformer.contractorToContractorResponse(contractorRepository.save(contractor));
    }
    public ContractorResponse getContractorById(Long id) {
        Contractor contractor = contractorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contractor not found"));
        return ContractorTransformer.contractorToContractorResponse(contractor);
    }

    public ContractorResponse getContractorByEmail(String email) {
        Contractor contractor = contractorRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Contractor not found"));
        return ContractorTransformer.contractorToContractorResponse(contractor);
    }

    public ContractorResponse getContractorByUserId(@NonNull Long userId) {
        Contractor contractor = contractorRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Contractor not found"));
        return ContractorTransformer.contractorToContractorResponse(contractor);
    }

    public List<ContractorResponse> getAllContractors() {
        return contractorRepository.findAll().stream()
                .map(ContractorTransformer::contractorToContractorResponse)
                .toList();
    }

    public ContractorResponse updateContractor(@NonNull Long id, ContractorRequest request) {
        Contractor contractor = contractorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contractor not found"));

        contractor.setName(request.getName());
        contractor.setAddress(request.getAddress());
        contractor.setCurrentLocation(request.getCurrentLocation());
        contractor.setEmail(request.getEmail());
        contractor.setSecondaryEmail(request.getSecondaryEmail());
        contractor.setPhoneNumber(request.getPhoneNumber());
        contractor.setNoticePeriodDays(request.getNoticePeriodDays());
        contractor.setRemarks(request.getRemarks());
        contractor.setCustomerManager(request.getCustomerManager());
        contractor.setCustomerManagerEmail(request.getCustomerManagerEmail());

        return ContractorTransformer.contractorToContractorResponse(contractorRepository.save(contractor));
    }

    public void deleteContractor(@NonNull Long id) {
        if (!contractorRepository.existsById(id)) {
            throw new ResourceNotFoundException("Contractor not found");
        }
        contractorRepository.deleteById(id);
    }
}

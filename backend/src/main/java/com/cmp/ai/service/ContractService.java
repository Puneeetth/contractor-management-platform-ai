package com.cmp.ai.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import com.cmp.ai.dto.request.ContractRequest;
import com.cmp.ai.dto.response.ContractResponse;
import com.cmp.ai.entity.Customer;
import com.cmp.ai.entity.Contract;
import com.cmp.ai.entity.User;
import com.cmp.ai.exception.ResourceNotFoundException;
import com.cmp.ai.repository.ContractRepository;
import com.cmp.ai.repository.CustomerRepository;
import com.cmp.ai.repository.UserRepository;
import com.cmp.ai.transformer.ContractTransformer;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ContractService {

    private final ContractRepository contractRepository;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;

    public ContractResponse createContract(ContractRequest request) {
        User contractor = userRepository.findById(request.getContractorId())
                .orElseThrow(() -> new ResourceNotFoundException("Contractor not found"));

        Customer customer = null;
        if (request.getCustomerId() != null) {
            customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        }

        Contract contract = ContractTransformer.contractRequestToContract(request, contractor, customer);
        return ContractTransformer.contractToContractResponse(contractRepository.save(contract));
    }

    public List<ContractResponse> getAllContracts() {
        return contractRepository.findAll().stream()
                .map(ContractTransformer::contractToContractResponse)
                .toList();
    }
}

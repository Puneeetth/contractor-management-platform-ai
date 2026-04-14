package com.cmp.ai.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.cmp.ai.dto.request.PORequest;
import com.cmp.ai.dto.response.POResponse;
import com.cmp.ai.entity.Contract;
import com.cmp.ai.entity.PurchaseOrder;
import com.cmp.ai.exception.BadRequestException;
import com.cmp.ai.exception.ResourceNotFoundException;
import com.cmp.ai.repository.ContractRepository;
import com.cmp.ai.repository.PurchaseOrderRepository;
import com.cmp.ai.transformer.POTransformer;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final ContractRepository contractRepository;

    public POResponse createPurchaseOrder(PORequest request) {
        Contract contract = contractRepository.findById(request.getContractId())
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found"));

        if (request.getCustomerId() != null && contract.getCustomer() != null
                && !request.getCustomerId().equals(contract.getCustomer().getId())) {
            throw new BadRequestException("Contract is not linked to the requested customer");
        }

        PurchaseOrder purchaseOrder = POTransformer.PORequestToPO(request, contract);
        return POTransformer.POToPOResponse(purchaseOrderRepository.save(purchaseOrder));
    }

    public List<POResponse> getAllPurchaseOrders() {
        return purchaseOrderRepository.findAll().stream()
                .map(POTransformer::POToPOResponse)
                .collect(Collectors.toList());
    }

    public List<POResponse> getPurchaseOrdersByContractId(Long contractId) {
        return purchaseOrderRepository.findByContractId(contractId).stream()
                .map(POTransformer::POToPOResponse)
                .collect(Collectors.toList());
    }
}

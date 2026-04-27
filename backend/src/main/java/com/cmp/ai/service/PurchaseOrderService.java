package com.cmp.ai.service;

import java.util.List;

import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cmp.ai.dto.request.PORequest;
import com.cmp.ai.dto.response.POResponse;
import com.cmp.ai.entity.Contract;
import com.cmp.ai.entity.Customer;
import com.cmp.ai.entity.PurchaseOrder;
import com.cmp.ai.exception.BadRequestException;
import com.cmp.ai.exception.ResourceNotFoundException;
import com.cmp.ai.repository.ContractRepository;
import com.cmp.ai.repository.CustomerRepository;
import com.cmp.ai.repository.PurchaseOrderRepository;
import com.cmp.ai.transformer.POTransformer;

import lombok.RequiredArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final ContractRepository contractRepository;
    private final CustomerRepository customerRepository;
    private final FileService fileService;
    private final AuditTrailService auditTrailService;


    @Transactional
    public POResponse createPurchaseOrder(PORequest request, MultipartFile file, MultipartFile sowFile) {

        Contract contract = null;
        if (request.getContractId() != null) {
            contract = contractRepository.findById(request.getContractId())
                    .orElseThrow(() -> new ResourceNotFoundException("Contract not found"));
        }

        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        if (contract != null && contract.getCustomer() != null && !request.getCustomerId().equals(contract.getCustomer().getId())) {
            throw new BadRequestException("Contract is not linked to the requested customer");
        }
        
        PurchaseOrder purchaseOrder = POTransformer.pORequestToPO(request, contract, customer);

        //upload files
        if(file != null && !file.isEmpty()){
            purchaseOrder.setFileUrl(fileService.uploadFile(file));
        }
        
        if(sowFile != null && !sowFile.isEmpty()){
            purchaseOrder.setSowFileUrl(fileService.uploadFile(sowFile));
        }

        PurchaseOrder savedPurchaseOrder = purchaseOrderRepository.save(purchaseOrder);
        auditTrailService.logSystemAction(
                "PURCHASE_ORDER",
                savedPurchaseOrder.getId(),
                "CREATE_PURCHASE_ORDER",
                "Created purchase order",
                savedPurchaseOrder.getPoNumber()
        );
        return POTransformer.pOToPOResponse(savedPurchaseOrder);
    }

    public List<POResponse> getAllPurchaseOrders() {
        return purchaseOrderRepository.findAll().stream()
                .map(POTransformer::pOToPOResponse)
                .toList();
    }

    public List<POResponse> getPurchaseOrdersByContractId(@NonNull Long contractId) {
        return purchaseOrderRepository.findByContractId(contractId).stream()
                .map(POTransformer::pOToPOResponse)
                .toList();
    }
}

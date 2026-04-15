package com.cmp.ai.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.cmp.ai.dto.request.POResourceDetailsRequest;
import com.cmp.ai.dto.response.POResourceDetailsResponse;
import com.cmp.ai.entity.POResourceDetails;
import com.cmp.ai.entity.PurchaseOrder;
import com.cmp.ai.exception.ResourceNotFoundException;
import com.cmp.ai.repository.POResourceDetailsRepository;
import com.cmp.ai.repository.PurchaseOrderRepository;
import com.cmp.ai.transformer.POResourceDetailsTransformer;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class POResourceDetailsService {

    private final POResourceDetailsRepository poResourceDetailsRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;

    public POResourceDetailsResponse createPOResourceDetails(POResourceDetailsRequest request) {
        PurchaseOrder purchaseOrder = purchaseOrderRepository.findById(request.getPurchaseOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found"));

        POResourceDetails details = POResourceDetailsTransformer.POResourceDetailsRequestToEntity(request, purchaseOrder);
        return POResourceDetailsTransformer.POResourceDetailsToResponse(poResourceDetailsRepository.save(details));
    }

    public POResourceDetailsResponse getPOResourceDetailsById(Long id) {
        POResourceDetails details = poResourceDetailsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PO Resource Details not found"));
        return POResourceDetailsTransformer.POResourceDetailsToResponse(details);
    }

    public POResourceDetailsResponse getPOResourceDetailsByPurchaseOrderId(Long purchaseOrderId) {
        POResourceDetails details = poResourceDetailsRepository.findByPurchaseOrderId(purchaseOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("PO Resource Details not found"));
        return POResourceDetailsTransformer.POResourceDetailsToResponse(details);
    }

    public List<POResourceDetailsResponse> getAllPOResourceDetails() {
        return poResourceDetailsRepository.findAll().stream()
                .map(POResourceDetailsTransformer::POResourceDetailsToResponse)
                .collect(Collectors.toList());
    }

    public POResourceDetailsResponse updatePOResourceDetails(Long id, POResourceDetailsRequest request) {
        POResourceDetails details = poResourceDetailsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PO Resource Details not found"));

        details.setNumberOfResources(request.getNumberOfResources());
        details.setSharedWith(request.getSharedWith());
        details.setTeamSize(request.getTeamSize());
        details.setRemark(request.getRemark());

        return POResourceDetailsTransformer.POResourceDetailsToResponse(poResourceDetailsRepository.save(details));
    }

    public void deletePOResourceDetails(Long id) {
        if (!poResourceDetailsRepository.existsById(id)) {
            throw new ResourceNotFoundException("PO Resource Details not found");
        }
        poResourceDetailsRepository.deleteById(id);
    }
}

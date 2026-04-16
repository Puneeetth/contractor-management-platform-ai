package com.cmp.ai.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.lang.NonNull;
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

        POResourceDetails details = POResourceDetailsTransformer.pOResourceDetailsRequestToEntity(request, purchaseOrder);
        return POResourceDetailsTransformer.pOResourceDetailsToResponse(poResourceDetailsRepository.save(details));
    }

    public POResourceDetailsResponse getPOResourceDetailsById(@NonNull Long id) {
        POResourceDetails details = poResourceDetailsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PO Resource Details not found"));
        return POResourceDetailsTransformer.pOResourceDetailsToResponse(details);
    }

    public POResourceDetailsResponse getPOResourceDetailsByPurchaseOrderId(@NonNull Long purchaseOrderId) {
        POResourceDetails details = poResourceDetailsRepository.findByPurchaseOrderId(purchaseOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("PO Resource Details not found"));
        return POResourceDetailsTransformer.pOResourceDetailsToResponse(details);
    }

    public List<POResourceDetailsResponse> getAllPOResourceDetails() {
        return poResourceDetailsRepository.findAll().stream()
                .map(POResourceDetailsTransformer::pOResourceDetailsToResponse)
                .toList();
    }

    public POResourceDetailsResponse updatePOResourceDetails(@NonNull Long id, POResourceDetailsRequest request) {
        POResourceDetails details = poResourceDetailsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PO Resource Details not found"));

        details.setNumberOfResources(request.getNumberOfResources());
        details.setSharedWith(request.getSharedWith());
        details.setTeamSize(request.getTeamSize());
        details.setRemark(request.getRemark());

        return POResourceDetailsTransformer.pOResourceDetailsToResponse(poResourceDetailsRepository.save(details));
    }

    public void deletePOResourceDetails(@NonNull Long id) {
        if (!poResourceDetailsRepository.existsById(id)) {
            throw new ResourceNotFoundException("PO Resource Details not found");
        }
        poResourceDetailsRepository.deleteById(id);
    }
}

package com.cmp.ai.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.cmp.ai.dto.request.PaymentTermsRequest;
import com.cmp.ai.dto.response.PaymentTermsResponse;
import com.cmp.ai.entity.Customer;
import com.cmp.ai.entity.PaymentTerms;
import com.cmp.ai.exception.ResourceNotFoundException;
import com.cmp.ai.repository.CustomerRepository;
import com.cmp.ai.repository.PaymentTermsRepository;
import com.cmp.ai.transformer.PaymentTermsTransformer;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PaymentTermsService {

    private final PaymentTermsRepository paymentTermsRepository;
    private final CustomerRepository customerRepository;

    public PaymentTermsResponse createPaymentTerms(PaymentTermsRequest request) {
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        PaymentTerms paymentTerms = PaymentTermsTransformer.PaymentTermsRequestToEntity(request, customer);
        return PaymentTermsTransformer.PaymentTermsToResponse(paymentTermsRepository.save(paymentTerms));
    }

    public PaymentTermsResponse getPaymentTermsById(Long id) {
        PaymentTerms paymentTerms = paymentTermsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment Terms not found"));
        return PaymentTermsTransformer.PaymentTermsToResponse(paymentTerms);
    }

    public List<PaymentTermsResponse> getPaymentTermsByCustomerId(Long customerId) {
        return paymentTermsRepository.findByCustomerId(customerId).stream()
                .map(PaymentTermsTransformer::PaymentTermsToResponse)
                .collect(Collectors.toList());
    }

    public List<PaymentTermsResponse> getAllPaymentTerms() {
        return paymentTermsRepository.findAll().stream()
                .map(PaymentTermsTransformer::PaymentTermsToResponse)
                .collect(Collectors.toList());
    }

    public PaymentTermsResponse updatePaymentTerms(Long id, PaymentTermsRequest request) {
        PaymentTerms paymentTerms = paymentTermsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment Terms not found"));

        paymentTerms.setTerms(request.getTerms());
        paymentTerms.setRemark(request.getRemark());
        return PaymentTermsTransformer.PaymentTermsToResponse(paymentTermsRepository.save(paymentTerms));
    }

    public void deletePaymentTerms(Long id) {
        if (!paymentTermsRepository.existsById(id)) {
            throw new ResourceNotFoundException("Payment Terms not found");
        }
        paymentTermsRepository.deleteById(id);
    }
}

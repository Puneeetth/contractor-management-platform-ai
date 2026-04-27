package com.cmp.ai.transformer;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

import org.springframework.util.StringUtils;

import com.cmp.ai.dto.request.CustomerRequest;
import com.cmp.ai.dto.response.CustomerResponse;
import com.cmp.ai.entity.Customer;

public class CustomerTransformer {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;

    public static Customer customerRequestToCustomer(CustomerRequest request) {
        return Customer.builder()
                .name(request.getName())
                .address(request.getAddress())
                .msa(request.getMsa())
                .createdDate(parseDate(request.getCreatedDate(), LocalDate.now()))
                .msaRenewalDate(parseDate(request.getMsaRenewalDate(), null))
                .msaRemark(request.getMsaRemark())
                .countriesApplicable(request.getCountriesApplicable())
                .msaContactPerson(request.getMsaContactPerson())
                .msaContactEmail(request.getMsaContactEmail())
                .noticePeriodDays(request.getNoticePeriodDays())
                .build();
    }

    public static CustomerResponse customerToCustomerResponse(Customer customer) {
        return CustomerResponse.builder()
                .id(customer.getId())
                .name(customer.getName())
                .address(customer.getAddress())
                .msa(customer.getMsa())
                .createdDate(formatDate(customer.getCreatedDate()))
                .msaRenewalDate(formatDate(customer.getMsaRenewalDate()))
                .msaRemark(customer.getMsaRemark())
                .countriesApplicable(customer.getCountriesApplicable())
                .msaContactPerson(customer.getMsaContactPerson())
                .msaContactEmail(customer.getMsaContactEmail())
                .noticePeriodDays(customer.getNoticePeriodDays())
                .msaFileUrl(customer.getMsaFileUrl())
                .build();
    }

    private static LocalDate parseDate(String dateText, LocalDate defaultValue) {
        if (!StringUtils.hasText(dateText)) {
            return defaultValue;
        }
        return LocalDate.parse(dateText, FORMATTER);
    }

    private static String formatDate(LocalDate date) {
        return date == null ? null : date.format(FORMATTER);
    }
}

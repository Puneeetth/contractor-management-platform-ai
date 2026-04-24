package com.cmp.ai.transformer;

import com.cmp.ai.dto.request.CountryRequest;
import com.cmp.ai.dto.response.CountryResponse;
import com.cmp.ai.entity.Country;

public class CountryTransformer {

    public static CountryResponse countryToCountryResponse(Country country) {
        return CountryResponse.builder()
                .code(country.getCode())
                .name(country.getName())
                .currency(country.getCurrency())
                .build();
    }

    public static Country countryRequestToCountry(CountryRequest request) {
        Country country = new Country();
        country.setCode(request.getCode());
        country.setName(request.getName());
        country.setCurrency(request.getCurrency());
        return country;
    }
}

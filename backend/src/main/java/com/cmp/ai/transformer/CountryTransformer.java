package com.cmp.ai.transformer;

import com.cmp.ai.dto.request.CountryRequest;
import com.cmp.ai.dto.response.CountryResponse;
import com.cmp.ai.entity.Country;

public class CountryTransformer {

    public static CountryResponse CountryToCountryResponse(Country country) {
        return CountryResponse.builder()
                .code(country.getCode())
                .name(country.getName())
                .build();
    }

    public static Country CountryRequestToCountry(CountryRequest request) {
        return new Country(request.getCode(), request.getName());
    }
}

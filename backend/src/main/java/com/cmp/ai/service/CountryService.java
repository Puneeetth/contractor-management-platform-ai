package com.cmp.ai.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import com.cmp.ai.dto.request.CountryRequest;
import com.cmp.ai.dto.response.CountryResponse;
import com.cmp.ai.entity.Country;
import com.cmp.ai.exception.ResourceNotFoundException;
import com.cmp.ai.repository.CountryRepository;
import com.cmp.ai.transformer.CountryTransformer;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CountryService {

    private final CountryRepository countryRepository;

    public CountryResponse createCountry(CountryRequest request) {
        Country country = CountryTransformer.countryRequestToCountry(request);
        return CountryTransformer.countryToCountryResponse(countryRepository.save(country));
    }

    public CountryResponse getCountryByCode(String code) {
        Country country = countryRepository.findById(code)
                .orElseThrow(() -> new ResourceNotFoundException("Country not found"));
        return CountryTransformer.countryToCountryResponse(country);
    }

    public List<CountryResponse> getAllCountries() {
        return countryRepository.findAll().stream()
                .map(CountryTransformer::countryToCountryResponse)
                .toList();
    }

    public CountryResponse updateCountry(String code, CountryRequest request) {
        Country country = countryRepository.findById(code)
                .orElseThrow(() -> new ResourceNotFoundException("Country not found"));

        country.setName(request.getName());
        country.setCurrency(request.getCurrency());
        return CountryTransformer.countryToCountryResponse(countryRepository.save(country));
    }

    public void deleteCountry(String code) {
        if (!countryRepository.existsById(code)) {
            throw new ResourceNotFoundException("Country not found");
        }
        countryRepository.deleteById(code);
    }
}

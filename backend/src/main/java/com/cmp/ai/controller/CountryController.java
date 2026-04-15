package com.cmp.ai.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cmp.ai.dto.request.CountryRequest;
import com.cmp.ai.dto.response.CountryResponse;
import com.cmp.ai.service.CountryService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/countries")
@RequiredArgsConstructor
public class CountryController {

    private final CountryService countryService;

    @PostMapping
    public ResponseEntity<CountryResponse> createCountry(@Valid @RequestBody CountryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(countryService.createCountry(request));
    }

    @GetMapping("/{code}")
    public ResponseEntity<CountryResponse> getCountryByCode(@PathVariable String code) {
        return ResponseEntity.ok(countryService.getCountryByCode(code));
    }

    @GetMapping
    public ResponseEntity<List<CountryResponse>> getAllCountries() {
        return ResponseEntity.ok(countryService.getAllCountries());
    }

    @PutMapping("/{code}")
    public ResponseEntity<CountryResponse> updateCountry(@PathVariable String code, @Valid @RequestBody CountryRequest request) {
        return ResponseEntity.ok(countryService.updateCountry(code, request));
    }

    @DeleteMapping("/{code}")
    public ResponseEntity<Void> deleteCountry(@PathVariable String code) {
        countryService.deleteCountry(code);
        return ResponseEntity.noContent().build();
    }
}

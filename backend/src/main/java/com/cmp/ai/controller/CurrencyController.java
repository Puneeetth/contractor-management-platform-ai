package com.cmp.ai.controller;

import com.cmp.ai.service.CurrencyService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/currency")
@RequiredArgsConstructor
public class CurrencyController {

    private final CurrencyService currencyService;

    @GetMapping("/convert")
    public Map<String, Object> convert(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam double amount) {

        double result = currencyService.convert(from, to, amount);

        Map<String, Object> response = new HashMap<>();
        response.put("from", from.toUpperCase());
        response.put("to", to.toUpperCase());
        response.put("amount", amount);
        response.put("convertedAmount", result);

        return response;
    }
}
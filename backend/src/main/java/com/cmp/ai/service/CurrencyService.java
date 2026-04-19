package com.cmp.ai.service;

import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Service
public class CurrencyService {

    private final WebClient webClient = WebClient.create();

    public double convert(String from, String to, double amount) {

        String url = "https://api.frankfurter.dev/v2/rates?base=" + from.toUpperCase() + "&symbols=" + to.toUpperCase();

        Map response = webClient.get()
                .uri(url)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        if (response == null || !response.containsKey("rates")) {
            throw new RuntimeException("Invalid API response");
        }

        Map rates = (Map) response.get("rates");

        if (!rates.containsKey(to.toUpperCase())) {
            throw new RuntimeException("Unsupported currency: " + to);
        }

        double rate = Double.parseDouble(rates.get(to.toUpperCase()).toString());

        return amount * rate;
    }
}
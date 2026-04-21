package com.cmp.ai.enums;

public enum Country {
    // APAC
    AUSTRALIA("Australia"),
    CHINA("China"),
    INDIA("India"),
    JAPAN("Japan"),
    SINGAPORE("Singapore"),
    SOUTH_KOREA("South Korea"),
    THAILAND("Thailand"),
    VIETNAM("Vietnam"),
    
    // EMEA
    BELGIUM("Belgium"),
    FRANCE("France"),
    GERMANY("Germany"),
    IRELAND("Ireland"),
    ITALY("Italy"),
    NETHERLANDS("Netherlands"),
    POLAND("Poland"),
    SPAIN("Spain"),
    SWEDEN("Sweden"),
    SWITZERLAND("Switzerland"),
    UAE("UAE"),
    UK("United Kingdom"),
    
    // Americas
    ARGENTINA("Argentina"),
    BRAZIL("Brazil"),
    CANADA("Canada"),
    CHILE("Chile"),
    COLOMBIA("Colombia"),
    MEXICO("Mexico"),
    USA("United States");

    private final String displayName;

    Country(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}

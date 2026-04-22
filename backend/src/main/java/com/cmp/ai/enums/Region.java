package com.cmp.ai.enums;

public enum Region {
    APAC("Asia-Pacific"),
    EMEA("Europe, Middle East, Africa"),
    AMERICAS("Americas"),
    GLOBAL("Global");

    private final String displayName;

    Region(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}

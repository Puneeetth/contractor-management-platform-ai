package com.cmp.ai.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TimesheetEntryRequest {

    @NotNull
    private Long timesheetId;

    @NotBlank
    private String date;

    @NotNull
    @PositiveOrZero
    private Double hours;
}
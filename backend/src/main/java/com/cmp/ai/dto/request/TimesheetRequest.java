package com.cmp.ai.dto.request;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class TimesheetRequest {

    @NotNull
    private Long contractorId;

    @NotBlank
    private String month;

    @NotEmpty
    @Valid
    private List<TimesheetEntryRequest> entries;
}
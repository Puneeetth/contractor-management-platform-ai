package com.cmp.ai.dto.response;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TimesheetResponse {

    private Long id;
    private Long contractorId;
    private String month;
    private Double totalHours;
    private String status;
    private List<TimesheetEntryResponse> entries;
}
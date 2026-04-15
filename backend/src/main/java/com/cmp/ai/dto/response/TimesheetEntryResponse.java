package com.cmp.ai.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimesheetEntryResponse {

<<<<<<< HEAD
    private Long id;
    private Long timesheetId;
=======
>>>>>>> d9d66f5e5660df779ff9e373efd4cab5449199d5
    private String date;
    private Double hours;
}
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

<<<<<<< HEAD
    @NotNull
    private Long timesheetId;

=======
>>>>>>> d9d66f5e5660df779ff9e373efd4cab5449199d5
    @NotBlank
    private String date;

    @NotNull
    @PositiveOrZero
    private Double hours;
}
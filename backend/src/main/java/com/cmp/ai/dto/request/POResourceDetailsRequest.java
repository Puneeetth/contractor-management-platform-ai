package com.cmp.ai.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class POResourceDetailsRequest {

    @NotNull
    private Long purchaseOrderId;

    @NotNull
    @PositiveOrZero
    private Integer numberOfResources;

    private String sharedWith;

    @PositiveOrZero
    private Integer teamSize;

    private String remark;
}

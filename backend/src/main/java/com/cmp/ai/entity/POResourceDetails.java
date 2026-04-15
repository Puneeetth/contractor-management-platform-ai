package com.cmp.ai.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class POResourceDetails {
    @Id
    private Long id;

     private Integer numberOfResources;
    private String sharedWith;
    private Integer teamSize;
    private String remark;

    @OneToOne
    @JoinColumn(name = "po_id")
    private PurchaseOrder purchaseOrder;
    
}

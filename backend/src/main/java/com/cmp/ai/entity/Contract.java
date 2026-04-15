package com.cmp.ai.entity;

import java.time.LocalDate;
import java.util.List;
import com.cmp.ai.enums.ContractStatus;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.Index;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "contracts",
    indexes =  {
        @Index(name = "idx_contract_contractor", columnList = "contractor_id")
    }

)
public class Contract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contractor_id")
    private User contractor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    private Double billRate;
    private Double payRate;
    private String poAllocation;
    private Integer estimatedHours;
    private Double estimatedBudget;
    private Boolean throughEor;
    private String remarks;

    private LocalDate startDate;
    private LocalDate endDate;

    private Integer noticePeriodDays;

    @Enumerated(EnumType.STRING)
    private ContractStatus status;

    @OneToMany(mappedBy = "contract", fetch = FetchType.LAZY)
    private List<PurchaseOrder> purchaseOrders;


    
    
}

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
import lombok.Getter;
import lombok.Setter;
import lombok.Builder;
import lombok.NoArgsConstructor;
import jakarta.persistence.Index;
import jakarta.persistence.Column;

@Entity
@Getter
@Setter
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

    @ManyToOne(fetch = FetchType.EAGER)
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
    private String terminationRemarks;

    private LocalDate startDate;
    private LocalDate endDate;

    private Integer noticePeriodDays;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private ContractStatus status;

    @OneToMany(mappedBy = "contract", fetch = FetchType.LAZY)
    private List<PurchaseOrder> purchaseOrders;


    
    
}

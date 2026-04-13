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
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "contracts")
public class Contract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contractor_id")
    private User contractor;

    private Double hourlyRate;

    private LocalDate startDate;
    private LocalDate endDate;

    private Integer noticePeriodDays;

    @Enumerated(EnumType.STRING)
    private ContractStatus status;

    @OneToMany(mappedBy = "contract", fetch = FetchType.LAZY)
    private List<PurchaseOrder> purchaseOrders;


    
    
}

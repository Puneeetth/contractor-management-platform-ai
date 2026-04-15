package com.cmp.ai.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "payment_terms")
public class PaymentTerms {
    
    @Id
    private Long id;
    private String terms;
    private String remark;

    @ManyToOne
    @JoinColumn(name = "customer_id")
    private Customer customer;
}

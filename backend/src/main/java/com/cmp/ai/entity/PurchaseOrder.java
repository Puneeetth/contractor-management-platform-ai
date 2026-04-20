package com.cmp.ai.entity;

import java.time.LocalDate;

import jakarta.persistence.*;
import lombok.*;

@Builder
@Entity
@Table(name = "purchase_orders")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PurchaseOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id")
    private Contract contract;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    private String poNumber;
    private LocalDate poDate;
    private LocalDate startDate;
    private LocalDate endDate;
    private Double poValue;
    private String currency;
    private Integer paymentTermsDays;
    private String remark;
    private Integer numberOfResources;
    private String sharedWith;
    private String fileUrl;
    private Double totalHoursLimit;
    private String poDocumentName;
    private String poDocumentType;

    @Lob
    @Column(name = "po_document_data", columnDefinition = "LONGBLOB")
    private byte[] poDocumentData;
}
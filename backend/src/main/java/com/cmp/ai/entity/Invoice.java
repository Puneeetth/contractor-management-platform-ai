package com.cmp.ai.entity;

import com.cmp.ai.enums.Status;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Column;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.Builder;
import lombok.NoArgsConstructor;

@Entity
@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "invoices",
    indexes = {
        @Index(name = "idx_invoice_timesheet", columnList = "timesheet_id"
        )
    }
)
public class Invoice {
 
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    @OneToOne
    @JoinColumn(name = "timesheet_id")
    private Timesheet timesheet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contractor_id")
    private User contractor;

    private String invoiceMonth;

    private Double totalHours;

    private Double baseAmount;

    private Double taxAmount;

    private Double totalAmount;

    @Column(length = 500)
    private String invoiceFileUrl;

    @Column(length = 500)
    private String timesheetFileUrl;

    @Enumerated(EnumType.STRING)
    private Status status;

    @Enumerated(EnumType.STRING)
    private Status adminApprovalStatus;

    @Enumerated(EnumType.STRING)
    private Status financeApprovalStatus;
}

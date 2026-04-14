package com.cmp.ai.entity;

import java.util.List;

import com.cmp.ai.enums.Status;

import jakarta.persistence.CascadeType;
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
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Data
@Table( 
    name = "time_sheet",
    indexes = {
        @Index(name = "idx_timesheet_contractor_month",columnList = "contractor_id, month")
    }
)
public class Timesheet {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contractor_id")
    private User contractor;

    private String month;

    private Double totalHours;

    @Enumerated(EnumType.STRING)
    private Status status;


    @OneToMany(mappedBy = "timeSheet", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TimesheetEntry> entries;


}

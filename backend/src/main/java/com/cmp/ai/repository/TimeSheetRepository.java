package com.cmp.ai.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cmp.ai.entity.Timesheet;

public interface TimesheetRepository extends JpaRepository<Timesheet, Long> {
    Optional<Timesheet> findByContractorIdAndMonth(Long contractorId, String month);

    List<Timesheet> findByContractorId(Long contractorId);
}

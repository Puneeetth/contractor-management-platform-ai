package com.cmp.ai.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cmp.ai.entity.TimeSheet;

public interface TimeSheetRepository extends JpaRepository<TimeSheet,Long>{
 Optional<TimeSheet> findByContractorIdAndMonth(Long contractorId,String month);
    List<TimeSheet> findByContractorId(Long contractorId);
}

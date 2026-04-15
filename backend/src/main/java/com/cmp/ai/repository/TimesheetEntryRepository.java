package com.cmp.ai.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.cmp.ai.entity.TimesheetEntry;

public interface TimesheetEntryRepository extends JpaRepository<TimesheetEntry, Long> {
    
    List<TimesheetEntry> findByTimesheetId(Long timesheetId);
}

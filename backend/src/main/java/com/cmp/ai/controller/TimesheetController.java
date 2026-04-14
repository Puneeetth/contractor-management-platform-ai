package com.cmp.ai.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cmp.ai.dto.request.TimesheetRequest;
import com.cmp.ai.dto.response.TimesheetResponse;
import com.cmp.ai.service.TimesheetService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/timesheets")
@RequiredArgsConstructor
public class TimesheetController {

    private final TimesheetService timesheetService;

    @PostMapping
    @PreAuthorize("hasRole('CONTRACTOR')")
    public TimesheetResponse submitTimesheet(@Valid @RequestBody TimesheetRequest request) {
        return timesheetService.createTimesheet(request);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','FINANCE')")
    public List<TimesheetResponse> getAllTimesheets() {
        return timesheetService.getAllTimesheets();
    }

    @GetMapping("/contractor/{contractorId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','FINANCE','CONTRACTOR')")
    public List<TimesheetResponse> getTimesheetsByContractor(@PathVariable Long contractorId) {
        return timesheetService.getTimesheetsByContractor(contractorId);
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('MANAGER')")
    public TimesheetResponse approveTimesheet(@PathVariable Long id) {
        return timesheetService.approveTimesheet(id);
    }
}

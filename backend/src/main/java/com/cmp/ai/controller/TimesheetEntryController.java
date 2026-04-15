package com.cmp.ai.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cmp.ai.dto.request.TimesheetEntryRequest;
import com.cmp.ai.dto.response.TimesheetEntryResponse;
import com.cmp.ai.service.TimesheetEntryService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/timesheet-entries")
@RequiredArgsConstructor
public class TimesheetEntryController {

    private final TimesheetEntryService timesheetEntryService;

    @PostMapping
    public ResponseEntity<TimesheetEntryResponse> createTimesheetEntry(@Valid @RequestBody TimesheetEntryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(timesheetEntryService.createTimesheetEntry(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TimesheetEntryResponse> getTimesheetEntryById(@PathVariable Long id) {
        return ResponseEntity.ok(timesheetEntryService.getTimesheetEntryById(id));
    }

    @GetMapping("/timesheet/{timesheetId}")
    public ResponseEntity<List<TimesheetEntryResponse>> getTimesheetEntriesByTimesheetId(@PathVariable Long timesheetId) {
        return ResponseEntity.ok(timesheetEntryService.getTimesheetEntriesByTimesheetId(timesheetId));
    }

    @GetMapping
    public ResponseEntity<List<TimesheetEntryResponse>> getAllTimesheetEntries() {
        return ResponseEntity.ok(timesheetEntryService.getAllTimesheetEntries());
    }

    @PutMapping("/{id}")
    public ResponseEntity<TimesheetEntryResponse> updateTimesheetEntry(@PathVariable Long id, @Valid @RequestBody TimesheetEntryRequest request) {
        return ResponseEntity.ok(timesheetEntryService.updateTimesheetEntry(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTimesheetEntry(@PathVariable Long id) {
        timesheetEntryService.deleteTimesheetEntry(id);
        return ResponseEntity.noContent().build();
    }
}

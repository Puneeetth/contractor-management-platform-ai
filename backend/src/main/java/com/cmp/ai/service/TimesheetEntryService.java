package com.cmp.ai.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import com.cmp.ai.dto.request.TimesheetEntryRequest;
import com.cmp.ai.dto.response.TimesheetEntryResponse;
import com.cmp.ai.entity.Timesheet;
import com.cmp.ai.entity.TimesheetEntry;
import com.cmp.ai.exception.ResourceNotFoundException;
import com.cmp.ai.repository.TimesheetEntryRepository;
import com.cmp.ai.repository.TimesheetRepository;
import com.cmp.ai.transformer.TimesheetEntryTransformer;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TimesheetEntryService {

    private final TimesheetEntryRepository timesheetEntryRepository;
    private final TimesheetRepository timesheetRepository;

    public TimesheetEntryResponse createTimesheetEntry(TimesheetEntryRequest request) {
        Timesheet timesheet = timesheetRepository.findById(request.getTimesheetId())
                .orElseThrow(() -> new ResourceNotFoundException("Timesheet not found"));

        TimesheetEntry entry = TimesheetEntryTransformer.timesheetEntryRequestToEntity(request, timesheet);
        return TimesheetEntryTransformer.timesheetEntryToResponse(timesheetEntryRepository.save(entry));
    }

    public TimesheetEntryResponse getTimesheetEntryById(@NonNull Long id) {
        TimesheetEntry entry = timesheetEntryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Timesheet Entry not found"));
        return TimesheetEntryTransformer.timesheetEntryToResponse(entry);
    }

    public List<TimesheetEntryResponse> getTimesheetEntriesByTimesheetId(@NonNull Long timesheetId) {
        return timesheetEntryRepository.findByTimesheetId(timesheetId).stream()
                .map(TimesheetEntryTransformer::timesheetEntryToResponse)
                .toList();
    }

    public List<TimesheetEntryResponse> getAllTimesheetEntries() {
        return timesheetEntryRepository.findAll().stream()
                .map(TimesheetEntryTransformer::timesheetEntryToResponse)
                .toList();
    }

    public TimesheetEntryResponse updateTimesheetEntry(@NonNull Long id, TimesheetEntryRequest request) {
        TimesheetEntry entry = timesheetEntryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Timesheet Entry not found"));

        if (request.getDate() != null) {
            java.time.LocalDate date = java.time.LocalDate.parse(request.getDate(), java.time.format.DateTimeFormatter.ISO_LOCAL_DATE);
            entry.setDate(date);
        }
        
        if (request.getHours() != null) {
            entry.setHours(request.getHours());
        }

        return TimesheetEntryTransformer.timesheetEntryToResponse(timesheetEntryRepository.save(entry));
    }

    public void deleteTimesheetEntry(@NonNull Long id) {
        if (!timesheetEntryRepository.existsById(id)) {
            throw new ResourceNotFoundException("Timesheet Entry not found");
        }
        timesheetEntryRepository.deleteById(id);
    }
}

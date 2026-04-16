package com.cmp.ai.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import com.cmp.ai.dto.request.TimesheetRequest;
import com.cmp.ai.dto.response.TimesheetResponse;
import com.cmp.ai.entity.Timesheet;
import com.cmp.ai.entity.User;
import com.cmp.ai.enums.Status;
import com.cmp.ai.exception.BadRequestException;
import com.cmp.ai.exception.ResourceNotFoundException;
import com.cmp.ai.repository.TimesheetRepository;
import com.cmp.ai.repository.UserRepository;
import com.cmp.ai.transformer.TimesheetTransformer;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TimesheetService {

    private final TimesheetRepository timesheetRepository;
    private final UserRepository userRepository;

    public TimesheetResponse createTimesheet(TimesheetRequest request) {
        User contractor = userRepository.findById(request.getContractorId())
                .orElseThrow(() -> new ResourceNotFoundException("Contractor not found"));

        timesheetRepository.findByContractorIdAndMonth(request.getContractorId(), request.getMonth())
                .ifPresent(t -> {
                    throw new BadRequestException("Timesheet already exists for this contractor and month");
                });

        Timesheet timesheet = TimesheetTransformer.timesheetRequestToTimesheet(request, contractor);
        timesheet.getEntries().forEach(entry -> entry.setTimesheet(timesheet));

        return TimesheetTransformer.timesheetToTimesheetResponse(timesheetRepository.save(timesheet));
    }

    public List<TimesheetResponse> getAllTimesheets() {
        return timesheetRepository.findAll().stream()
                .map(TimesheetTransformer::timesheetToTimesheetResponse)
                .toList();
    }

    public List<TimesheetResponse> getTimesheetsByContractor(@NonNull Long contractorId) {
        return timesheetRepository.findByContractorId(contractorId).stream()
                .map(TimesheetTransformer::timesheetToTimesheetResponse)
                .toList();
    }

    public TimesheetResponse approveTimesheet(@NonNull Long timesheetId) {
        Timesheet timesheet = timesheetRepository.findById(timesheetId)
                .orElseThrow(() -> new ResourceNotFoundException("Timesheet not found"));

        timesheet.setStatus(Status.APPROVED);
        return TimesheetTransformer.timesheetToTimesheetResponse(timesheetRepository.save(timesheet));
    }
}

package com.cmp.ai.transformer;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import com.cmp.ai.dto.request.TimesheetRequest;
import com.cmp.ai.dto.response.TimesheetEntryResponse;
import com.cmp.ai.dto.response.TimesheetResponse;
import com.cmp.ai.entity.Timesheet;
import com.cmp.ai.entity.User;
import com.cmp.ai.entity.TimesheetEntry;
import com.cmp.ai.enums.Status;

public class TimesheetTransformer {

    public static TimesheetResponse timesheetToTimesheetResponse(Timesheet t) {

        return TimesheetResponse.builder()
                .id(t.getId())
                .contractorId(t.getContractor().getId())
                .month(t.getMonth())
                .totalHours(t.getTotalHours())
                .status(t.getStatus().name())
                .entries(
                        t.getEntries().stream().map(e ->
                                TimesheetEntryResponse.builder()
                                        .date(e.getDate().toString())
                                        .hours(e.getHours())
                                        .build()
                        ).toList()
                )
                .build();
    }

    public static Timesheet timesheetRequestToTimesheet(TimesheetRequest req, User contractor) {

        List<TimesheetEntry> entries = req.getEntries().stream().map(e ->
                TimesheetEntry.builder()
                        .date(LocalDate.parse(e.getDate()))
                        .hours(e.getHours())
                        .build()
        ).toList();

        Timesheet timesheet = Timesheet.builder()
                .contractor(contractor)
                .month(req.getMonth())
                .entries(entries)
                .status(Status.PENDING)
                .build();

        entries.forEach(entry -> entry.setTimesheet(timesheet));
        return timesheet;
    }
}
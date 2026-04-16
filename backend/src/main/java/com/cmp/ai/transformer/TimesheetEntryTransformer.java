package com.cmp.ai.transformer;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

import com.cmp.ai.dto.request.TimesheetEntryRequest;
import com.cmp.ai.dto.response.TimesheetEntryResponse;
import com.cmp.ai.entity.Timesheet;
import com.cmp.ai.entity.TimesheetEntry;

public class TimesheetEntryTransformer {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;

    public static TimesheetEntryResponse timesheetEntryToResponse(TimesheetEntry timesheetEntry) {
        if (timesheetEntry == null) {
            return null;
        }

        return TimesheetEntryResponse.builder()
                .id(timesheetEntry.getId())
                .timesheetId(timesheetEntry.getTimesheet() != null ? timesheetEntry.getTimesheet().getId() : null)
                .date(timesheetEntry.getDate() != null ? timesheetEntry.getDate().toString() : null)
                .hours(timesheetEntry.getHours())
                .build();
    }

    public static TimesheetEntry timesheetEntryRequestToEntity(TimesheetEntryRequest request, Timesheet timesheet) {
        if (request == null) {
            return null;
        }

        LocalDate date = null;
        if (request.getDate() != null) {
            date = LocalDate.parse(request.getDate(), DATE_FORMATTER);
        }

        return TimesheetEntry.builder()
                .timesheet(timesheet)
                .date(date)
                .hours(request.getHours())
                .build();
    }
}

package com.cmp.ai.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import com.cmp.ai.dto.request.ContractorRequest;
import com.cmp.ai.dto.response.ContractorResponse;
import com.cmp.ai.entity.Contract;
import com.cmp.ai.entity.Contractor;
import com.cmp.ai.entity.User;
import com.cmp.ai.enums.ContractStatus;
import com.cmp.ai.exception.BadRequestException;
import com.cmp.ai.exception.ResourceNotFoundException;
import com.cmp.ai.repository.ContractRepository;
import com.cmp.ai.repository.ContractorRepository;
import com.cmp.ai.repository.UserRepository;
import com.cmp.ai.transformer.ContractorTransformer;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ContractorService {

    private final ContractorRepository contractorRepository;
    private final ContractRepository contractRepository;
    private final UserRepository userRepository;

    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM");

    public ContractorResponse createContractor(ContractorRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Contractor contractor = ContractorTransformer.contractorRequestToContractor(request, user);
        return ContractorTransformer.contractorToContractorResponse(contractorRepository.save(contractor));
    }
    public ContractorResponse getContractorById(Long id) {
        Contractor contractor = contractorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contractor not found"));
        return ContractorTransformer.contractorToContractorResponse(contractor);
    }

    public ContractorResponse getContractorByEmail(String email) {
        Contractor contractor = contractorRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Contractor not found"));
        return ContractorTransformer.contractorToContractorResponse(contractor);
    }

    public ContractorResponse getContractorByUserId(@NonNull Long userId) {
        Contractor contractor = contractorRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Contractor not found"));
        return ContractorTransformer.contractorToContractorResponse(contractor);
    }

    public List<ContractorResponse> getAllContractors() {
        return contractorRepository.findAll().stream()
                .map(ContractorTransformer::contractorToContractorResponse)
                .toList();
    }

    public ContractorResponse updateContractor(@NonNull Long id, ContractorRequest request) {
        Contractor contractor = contractorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contractor not found"));

        contractor.setName(request.getName());
        contractor.setAddress(request.getAddress());
        contractor.setCurrentLocation(request.getCurrentLocation());
        contractor.setEmail(request.getEmail());
        contractor.setSecondaryEmail(request.getSecondaryEmail());
        contractor.setPhoneNumber(request.getPhoneNumber());
        contractor.setNoticePeriodDays(request.getNoticePeriodDays());
        contractor.setRemarks(request.getRemarks());
        contractor.setCustomerManager(request.getCustomerManager());
        contractor.setCustomerManagerEmail(request.getCustomerManagerEmail());

        return ContractorTransformer.contractorToContractorResponse(contractorRepository.save(contractor));
    }

    public void deleteContractor(@NonNull Long id) {
        if (!contractorRepository.existsById(id)) {
            throw new ResourceNotFoundException("Contractor not found");
        }
        contractorRepository.deleteById(id);
    }

    public byte[] exportContractors(String month, Long customerId, String region, String status, boolean includeFinancials) {
        YearMonth selectedMonth = parseMonth(month);
        LocalDate monthStart = selectedMonth.atDay(1);
        LocalDate monthEnd = selectedMonth.atEndOfMonth();
        ContractStatus contractStatus = parseStatus(status);

        List<Contract> contracts = contractRepository.findContractsForExport(monthStart, monthEnd, customerId, contractStatus);
        Map<Long, Contractor> contractorByUserId = contractorRepository.findAll().stream()
                .filter(contractor -> contractor.getUser() != null && contractor.getUser().getId() != null)
                .collect(LinkedHashMap::new, (lookup, contractor) -> lookup.put(contractor.getUser().getId(), contractor), Map::putAll);

        List<ContractExportRow> rows = contracts.stream()
                .map(contract -> toExportRow(contract, contractorByUserId.get(contract.getContractor().getId())))
                .filter(row -> region == null || region.isBlank() || row.region().equalsIgnoreCase(region.trim()))
                .toList();

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Contractors");
            CellStyle headerStyle = createHeaderStyle(workbook);

            int rowIndex = 0;
            Row summaryRow = sheet.createRow(rowIndex++);
            writeCell(summaryRow, 0, "Total contractors");
            writeCell(summaryRow, 1, countUniqueContractors(rows));
            if (includeFinancials) {
                writeCell(summaryRow, 3, "Total revenue");
                writeCell(summaryRow, 4, rows.stream().mapToDouble(ContractExportRow::revenue).sum());
            }

            Row filterRow = sheet.createRow(rowIndex++);
            writeCell(filterRow, 0, "Month");
            writeCell(filterRow, 1, selectedMonth.toString());
            writeCell(filterRow, 2, "Region");
            writeCell(filterRow, 3, region == null || region.isBlank() ? "All" : region);
            writeCell(filterRow, 4, "Status");
            writeCell(filterRow, 5, status == null || status.isBlank() ? "All" : status);

            rowIndex++;
            Row headerRow = sheet.createRow(rowIndex++);
            int columnIndex = 0;
            columnIndex = writeHeader(headerRow, columnIndex, headerStyle, "Contractor ID");
            columnIndex = writeHeader(headerRow, columnIndex, headerStyle, "Contractor Name");
            columnIndex = writeHeader(headerRow, columnIndex, headerStyle, "Customer");
            columnIndex = writeHeader(headerRow, columnIndex, headerStyle, "PO Number");
            columnIndex = writeHeader(headerRow, columnIndex, headerStyle, "Contract ID");
            columnIndex = writeHeader(headerRow, columnIndex, headerStyle, "Start Date");
            columnIndex = writeHeader(headerRow, columnIndex, headerStyle, "End Date");
            columnIndex = writeHeader(headerRow, columnIndex, headerStyle, "Bill Rate");
            columnIndex = writeHeader(headerRow, columnIndex, headerStyle, "Pay Rate");
            columnIndex = writeHeader(headerRow, columnIndex, headerStyle, "Status");
            columnIndex = writeHeader(headerRow, columnIndex, headerStyle, "Region");
            if (includeFinancials) {
                columnIndex = writeHeader(headerRow, columnIndex, headerStyle, "Estimated Hours");
                columnIndex = writeHeader(headerRow, columnIndex, headerStyle, "Revenue");
                columnIndex = writeHeader(headerRow, columnIndex, headerStyle, "Cost");
                writeHeader(headerRow, columnIndex, headerStyle, "Margin");
            }

            for (ContractExportRow row : rows) {
                Row excelRow = sheet.createRow(rowIndex++);
                int dataColumn = 0;
                writeCell(excelRow, dataColumn++, row.contractorId());
                writeCell(excelRow, dataColumn++, row.contractorName());
                writeCell(excelRow, dataColumn++, row.customer());
                writeCell(excelRow, dataColumn++, row.poNumber());
                writeCell(excelRow, dataColumn++, row.contractId());
                writeCell(excelRow, dataColumn++, row.startDate());
                writeCell(excelRow, dataColumn++, row.endDate());
                writeCell(excelRow, dataColumn++, row.billRate());
                writeCell(excelRow, dataColumn++, row.payRate());
                writeCell(excelRow, dataColumn++, row.status());
                writeCell(excelRow, dataColumn++, row.region());
                if (includeFinancials) {
                    writeCell(excelRow, dataColumn++, row.estimatedHours());
                    writeCell(excelRow, dataColumn++, row.revenue());
                    writeCell(excelRow, dataColumn++, row.cost());
                    writeCell(excelRow, dataColumn, row.margin());
                }
            }

            int totalColumns = includeFinancials ? 15 : 11;
            for (int i = 0; i < totalColumns; i++) {
                sheet.autoSizeColumn(i);
                sheet.setColumnWidth(i, Math.min(sheet.getColumnWidth(i) + 1024, 12000));
            }

            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (IOException exception) {
            throw new BadRequestException("Failed to generate contractor export");
        }
    }

    private YearMonth parseMonth(String month) {
        if (month == null || month.isBlank()) {
            throw new BadRequestException("Month is required");
        }
        try {
            return YearMonth.parse(month, MONTH_FORMATTER);
        } catch (DateTimeParseException exception) {
            throw new BadRequestException("Month must be in YYYY-MM format");
        }
    }

    private ContractStatus parseStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        try {
            return ContractStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("Invalid status");
        }
    }

    private ContractExportRow toExportRow(Contract contract, Contractor contractor) {
        double billRate = contract.getBillRate() == null ? 0 : contract.getBillRate();
        double payRate = contract.getPayRate() == null ? 0 : contract.getPayRate();
        int estimatedHours = contract.getEstimatedHours() == null ? 0 : contract.getEstimatedHours();
        double revenue = billRate * estimatedHours;
        double cost = payRate * estimatedHours;

        return new ContractExportRow(
                contractor != null ? contractor.getContractorId() : "-",
                contractor != null ? contractor.getName() : contract.getContractor().getName(),
                contract.getCustomer() != null ? contract.getCustomer().getName() : "-",
                contract.getPoAllocation() == null || contract.getPoAllocation().isBlank() ? "-" : contract.getPoAllocation(),
                String.valueOf(contract.getId()),
                contract.getStartDate() == null ? "" : contract.getStartDate().toString(),
                contract.getEndDate() == null ? "" : contract.getEndDate().toString(),
                billRate,
                payRate,
                contract.getStatus() == null ? "-" : contract.getStatus().name(),
                contractor != null && contractor.getCurrentLocation() != null ? contractor.getCurrentLocation() : "-",
                estimatedHours,
                revenue,
                cost,
                revenue - cost
        );
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        Font font = workbook.createFont();
        font.setBold(true);
        CellStyle style = workbook.createCellStyle();
        style.setFont(font);
        return style;
    }

    private int writeHeader(Row row, int columnIndex, CellStyle style, String value) {
        Cell cell = row.createCell(columnIndex);
        cell.setCellValue(value);
        cell.setCellStyle(style);
        return columnIndex + 1;
    }

    private void writeCell(Row row, int columnIndex, String value) {
        row.createCell(columnIndex).setCellValue(value == null ? "" : value);
    }

    private void writeCell(Row row, int columnIndex, Number value) {
        row.createCell(columnIndex).setCellValue(value == null ? 0 : value.doubleValue());
    }

    private long countUniqueContractors(List<ContractExportRow> rows) {
        return rows.stream().map(ContractExportRow::contractorId).distinct().count();
    }

    private record ContractExportRow(
            String contractorId,
            String contractorName,
            String customer,
            String poNumber,
            String contractId,
            String startDate,
            String endDate,
            double billRate,
            double payRate,
            String status,
            String region,
            int estimatedHours,
            double revenue,
            double cost,
            double margin
    ) {}
}

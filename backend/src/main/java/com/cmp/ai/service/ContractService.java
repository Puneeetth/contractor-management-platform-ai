package com.cmp.ai.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.CreationHelper;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import org.springframework.stereotype.Service;

import com.cmp.ai.dto.request.ContractRequest;
import com.cmp.ai.dto.response.ContractResponse;
import com.cmp.ai.entity.Contract;
import com.cmp.ai.entity.Contractor;
import com.cmp.ai.entity.Customer;
import com.cmp.ai.entity.PurchaseOrder;
import com.cmp.ai.entity.User;
import com.cmp.ai.enums.ContractStatus;
import com.cmp.ai.exception.BadRequestException;
import com.cmp.ai.exception.ResourceNotFoundException;
import com.cmp.ai.repository.ContractRepository;
import com.cmp.ai.repository.CustomerRepository;
import com.cmp.ai.repository.ContractorRepository;
import com.cmp.ai.repository.PurchaseOrderRepository;
import com.cmp.ai.transformer.ContractTransformer;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ContractService {

    private final ContractRepository contractRepository;
    private final ContractorRepository contractorRepository;
    private final CustomerRepository customerRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final AuditTrailService auditTrailService;
    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM");

    public ContractResponse createContract(ContractRequest request) {
        String normalizedPoNumber = request.getPoAllocation() == null ? "" : request.getPoAllocation().trim();
        boolean hasPo = !normalizedPoNumber.isBlank();

        PurchaseOrder purchaseOrder = null;
        Customer customer = null;

        if (hasPo) {
            purchaseOrder = purchaseOrderRepository.findByPoNumber(normalizedPoNumber)
                    .orElseThrow(() -> new BadRequestException("Purchase order not found: " + normalizedPoNumber));

            if (purchaseOrder.getCustomer() == null) {
                throw new BadRequestException("Selected purchase order is not linked to a customer");
            }
            customer = purchaseOrder.getCustomer();
        } else {
            // No PO, customer must be provided
            if (request.getCustomerId() == null) {
                throw new BadRequestException("Customer is required when no purchase order is selected");
            }
            customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        }

        Contractor contractorEntity = contractorRepository.findById(request.getContractorId())
                .orElseThrow(() -> new ResourceNotFoundException("Contractor not found"));
        User contractor = contractorEntity.getUser();
        if (contractor == null) {
            throw new ResourceNotFoundException("User not found for contractor");
        }

        // Validate customer match if both PO and customerId are provided
        if (hasPo && request.getCustomerId() != null && !customer.getId().equals(request.getCustomerId())) {
            throw new BadRequestException("Customer does not match selected purchase order");
        }

        LocalDate contractStartDate = parseDateOrThrow(request.getStartDate(), "startDate");
        LocalDate contractEndDate = parseDateOrThrow(request.getEndDate(), "endDate");
        LocalDate today = LocalDate.now();

        if (contractEndDate.isBefore(contractStartDate)) {
            throw new BadRequestException("Contract end date cannot be before start date");
        }

        if (!contractStartDate.isAfter(today)) {
            throw new BadRequestException("Only upcoming contracts can be added. Start date must be in the future");
        }

        List<Contract> contractorContracts = syncContractStatuses(contractRepository.findByContractorId(contractor.getId()), today);

        boolean overlapsExistingContract = contractorContracts.stream()
                .anyMatch(existing -> rangesOverlap(
                        contractStartDate,
                        contractEndDate,
                        existing.getStartDate(),
                        existing.getEndDate()
                ));
        if (overlapsExistingContract) {
            throw new BadRequestException("Contract dates overlap with an existing contract for this contractor");
        }

        // PO-specific validations
        if (hasPo) {
            // Removed date validations to allow contracts outside PO date range

            Integer maxResources = purchaseOrder.getNumberOfResources();
            if (maxResources != null && maxResources > 0) {
                List<Contract> activePoContracts = contractRepository.findAll().stream()
                        .filter(contract -> normalizedPoNumber.equals(contract.getPoAllocation()))
                        .filter(contract -> resolveStatusByDate(contract, today) == ContractStatus.ACTIVE)
                        .toList();

                Set<Long> activeContractorIds = activePoContracts.stream()
                        .map(Contract::getContractor)
                        .filter(existingContractor -> existingContractor != null && existingContractor.getId() != null)
                        .map(User::getId)
                        .collect(Collectors.toSet());

                boolean isAlreadyActiveOnPo = activeContractorIds.contains(contractor.getId());
                if (!isAlreadyActiveOnPo && activeContractorIds.size() >= maxResources) {
                    throw new BadRequestException("Purchase order resource capacity exceeded");
                }
            }

            request.setPoAllocation(normalizedPoNumber);
        } else {
            request.setPoAllocation(null); // or empty string
        }

        if (request.getPayRate() >= request.getBillRate()) {
            throw new BadRequestException("Pay rate must be less than bill rate");
        }

        request.setCustomerId(customer.getId());
        Contract contract = ContractTransformer.contractRequestToContract(request, contractor, customer);
        contract.setStatus(ContractStatus.UPCOMING);
        Contract savedContract = contractRepository.save(contract);
        auditTrailService.logSystemAction("CONTRACT", savedContract.getId(), "CREATE_CONTRACT", "Created contract", savedContract.getPoAllocation());
        return ContractTransformer.contractToContractResponse(savedContract);
    }

    public List<ContractResponse> getAllContracts() {
        List<Contract> contracts = syncContractStatuses(contractRepository.findAll(), LocalDate.now());
        return contracts.stream()
                .map(ContractTransformer::contractToContractResponse)
                .toList();
    }

    /**
     * Get active contracts for a specific contractor
     */
    public List<ContractResponse> getActiveContractsByContractor(Long contractorId) {
        List<Contract> activeContracts = contractRepository.findByContractorIdAndStatus(contractorId, ContractStatus.ACTIVE);
        return activeContracts.stream()
                .map(ContractTransformer::contractToContractResponse)
                .collect(Collectors.toList());
    }

    private LocalDate parseDateOrThrow(String value, String fieldName) {
        try {
            return LocalDate.parse(value);
        } catch (Exception ex) {
            throw new BadRequestException("Invalid date format for " + fieldName);
        }
    }

    private List<Contract> syncContractStatuses(List<Contract> contracts, LocalDate referenceDate) {
        List<Contract> contractsToUpdate = new ArrayList<>();

        for (Contract contract : contracts) {
            ContractStatus expectedStatus = resolveStatusByDate(contract, referenceDate);
            if (expectedStatus != contract.getStatus()) {
                contract.setStatus(expectedStatus);
                contractsToUpdate.add(contract);
            }
        }

        if (!contractsToUpdate.isEmpty()) {
            contractRepository.saveAll(contractsToUpdate);
        }

        return contracts;
    }

    private ContractStatus resolveStatusByDate(Contract contract, LocalDate referenceDate) {
        LocalDate startDate = contract.getStartDate();
        LocalDate endDate = contract.getEndDate();

        if (startDate == null || endDate == null) {
            return ContractStatus.INACTIVE;
        }

        if (endDate.isBefore(referenceDate)) {
            return ContractStatus.INACTIVE;
        }

        if (startDate.isAfter(referenceDate)) {
            return ContractStatus.UPCOMING;
        }

        return ContractStatus.ACTIVE;
    }

    private boolean rangesOverlap(LocalDate newStart, LocalDate newEnd, LocalDate existingStart, LocalDate existingEnd) {
        if (existingStart == null || existingEnd == null) {
            return false;
        }
        return !newStart.isAfter(existingEnd) && !existingStart.isAfter(newEnd);
    }

    public byte[] exportContracts(String month, Long customerId, Long contractorId, String status, boolean includeFinancialDetails) {
        YearMonth selectedMonth = parseMonth(month);
        LocalDate monthStart = selectedMonth.atDay(1);
        LocalDate monthEnd = selectedMonth.atEndOfMonth();
        ContractStatus contractStatus = parseStatus(status);
        Long contractorUserId = resolveContractorUserId(contractorId);

        Map<Long, Contractor> contractorByUserId = contractorRepository.findAll().stream()
                .filter(contractor -> contractor.getUser() != null && contractor.getUser().getId() != null)
                .collect(Collectors.toMap(
                        contractor -> contractor.getUser().getId(),
                        contractor -> contractor,
                        (left, right) -> left,
                        LinkedHashMap::new
                ));

        List<ContractExportRow> rows = contractRepository.findContractsForExport(monthStart, monthEnd, customerId, contractStatus).stream()
                .filter(contract -> contractorUserId == null || contract.getContractor().getId().equals(contractorUserId))
                .map(contract -> toExportRow(contract, contractorByUserId.get(contract.getContractor().getId())))
                .toList();

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Contracts");
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dateStyle = createDateStyle(workbook);
            CellStyle currencyStyle = createCurrencyStyle(workbook);

            int rowIndex = 0;
            Row summaryRow = sheet.createRow(rowIndex++);
            writeCell(summaryRow, 0, "Total Contracts");
            writeCell(summaryRow, 1, rows.size());
            if (includeFinancialDetails) {
                writeCell(summaryRow, 3, "Total Revenue");
                writeCurrencyCell(summaryRow, 4, rows.stream().mapToDouble(ContractExportRow::revenue).sum(), currencyStyle);
                writeCell(summaryRow, 5, "Total Margin");
                writeCurrencyCell(summaryRow, 6, rows.stream().mapToDouble(ContractExportRow::margin).sum(), currencyStyle);
            }

            Row filterRow = sheet.createRow(rowIndex++);
            writeCell(filterRow, 0, "Month");
            writeCell(filterRow, 1, selectedMonth.toString());
            writeCell(filterRow, 2, "Status");
            writeCell(filterRow, 3, status == null || status.isBlank() ? "All" : status);

            rowIndex++;
            Row headerRow = sheet.createRow(rowIndex++);
            int columnIndex = 0;
            columnIndex = writeHeader(headerRow, columnIndex, headerStyle, "Contractor Name");
            columnIndex = writeHeader(headerRow, columnIndex, headerStyle, "Contractor ID");
            columnIndex = writeHeader(headerRow, columnIndex, headerStyle, "Customer");
            columnIndex = writeHeader(headerRow, columnIndex, headerStyle, "PO Number");
            columnIndex = writeHeader(headerRow, columnIndex, headerStyle, "Contract ID");
            columnIndex = writeHeader(headerRow, columnIndex, headerStyle, "Bill Rate");
            columnIndex = writeHeader(headerRow, columnIndex, headerStyle, "Pay Rate");
            columnIndex = writeHeader(headerRow, columnIndex, headerStyle, "Estimated Hours");
            columnIndex = writeHeader(headerRow, columnIndex, headerStyle, "Start Date");
            columnIndex = writeHeader(headerRow, columnIndex, headerStyle, "End Date");
            columnIndex = writeHeader(headerRow, columnIndex, headerStyle, "Status");
            if (includeFinancialDetails) {
                columnIndex = writeHeader(headerRow, columnIndex, headerStyle, "Revenue");
                columnIndex = writeHeader(headerRow, columnIndex, headerStyle, "Cost");
                writeHeader(headerRow, columnIndex, headerStyle, "Margin");
            }

            for (ContractExportRow row : rows) {
                Row excelRow = sheet.createRow(rowIndex++);
                int dataColumn = 0;
                writeCell(excelRow, dataColumn++, row.contractorName());
                writeCell(excelRow, dataColumn++, row.contractorId());
                writeCell(excelRow, dataColumn++, row.customer());
                writeCell(excelRow, dataColumn++, row.poNumber());
                writeCell(excelRow, dataColumn++, row.contractId());
                writeCurrencyCell(excelRow, dataColumn++, row.billRate(), currencyStyle);
                writeCurrencyCell(excelRow, dataColumn++, row.payRate(), currencyStyle);
                writeCell(excelRow, dataColumn++, row.estimatedHours());
                writeDateCell(excelRow, dataColumn++, row.startDate(), dateStyle);
                writeDateCell(excelRow, dataColumn++, row.endDate(), dateStyle);
                writeCell(excelRow, dataColumn++, row.status());
                if (includeFinancialDetails) {
                    writeCurrencyCell(excelRow, dataColumn++, row.revenue(), currencyStyle);
                    writeCurrencyCell(excelRow, dataColumn++, row.cost(), currencyStyle);
                    writeCurrencyCell(excelRow, dataColumn, row.margin(), currencyStyle);
                }
            }

            int totalColumns = includeFinancialDetails ? 14 : 11;
            for (int i = 0; i < totalColumns; i++) {
                sheet.autoSizeColumn(i);
                sheet.setColumnWidth(i, Math.min(sheet.getColumnWidth(i) + 1024, 12000));
            }

            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (IOException exception) {
            throw new BadRequestException("Failed to generate contract export");
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
            throw new BadRequestException("Invalid contract status");
        }
    }

    private Long resolveContractorUserId(Long contractorId) {
        if (contractorId == null) {
            return null;
        }
        Contractor contractor = contractorRepository.findById(contractorId)
                .orElseThrow(() -> new ResourceNotFoundException("Contractor not found"));
        if (contractor.getUser() == null || contractor.getUser().getId() == null) {
            throw new ResourceNotFoundException("User not found for contractor");
        }
        return contractor.getUser().getId();
    }

    private ContractExportRow toExportRow(Contract contract, Contractor contractor) {
        double billRate = contract.getBillRate() == null ? 0 : contract.getBillRate();
        double payRate = contract.getPayRate() == null ? 0 : contract.getPayRate();
        int estimatedHours = contract.getEstimatedHours() == null ? 0 : contract.getEstimatedHours();
        double revenue = billRate * estimatedHours;
        double cost = payRate * estimatedHours;

        return new ContractExportRow(
                contractor != null ? contractor.getName() : contract.getContractor().getName(),
                contractor != null ? contractor.getContractorId() : "-",
                contract.getCustomer() != null ? contract.getCustomer().getName() : "-",
                contract.getPoAllocation() == null || contract.getPoAllocation().isBlank() ? "-" : contract.getPoAllocation(),
                String.valueOf(contract.getId()),
                billRate,
                payRate,
                estimatedHours,
                contract.getStartDate(),
                contract.getEndDate(),
                contract.getStatus() == null ? "-" : contract.getStatus().name(),
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

    private CellStyle createDateStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        CreationHelper creationHelper = workbook.getCreationHelper();
        style.setDataFormat(creationHelper.createDataFormat().getFormat("yyyy-mm-dd"));
        return style;
    }

    private CellStyle createCurrencyStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        CreationHelper creationHelper = workbook.getCreationHelper();
        style.setDataFormat(creationHelper.createDataFormat().getFormat("$#,##0.00"));
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

    private void writeDateCell(Row row, int columnIndex, LocalDate value, CellStyle style) {
        Cell cell = row.createCell(columnIndex);
        if (value != null) {
            cell.setCellValue(value);
            cell.setCellStyle(style);
        } else {
            cell.setCellValue("");
        }
    }

    private void writeCurrencyCell(Row row, int columnIndex, double value, CellStyle style) {
        Cell cell = row.createCell(columnIndex);
        cell.setCellValue(value);
        cell.setCellStyle(style);
    }

    private record ContractExportRow(
            String contractorName,
            String contractorId,
            String customer,
            String poNumber,
            String contractId,
            double billRate,
            double payRate,
            int estimatedHours,
            LocalDate startDate,
            LocalDate endDate,
            String status,
            double revenue,
            double cost,
            double margin
    ) {}
}

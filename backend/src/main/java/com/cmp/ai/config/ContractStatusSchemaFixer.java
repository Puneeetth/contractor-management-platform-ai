package com.cmp.ai.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ContractStatusSchemaFixer {

    private final JdbcTemplate jdbcTemplate;

    @EventListener(ApplicationReadyEvent.class)
    public void ensureContractStatusColumnSupportsUpcoming() {
        try {
            String schemaName = jdbcTemplate.queryForObject("SELECT DATABASE()", String.class);
            if (schemaName == null || schemaName.isBlank()) {
                return;
            }

            ColumnInfo columnInfo = jdbcTemplate.query(
                    """
                    SELECT DATA_TYPE, COALESCE(CHARACTER_MAXIMUM_LENGTH, 0)
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_SCHEMA = ?
                      AND TABLE_NAME = 'contracts'
                      AND COLUMN_NAME = 'status'
                    """,
                    rs -> rs.next() ? new ColumnInfo(rs.getString(1), rs.getInt(2)) : null,
                    schemaName
            );

            if (columnInfo == null) {
                return;
            }

            boolean requiresFix = "enum".equalsIgnoreCase(columnInfo.dataType())
                    || columnInfo.maxLength() < 8;

            if (requiresFix) {
                jdbcTemplate.execute("ALTER TABLE contracts MODIFY COLUMN status VARCHAR(20) NOT NULL");
                log.info("Applied schema fix: contracts.status converted to VARCHAR(20)");
            }
        } catch (Exception ex) {
            log.warn("Could not auto-fix contracts.status schema: {}", ex.getMessage());
        }
    }

    private record ColumnInfo(String dataType, int maxLength) {
    }
}

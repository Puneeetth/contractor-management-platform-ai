package com.cmp.ai.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.cmp.ai.entity.AdminActivity;
import com.cmp.ai.entity.User;
import com.cmp.ai.repository.AdminActivityRepository;
import com.cmp.ai.repository.UserRepository;
import com.cmp.ai.security.UserPrincipal;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminActivityService {
    
    private final AdminActivityRepository adminActivityRepository;
    private final UserRepository userRepository;
    
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal) {
            UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
            return principal.getId();
        }
        return null;
    }
    
    // Activity types
    public static final String ACTIVITY_CREATE_CONTRACTOR = "CREATE_CONTRACTOR";
    public static final String ACTIVITY_UPDATE_CONTRACTOR = "UPDATE_CONTRACTOR";
    public static final String ACTIVITY_DELETE_CONTRACTOR = "DELETE_CONTRACTOR";
    public static final String ACTIVITY_CREATE_CONTRACT = "CREATE_CONTRACT";
    public static final String ACTIVITY_UPDATE_CONTRACT = "UPDATE_CONTRACT";
    public static final String ACTIVITY_DELETE_CONTRACT = "DELETE_CONTRACT";
    public static final String ACTIVITY_CREATE_CUSTOMER = "CREATE_CUSTOMER";
    public static final String ACTIVITY_UPDATE_CUSTOMER = "UPDATE_CUSTOMER";
    public static final String ACTIVITY_DELETE_CUSTOMER = "DELETE_CUSTOMER";
    public static final String ACTIVITY_CREATE_PO = "CREATE_PO";
    public static final String ACTIVITY_UPDATE_PO = "UPDATE_PO";
    public static final String ACTIVITY_DELETE_PO = "DELETE_PO";
    public static final String ACTIVITY_APPROVE_USER = "APPROVE_USER";
    public static final String ACTIVITY_REJECT_USER = "REJECT_USER";
    public static final String ACTIVITY_APPROVE_EXPENSE = "APPROVE_EXPENSE";
    public static final String ACTIVITY_REJECT_EXPENSE = "REJECT_EXPENSE";
    public static final String ACTIVITY_APPROVE_INVOICE = "APPROVE_INVOICE";
    public static final String ACTIVITY_REJECT_INVOICE = "REJECT_INVOICE";
    
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logActivity(Long userId, String activityType, String description, 
                           String entityType, Long entityId, String entityName) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                return;
            }
            
            AdminActivity activity = AdminActivity.builder()
                    .user(user)
                    .activityType(activityType)
                    .description(description)
                    .entityType(entityType)
                    .entityId(entityId)
                    .entityName(entityName)
                    .createdAt(LocalDateTime.now())
                    .build();
            
            adminActivityRepository.save(activity);
        } catch (Exception e) {
            // Log error but don't fail the main transaction
            System.err.println("Failed to log admin activity: " + e.getMessage());
        }
    }
    
    // Overloaded method that automatically gets current user
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logActivity(String activityType, String description, 
                           String entityType, Long entityId, String entityName) {
        Long userId = getCurrentUserId();
        if (userId != null) {
            logActivity(userId, activityType, description, entityType, entityId, entityName);
        }
    }
    
    @Transactional(readOnly = true)
    public List<AdminActivity> getRecentActivitiesByUser(Long userId, int limit) {
        return adminActivityRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .limit(limit)
                .toList();
    }
    
    @Transactional(readOnly = true)
    public List<AdminActivity> getRecentActivities(int limit) {
        return adminActivityRepository.findTop10ByOrderByCreatedAtDesc()
                .stream()
                .limit(limit)
                .toList();
    }
    
    // Convenience methods for common activities
    public void logCreateContractor(Long userId, Long contractorId, String contractorName) {
        logActivity(userId, ACTIVITY_CREATE_CONTRACTOR, 
                "Created contractor: " + contractorName,
                "CONTRACTOR", contractorId, contractorName);
    }
    
    public void logUpdateContractor(Long userId, Long contractorId, String contractorName) {
        logActivity(userId, ACTIVITY_UPDATE_CONTRACTOR, 
                "Updated contractor: " + contractorName,
                "CONTRACTOR", contractorId, contractorName);
    }
    
    public void logDeleteContractor(Long userId, String contractorName) {
        logActivity(userId, ACTIVITY_DELETE_CONTRACTOR, 
                "Deleted contractor: " + contractorName,
                "CONTRACTOR", null, contractorName);
    }
    
    public void logCreateContract(Long userId, Long contractId, String contractorName) {
        logActivity(userId, ACTIVITY_CREATE_CONTRACT, 
                "Created contract for: " + contractorName,
                "CONTRACT", contractId, "Contract #" + contractId);
    }
    
    public void logUpdateContract(Long userId, Long contractId) {
        logActivity(userId, ACTIVITY_UPDATE_CONTRACT, 
                "Updated contract #" + contractId,
                "CONTRACT", contractId, "Contract #" + contractId);
    }
    
    public void logDeleteContract(Long userId, Long contractId) {
        logActivity(userId, ACTIVITY_DELETE_CONTRACT, 
                "Deleted contract #" + contractId,
                "CONTRACT", contractId, "Contract #" + contractId);
    }
    
    public void logCreateCustomer(Long userId, Long customerId, String customerName) {
        logActivity(userId, ACTIVITY_CREATE_CUSTOMER, 
                "Created customer: " + customerName,
                "CUSTOMER", customerId, customerName);
    }
    
    public void logUpdateCustomer(Long userId, Long customerId, String customerName) {
        logActivity(userId, ACTIVITY_UPDATE_CUSTOMER, 
                "Updated customer: " + customerName,
                "CUSTOMER", customerId, customerName);
    }
    
    public void logDeleteCustomer(Long userId, String customerName) {
        logActivity(userId, ACTIVITY_DELETE_CUSTOMER, 
                "Deleted customer: " + customerName,
                "CUSTOMER", null, customerName);
    }
    
    public void logCreatePO(Long userId, Long poId, String poNumber) {
        logActivity(userId, ACTIVITY_CREATE_PO, 
                "Created purchase order: " + poNumber,
                "PURCHASE_ORDER", poId, poNumber);
    }
    
    public void logUpdatePO(Long userId, Long poId, String poNumber) {
        logActivity(userId, ACTIVITY_UPDATE_PO, 
                "Updated purchase order: " + poNumber,
                "PURCHASE_ORDER", poId, poNumber);
    }
    
    public void logDeletePO(Long userId, String poNumber) {
        logActivity(userId, ACTIVITY_DELETE_PO, 
                "Deleted purchase order: " + poNumber,
                "PURCHASE_ORDER", null, poNumber);
    }
    
    public void logApproveUser(Long userId, Long approvedUserId, String approvedUserName) {
        logActivity(userId, ACTIVITY_APPROVE_USER, 
                "Approved user: " + approvedUserName,
                "USER", approvedUserId, approvedUserName);
    }
    
    public void logRejectUser(Long userId, Long rejectedUserId, String rejectedUserName) {
        logActivity(userId, ACTIVITY_REJECT_USER, 
                "Rejected user: " + rejectedUserName,
                "USER", rejectedUserId, rejectedUserName);
    }
    
    public void logApproveExpense(Long userId, Long expenseId, String contractorName) {
        logActivity(userId, ACTIVITY_APPROVE_EXPENSE, 
                "Approved expense for: " + contractorName,
                "EXPENSE", expenseId, "Expense #" + expenseId);
    }
    
    public void logRejectExpense(Long userId, Long expenseId, String contractorName) {
        logActivity(userId, ACTIVITY_REJECT_EXPENSE, 
                "Rejected expense for: " + contractorName,
                "EXPENSE", expenseId, "Expense #" + expenseId);
    }
    
    public void logApproveInvoice(Long userId, Long invoiceId, String contractorName) {
        logActivity(userId, ACTIVITY_APPROVE_INVOICE, 
                "Approved invoice for: " + contractorName,
                "INVOICE", invoiceId, "Invoice #" + invoiceId);
    }
    
    public void logRejectInvoice(Long userId, Long invoiceId, String contractorName) {
        logActivity(userId, ACTIVITY_REJECT_INVOICE, 
                "Rejected invoice for: " + contractorName,
                "INVOICE", invoiceId, "Invoice #" + invoiceId);
    }
}

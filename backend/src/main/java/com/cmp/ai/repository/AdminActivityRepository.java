package com.cmp.ai.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.cmp.ai.entity.AdminActivity;

@Repository
public interface AdminActivityRepository extends JpaRepository<AdminActivity, Long> {
    
    List<AdminActivity> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    List<AdminActivity> findByUserIdAndCreatedAtAfterOrderByCreatedAtDesc(Long userId, LocalDateTime since);
    
    List<AdminActivity> findTop20ByUserIdOrderByCreatedAtDesc(Long userId);
    
    List<AdminActivity> findTop10ByOrderByCreatedAtDesc();
    
    List<AdminActivity> findByEntityTypeAndEntityId(String entityType, Long entityId);
}

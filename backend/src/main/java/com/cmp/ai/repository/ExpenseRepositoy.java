package com.cmp.ai.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cmp.ai.entity.Expense;

public interface ExpenseRepositoy extends JpaRepository<Expense, Long>{
    List<Expense> findByContractorId(Long id);
    
}

package com.cmp.ai.repository;

import com.cmp.ai.entity.BankAccount;
import com.cmp.ai.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BankAccountRepository extends JpaRepository<BankAccount, Long> {
    Optional<BankAccount> findByUser(User user);
    Optional<BankAccount> findByUserId(Long userId);
}

package com.cmp.ai.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cmp.ai.entity.User;
import com.cmp.ai.enums.Role;
import com.cmp.ai.enums.Status;

public interface UserRepository extends JpaRepository<User,Long>{

         Optional<User> findByEmail(String email);
         
         List<User> findByRole(Role role);

         List<User> findByRegion(String region);

         List<User> findByRoleAndRegion(Role role,String region);
         
         List<User> findByStatus(Status status);
         
         List<User> findByRoleAndStatus(Role role, Status status);
}

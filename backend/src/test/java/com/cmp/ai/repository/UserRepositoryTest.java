package com.cmp.ai.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

import com.cmp.ai.entity.Contract;
import com.cmp.ai.entity.User;
import com.cmp.ai.enums.Role;
import com.cmp.ai.enums.Status;

@DataJpaTest
public class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ContractRepository contractRepository;
    @Test
    void shouldSaveUser(){
       User user = new User();
       user.setName("punith");
       user.setEmail("punithreddy417@gmail.com");
       user.setPassword("punithreddy@123");
       user.setRole(Role.CONTRACTOR);
       user.setRegion("India");
       user.setStatus(Status.APPROVED);
      
       User saved = userRepository.save(user);

        Contract contract = new Contract();
       contract.setContractor(saved);

       Contract savedContract = contractRepository.save(contract);

       assertNotNull(saved.getId());
       assertNotNull(savedContract.getId());

       assertEquals(saved.getId(), savedContract.getContractor().getId());
      
    }
    
}

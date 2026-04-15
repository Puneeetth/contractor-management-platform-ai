package com.cmp.ai.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Table(name = "countries")
@AllArgsConstructor
@NoArgsConstructor
@Data
@Entity
public class Country {
    
    @Id
    private String code;
    private String name;
}

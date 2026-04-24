package com.cmp.ai.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Table(name = "countries")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
public class Country {
    
    @Id
    private String code;
    private String name;
    private String currency;
}

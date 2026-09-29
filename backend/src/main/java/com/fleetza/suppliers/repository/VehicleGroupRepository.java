package com.fleetza.suppliers.repository;

import com.fleetza.suppliers.entity.VehicleGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VehicleGroupRepository extends JpaRepository<VehicleGroup, Long> {

    List<VehicleGroup> findByActiveTrueOrderByNameAsc();

    boolean existsByNameIgnoreCase(String name);
}

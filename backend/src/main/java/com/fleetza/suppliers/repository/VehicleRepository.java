package com.fleetza.suppliers.repository;

import com.fleetza.suppliers.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    List<Vehicle> findBySupplierId(Long supplierId);

    long countBySupplierId(Long supplierId);

    boolean existsByNumber(String number);

    Optional<Vehicle> findByNumber(String number);

    void deleteBySupplierId(Long supplierId);
}

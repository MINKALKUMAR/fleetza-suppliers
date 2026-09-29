package com.fleetza.suppliers.repository;

import com.fleetza.suppliers.entity.BookingRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingRequestRepository extends JpaRepository<BookingRequest, Long> {

    List<BookingRequest> findBySupplierIdOrderByCreatedAtDesc(Long supplierId);

    List<BookingRequest> findAllByOrderByCreatedAtDesc();

    List<BookingRequest> findByVehicleId(Long vehicleId);

    void deleteBySupplierId(Long supplierId);

    void deleteByVehicleId(Long vehicleId);
}

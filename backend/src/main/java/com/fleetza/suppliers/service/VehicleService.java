package com.fleetza.suppliers.service;

import com.fleetza.suppliers.dto.request.VehicleRequest;
import com.fleetza.suppliers.entity.Vehicle;
import com.fleetza.suppliers.exception.BadRequestException;
import com.fleetza.suppliers.exception.ResourceNotFoundException;
import com.fleetza.suppliers.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class VehicleService {

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private com.fleetza.suppliers.repository.UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<Vehicle> getVehicles(Long supplierId) {
        if (supplierId != null && supplierId > 0) {
            return vehicleRepository.findBySupplierId(supplierId);
        }
        return vehicleRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Vehicle findById(Long id) {
        return vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", id));
    }

    @Transactional
    public Vehicle createVehicle(VehicleRequest request, Long authSupplierId) {
        return createVehicle(request, authSupplierId, false);
    }

    @Transactional
    public Vehicle createVehicle(VehicleRequest request, Long authSupplierId, boolean isAdmin) {
        String cleanNumber = request.getNumber().trim().toUpperCase();
        if (vehicleRepository.existsByNumber(cleanNumber)) {
            throw new BadRequestException("That vehicle number is already registered");
        }

        Long targetSupplierId = request.getSupplierId() != null ? request.getSupplierId() : authSupplierId;
        if (targetSupplierId == null) {
            throw new BadRequestException("Supplier ID is required to register a vehicle");
        }

        com.fleetza.suppliers.entity.User supplier = userRepository.findById(targetSupplierId).orElse(null);
        if (supplier != null) {
            long currentCount = vehicleRepository.countBySupplierId(targetSupplierId);
            int maxAllowed = supplier.getVehicleLimit() != null ? supplier.getVehicleLimit() : 5;
            if (currentCount >= maxAllowed) {
                if (isAdmin) {
                    supplier.setVehicleLimit((int) currentCount + 1);
                    userRepository.save(supplier);
                } else {
                    throw new BadRequestException("Vehicle quota limit reached (" + currentCount + "/" + maxAllowed + " vehicles registered). Contact administrator to increase vehicle quota.");
                }
            }
        }

        Vehicle vehicle = new Vehicle(
                request.getName().trim(),
                cleanNumber,
                request.getModel().trim(),
                targetSupplierId
        );
        return vehicleRepository.save(vehicle);
    }

    @Transactional
    public Vehicle updateVehicle(Long id, VehicleRequest request) {
        Vehicle vehicle = findById(id);
        String cleanNumber = request.getNumber().trim().toUpperCase();

        if (!vehicle.getNumber().equalsIgnoreCase(cleanNumber) && vehicleRepository.existsByNumber(cleanNumber)) {
            throw new BadRequestException("That vehicle number is already registered");
        }

        vehicle.setName(request.getName().trim());
        vehicle.setNumber(cleanNumber);
        vehicle.setModel(request.getModel().trim());
        if (request.getSupplierId() != null) {
            vehicle.setSupplierId(request.getSupplierId());
        }

        return vehicleRepository.save(vehicle);
    }

    @Transactional
    public Vehicle updateStatus(Long id, String status) {
        Vehicle vehicle = findById(id);
        vehicle.setStatus(status.toUpperCase().trim());
        return vehicleRepository.save(vehicle);
    }

    @Transactional
    public void deleteVehicle(Long id) {
        Vehicle vehicle = findById(id);
        vehicleRepository.delete(vehicle);
    }
}

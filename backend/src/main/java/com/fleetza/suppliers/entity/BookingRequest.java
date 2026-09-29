package com.fleetza.suppliers.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "booking_requests", indexes = {
    @Index(name = "idx_booking_supplier", columnList = "supplier_id"),
    @Index(name = "idx_booking_vehicle", columnList = "vehicle_id"),
    @Index(name = "idx_booking_status", columnList = "status")
})
public class BookingRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "vehicle_id", nullable = false)
    private Long vehicleId;

    @Column(name = "supplier_id", nullable = false)
    private Long supplierId;

    @Column(length = 500)
    private String message;

    @Column(length = 500)
    private String remarks;

    @Column(name = "pickup_date", length = 30)
    private String pickupDate;

    @Column(name = "pickup_time", length = 30)
    private String pickupTime;

    @Column(name = "duty_type", length = 50)
    private String dutyType = "8/80";

    @Column(name = "pickup_location", length = 200)
    private String pickupLocation;

    @Column(name = "drop_location", length = 250)
    private String dropLocation;

    @Column(name = "passenger_name", length = 150)
    private String passengerName;

    @Column(name = "passenger_phone", length = 50)
    private String passengerPhone;

    @Column(nullable = false, length = 30)
    private String status = "REQUESTED";

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    public BookingRequest() {
    }

    public BookingRequest(Long vehicleId, Long supplierId, String message, String remarks,
                          String pickupDate, String pickupTime, String dutyType, String pickupLocation) {
        this.vehicleId = vehicleId;
        this.supplierId = supplierId;
        this.message = message;
        this.remarks = remarks;
        this.pickupDate = pickupDate;
        this.pickupTime = pickupTime;
        this.dutyType = dutyType != null && !dutyType.isBlank() ? dutyType : "8/80";
        this.pickupLocation = pickupLocation;
        this.status = "REQUESTED";
    }

    public BookingRequest(Long vehicleId, Long supplierId, String message, String remarks,
                          String pickupDate, String pickupTime, String dutyType, String pickupLocation,
                          String dropLocation, String passengerName, String passengerPhone) {
        this.vehicleId = vehicleId;
        this.supplierId = supplierId;
        this.message = message;
        this.remarks = remarks;
        this.pickupDate = pickupDate;
        this.pickupTime = pickupTime;
        this.dutyType = dutyType != null && !dutyType.isBlank() ? dutyType : "8/80";
        this.pickupLocation = pickupLocation;
        this.dropLocation = dropLocation;
        this.passengerName = passengerName;
        this.passengerPhone = passengerPhone;
        this.status = "REQUESTED";
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null || this.status.isBlank()) {
            this.status = "REQUESTED";
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(Long vehicleId) {
        this.vehicleId = vehicleId;
    }

    public Long getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(Long supplierId) {
        this.supplierId = supplierId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public String getPickupDate() {
        return pickupDate;
    }

    public void setPickupDate(String pickupDate) {
        this.pickupDate = pickupDate;
    }

    public String getPickupTime() {
        return pickupTime;
    }

    public void setPickupTime(String pickupTime) {
        this.pickupTime = pickupTime;
    }

    public String getDutyType() {
        return dutyType;
    }

    public void setDutyType(String dutyType) {
        this.dutyType = dutyType;
    }

    public String getPickupLocation() {
        return pickupLocation;
    }

    public void setPickupLocation(String pickupLocation) {
        this.pickupLocation = pickupLocation;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public String getDropLocation() {
        return dropLocation;
    }

    public void setDropLocation(String dropLocation) {
        this.dropLocation = dropLocation;
    }

    public String getPassengerName() {
        return passengerName;
    }

    public void setPassengerName(String passengerName) {
        this.passengerName = passengerName;
    }

    public String getPassengerPhone() {
        return passengerPhone;
    }

    public void setPassengerPhone(String passengerPhone) {
        this.passengerPhone = passengerPhone;
    }
}

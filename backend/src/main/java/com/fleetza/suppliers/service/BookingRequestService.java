package com.fleetza.suppliers.service;

import com.fleetza.suppliers.dto.request.CreateBookingRequest;
import com.fleetza.suppliers.entity.BookingRequest;
import com.fleetza.suppliers.entity.Vehicle;
import com.fleetza.suppliers.exception.BadRequestException;
import com.fleetza.suppliers.exception.ResourceNotFoundException;
import com.fleetza.suppliers.repository.BookingRequestRepository;
import com.fleetza.suppliers.repository.VehicleRepository;
import com.fleetza.suppliers.entity.User;
import com.fleetza.suppliers.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class BookingRequestService {

    @Autowired
    private BookingRequestRepository bookingRequestRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WebPushService webPushService;

    @Transactional(readOnly = true)
    public List<BookingRequest> getBookingRequests(Long supplierId) {
        if (supplierId != null && supplierId > 0) {
            return bookingRequestRepository.findBySupplierIdOrderByCreatedAtDesc(supplierId);
        }
        return bookingRequestRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public BookingRequest findById(Long id) {
        return bookingRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BookingRequest", "id", id));
    }

    @Transactional
    public BookingRequest createBookingRequest(CreateBookingRequest request) {
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", request.getVehicleId()));

        if (!"AVAILABLE".equalsIgnoreCase(vehicle.getStatus())) {
            throw new BadRequestException("This vehicle is no longer available.");
        }

        String remarks = request.getRemarks() != null ? request.getRemarks().trim() :
                (request.getMessage() != null ? request.getMessage().trim() : "");

        String dutyType = request.getDutyType() != null && !request.getDutyType().isBlank()
                ? request.getDutyType()
                : "8/80";

        BookingRequest booking = new BookingRequest(
                vehicle.getId(),
                vehicle.getSupplierId(),
                remarks,
                remarks,
                request.getPickupDate(),
                request.getPickupTime(),
                dutyType,
                request.getPickupLocation() != null ? request.getPickupLocation().trim() : "",
                request.getDropLocation() != null ? request.getDropLocation().trim() : "",
                request.getPassengerName() != null ? request.getPassengerName().trim() : "",
                request.getPassengerPhone() != null ? request.getPassengerPhone().trim() : ""
        );

        BookingRequest saved = bookingRequestRepository.save(booking);

        vehicle.setStatus("REQUESTED");
        vehicleRepository.save(vehicle);

        notificationService.createNotification(
                vehicle.getSupplierId().toString(),
                "BOOKING_REQUEST",
                "New booking request",
                "A booking request was sent for " + vehicle.getName() + " (" + vehicle.getNumber() + ").",
                saved.getId()
        );

        // Send Zero-Cost Browser Web Push (VAPID) to supplier's subscribed browsers/PWAs
        try {
            Map<String, Object> data = new HashMap<>();
            data.put("type", "BOOKING_REQUEST");
            data.put("bookingId", saved.getId());
            data.put("dutyType", saved.getDutyType() != null ? saved.getDutyType() : "8/80");
            data.put("pickupDate", saved.getPickupDate() != null ? saved.getPickupDate() : "");
            data.put("pickupTime", saved.getPickupTime() != null ? saved.getPickupTime() : "");
            data.put("vehicleNumber", vehicle.getNumber());
            data.put("pickupLocation", saved.getPickupLocation() != null ? saved.getPickupLocation() : "");

            String pushTitle = "New Duty Dispatch · " + vehicle.getNumber();
            String pushBody = String.format(
                    "%s (%s) · %s %s · %s. Tap to Accept or Decline.",
                    vehicle.getName(),
                    saved.getDutyType(),
                    saved.getPickupDate() != null && !saved.getPickupDate().isBlank() ? saved.getPickupDate() : "Today",
                    saved.getPickupTime() != null ? saved.getPickupTime() : "",
                    saved.getPickupLocation() != null && !saved.getPickupLocation().isBlank() ? saved.getPickupLocation() : "Open portal for pickup"
            ).trim();

            webPushService.sendPushToUserAsync(
                    vehicle.getSupplierId(),
                    pushTitle,
                    pushBody,
                    "/supplier/dashboard",
                    "fleetza-duty-" + saved.getId(),
                    data
            );
        } catch (Exception ignored) {
            // Push notification failure should not block booking transaction
        }

        return saved;
    }

    @Transactional
    public BookingRequest updateStatus(Long requestId, String status) {
        BookingRequest booking = findById(requestId);
        String cleanStatus = status.trim().toUpperCase();

        booking.setStatus(cleanStatus);
        BookingRequest saved = bookingRequestRepository.save(booking);

        Vehicle vehicle = vehicleRepository.findById(booking.getVehicleId()).orElse(null);
        if (vehicle != null) {
            vehicle.setStatus("CONFIRMED".equalsIgnoreCase(cleanStatus) ? "CONFIRMED" : "AVAILABLE");
            vehicleRepository.save(vehicle);
        }

        notificationService.deleteByRequestId(requestId);

        boolean isConfirmed = "CONFIRMED".equalsIgnoreCase(cleanStatus);
        notificationService.createNotification(
                "admin-1",
                "REQUEST_UPDATE",
                isConfirmed ? "Request accepted" : "Request declined",
                "Supplier " + (isConfirmed ? "accepted" : "declined") + " the booking request.",
                requestId
        );

        try {
            User supplierUser = booking.getSupplierId() != null
                    ? userRepository.findById(booking.getSupplierId()).orElse(null)
                    : null;
            String supplierLabel = supplierUser != null ? supplierUser.getFullName() : "Supplier";
            String cityLabel = (supplierUser != null && supplierUser.getCity() != null) ? supplierUser.getCity() : "";
            String vehicleLabel = vehicle != null ? (vehicle.getName() + " (" + vehicle.getNumber() + ")") : "Vehicle";

            Map<String, Object> adminData = new HashMap<>();
            adminData.put("type", "REQUEST_UPDATE");
            adminData.put("bookingId", saved.getId());
            adminData.put("status", cleanStatus);

            webPushService.sendPushToAdminsAsync(
                    isConfirmed ? "Duty Accepted · " + (vehicle != null ? vehicle.getNumber() : "") : "Duty Declined · " + (vehicle != null ? vehicle.getNumber() : ""),
                    supplierLabel + (cityLabel.isBlank() ? "" : " (" + cityLabel + ")") + " " + (isConfirmed ? "accepted" : "declined") + " " + vehicleLabel,
                    "/admin/requests",
                    "fleetza-resp-" + saved.getId(),
                    adminData
            );
        } catch (Exception ignored) {
        }

        return saved;
    }

    @Transactional
    public BookingRequest completeDuty(Long requestId) {
        BookingRequest booking = findById(requestId);
        booking.setStatus("COMPLETED");
        booking.setCompletedAt(LocalDateTime.now());
        BookingRequest saved = bookingRequestRepository.save(booking);

        Vehicle vehicle = vehicleRepository.findById(booking.getVehicleId()).orElse(null);
        if (vehicle != null) {
            vehicle.setStatus("AVAILABLE");
            vehicleRepository.save(vehicle);
        }

        notificationService.createNotification(
                "admin-1",
                "DUTY_COMPLETED",
                "Duty completed",
                "A supplier marked the duty complete and the vehicle is available again.",
                requestId
        );

        try {
            Map<String, Object> adminData = new HashMap<>();
            adminData.put("type", "DUTY_COMPLETED");
            adminData.put("bookingId", saved.getId());

            String vehicleLabel = vehicle != null ? (vehicle.getName() + " (" + vehicle.getNumber() + ")") : "Vehicle";
            webPushService.sendPushToAdminsAsync(
                    "Duty Completed · " + (vehicle != null ? vehicle.getNumber() : "Free Car"),
                    vehicleLabel + " finished its duty and is Available again.",
                    "/admin/requests",
                    "fleetza-complete-" + saved.getId(),
                    adminData
            );
        } catch (Exception ignored) {
        }

        return saved;
    }
}

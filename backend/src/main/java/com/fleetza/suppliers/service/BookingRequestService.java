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
    private FcmPushService fcmPushService;

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

        // Send High-Priority Instant Waking Cloud Push via Firebase (FCM)
        try {
            User supplierUser = userRepository.findById(vehicle.getSupplierId()).orElse(null);
            if (supplierUser != null && supplierUser.getFcmToken() != null && !supplierUser.getFcmToken().isBlank()) {
                Map<String, String> data = new HashMap<>();
                data.put("bookingId", String.valueOf(saved.getId()));
                data.put("dutyType", saved.getDutyType() != null ? saved.getDutyType() : "8/80");
                data.put("pickupDate", saved.getPickupDate() != null ? saved.getPickupDate() : "");
                data.put("pickupTime", saved.getPickupTime() != null ? saved.getPickupTime() : "");
                data.put("vehicleNumber", vehicle.getNumber());
                data.put("pickupLocation", saved.getPickupLocation() != null ? saved.getPickupLocation() : "");

                fcmPushService.sendDutyDispatchPush(
                        supplierUser.getFcmToken(),
                        "🚕 Urgent Duty Dispatch!",
                        "New Duty: " + saved.getDutyType() + " for " + vehicle.getName() + " (" + vehicle.getNumber() + "). Tap to accept!",
                        data
                );
            }
        } catch (Exception e) {
            // Push notification failure should not block transaction
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

        return saved;
    }
}

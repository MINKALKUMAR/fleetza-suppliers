package com.fleetza.suppliers.config;

import com.fleetza.suppliers.entity.*;
import com.fleetza.suppliers.enums.RoleName;
import com.fleetza.suppliers.enums.UserStatus;
import com.fleetza.suppliers.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private CityRepository cityRepository;

    @Autowired
    private VehicleGroupRepository vehicleGroupRepository;

    @Autowired
    private BookingRequestRepository bookingRequestRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        initRoles();
        initCities();
        initVehicleGroups();
        initDefaultUsers();
        initSampleBookings();
    }

    private void initCities() {
        String[] defaults = {"Chandigarh", "Ludhiana", "Jalandhar", "Amritsar", "Bathinda", "Ambala", "Jammu"};
        for (String cityName : defaults) {
            if (!cityRepository.existsByNameIgnoreCase(cityName)) {
                cityRepository.save(new City(cityName));
                logger.info("Initialized default city: {}", cityName);
            }
        }
    }

    private void initVehicleGroups() {
        String[] defaultGroups = {"Dzire", "Ertiga", "Rumion", "Crysta", "Hycross", "Innova", "Sedan AC", "SUV"};
        for (String groupName : defaultGroups) {
            if (!vehicleGroupRepository.existsByNameIgnoreCase(groupName)) {
                vehicleGroupRepository.save(new VehicleGroup(groupName));
                logger.info("Initialized default vehicle group: {}", groupName);
            }
        }
    }

    private void initRoles() {
        for (RoleName roleName : RoleName.values()) {
            if (roleRepository.findByName(roleName).isEmpty()) {
                Role role = new Role(roleName);
                roleRepository.save(role);
                logger.info("Initialized role: {}", roleName);
            }
        }
    }

    private void initDefaultUsers() {
        Role adminRole = roleRepository.findByName(RoleName.ROLE_ADMIN).orElse(null);
        Role supplierRole = roleRepository.findByName(RoleName.ROLE_SUPPLIER).orElse(null);

        // Operations Admin (Single Admin Panel)
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User(
                    "admin",
                    passwordEncoder.encode("Admin@12345"),
                    "Fleetza Operations Admin",
                    "admin@fleetza.com",
                    "8264083932"
            );
            admin.setCompanyName("Fleetza Operations");
            admin.setCity("Chandigarh");
            admin.setWhatsapp("+918264083932");
            Set<Role> roles = new HashSet<>();
            if (adminRole != null) roles.add(adminRole);
            admin.setRoles(roles);
            admin.setStatus(UserStatus.ACTIVE);
            admin.setRequiresPasswordChange(false);
            admin.setVehicleLimit(50);
            userRepository.save(admin);
            logger.info("Initialized admin user: admin with business WhatsApp: 8264083932");
        } else {
            userRepository.findByUsername("admin").ifPresent(admin -> {
                admin.setMobile("8264083932");
                admin.setWhatsapp("+918264083932");
                userRepository.save(admin);
            });
        }

        // Demo Supplier 1: Royal Cabs Chandigarh
        if (!userRepository.existsByUsername("supplier_demo")) {
            User supplier1 = new User(
                    "supplier_demo",
                    passwordEncoder.encode("Supplier@12345"),
                    "Rajinder Singh",
                    "rajinder@royalcabs.in",
                    "9814012345"
            );
            supplier1.setCompanyName("Royal Cabs Chandigarh");
            supplier1.setCity("Chandigarh");
            supplier1.setWhatsapp("+919814012345");
            Set<Role> roles1 = new HashSet<>();
            if (supplierRole != null) roles1.add(supplierRole);
            supplier1.setRoles(roles1);
            supplier1.setStatus(UserStatus.ACTIVE);
            supplier1.setRequiresPasswordChange(false);
            supplier1.setVehicleLimit(5);
            supplier1.setLastLoginAt(LocalDateTime.now().minusHours(1));
            supplier1.setLastActiveAt(LocalDateTime.now().minusMinutes(5));
            supplier1.setIsOnline(true);
            User saved1 = userRepository.save(supplier1);
            logger.info("Initialized demo supplier: supplier_demo (Rajinder Singh)");

            if (!vehicleRepository.existsByNumber("PB01AB1234")) {
                Vehicle dzire = new Vehicle("Swift Dzire White", "PB01AB1234", "Dzire", saved1.getId());
                dzire.setStatus("AVAILABLE");
                vehicleRepository.save(dzire);
            }
            if (!vehicleRepository.existsByNumber("PB01CD5678")) {
                Vehicle crysta = new Vehicle("Innova Crysta Silver", "PB01CD5678", "Crysta", saved1.getId());
                crysta.setStatus("AVAILABLE");
                vehicleRepository.save(crysta);
            }
        }

        // Demo Supplier 2: Dhillon Tour & Travels (Ludhiana)
        if (!userRepository.existsByUsername("ludhiana_fleet")) {
            User supplier2 = new User(
                    "ludhiana_fleet",
                    passwordEncoder.encode("Supplier@12345"),
                    "Harpreet Singh Dhillon",
                    "harpreet@dhillontravels.com",
                    "9872054321"
            );
            supplier2.setCompanyName("Dhillon Tour & Travels");
            supplier2.setCity("Ludhiana");
            supplier2.setWhatsapp("+919872054321");
            Set<Role> roles2 = new HashSet<>();
            if (supplierRole != null) roles2.add(supplierRole);
            supplier2.setRoles(roles2);
            supplier2.setStatus(UserStatus.ACTIVE);
            supplier2.setRequiresPasswordChange(false);
            supplier2.setVehicleLimit(4);
            supplier2.setLastLoginAt(LocalDateTime.now().minusDays(2));
            supplier2.setLastActiveAt(LocalDateTime.now().minusDays(2));
            supplier2.setIsOnline(false);
            User saved2 = userRepository.save(supplier2);
            logger.info("Initialized demo supplier: ludhiana_fleet (Harpreet Singh)");

            if (!vehicleRepository.existsByNumber("PB10XY9876")) {
                Vehicle ertiga = new Vehicle("Ertiga ZXi Grey", "PB10XY9876", "Ertiga", saved2.getId());
                ertiga.setStatus("AVAILABLE");
                vehicleRepository.save(ertiga);
            }
            if (!vehicleRepository.existsByNumber("PB10ZZ4321")) {
                Vehicle hycross = new Vehicle("Innova Hycross Gold", "PB10ZZ4321", "Hycross", saved2.getId());
                hycross.setStatus("BOOKED");
                vehicleRepository.save(hycross);
            }
            if (!vehicleRepository.existsByNumber("PB10MN6543")) {
                Vehicle dzire2 = new Vehicle("Swift Dzire Prime", "PB10MN6543", "Dzire", saved2.getId());
                dzire2.setStatus("AVAILABLE");
                vehicleRepository.save(dzire2);
            }
        }

        // Demo Supplier 3: Golden City Fleet Solutions (Amritsar)
        if (!userRepository.existsByUsername("amritsar_cabs")) {
            User supplier3 = new User(
                    "amritsar_cabs",
                    passwordEncoder.encode("Supplier@12345"),
                    "Manpreet Kaur",
                    "manpreet@goldencitycabs.in",
                    "9888011223"
            );
            supplier3.setCompanyName("Golden City Fleet Solutions");
            supplier3.setCity("Amritsar");
            supplier3.setWhatsapp("+919888011223");
            Set<Role> roles3 = new HashSet<>();
            if (supplierRole != null) roles3.add(supplierRole);
            supplier3.setRoles(roles3);
            supplier3.setStatus(UserStatus.ACTIVE);
            supplier3.setRequiresPasswordChange(false);
            supplier3.setVehicleLimit(6);
            supplier3.setLastLoginAt(LocalDateTime.now().minusDays(5));
            supplier3.setLastActiveAt(LocalDateTime.now().minusDays(5));
            supplier3.setIsOnline(false);
            User saved3 = userRepository.save(supplier3);
            logger.info("Initialized demo supplier: amritsar_cabs (Manpreet Kaur)");

            if (!vehicleRepository.existsByNumber("PB02CD7788")) {
                Vehicle rumion = new Vehicle("Rumion V White", "PB02CD7788", "Rumion", saved3.getId());
                rumion.setStatus("AVAILABLE");
                vehicleRepository.save(rumion);
            }
            if (!vehicleRepository.existsByNumber("PB02GH9900")) {
                Vehicle crysta2 = new Vehicle("Innova Crysta Premium", "PB02GH9900", "Crysta", saved3.getId());
                crysta2.setStatus("AVAILABLE");
                vehicleRepository.save(crysta2);
            }
        }
    }

    private void initSampleBookings() {
        if (bookingRequestRepository.count() == 0) {
            vehicleRepository.findByNumber("PB01AB1234").ifPresent(v -> {
                BookingRequest req1 = new BookingRequest(
                        v.getId(),
                        v.getSupplierId(),
                        "VIP Corporate Guest Arrival",
                        "Meet & greet with name placard at Terminal 1",
                        "Today",
                        "10:30 AM",
                        "4/40",
                        "Chandigarh International Airport (IXC) to JW Marriott"
                );
                bookingRequestRepository.save(req1);

                Notification notif1 = new Notification(
                        v.getSupplierId().toString(),
                        "BOOKING_REQUEST",
                        "New Duty Assigned: PB01AB1234",
                        "Duty request received for Dzire PB01AB1234 at Chandigarh Airport 10:30 AM",
                        req1.getId()
                );
                notificationRepository.save(notif1);
            });

            vehicleRepository.findByNumber("PB10XY9876").ifPresent(v -> {
                BookingRequest req2 = new BookingRequest(
                        v.getId(),
                        v.getSupplierId(),
                        "Industrial Delegation Travel",
                        "Full day city industrial tour",
                        "Today",
                        "02:00 PM",
                        "8/80",
                        "Ludhiana Railway Station to Focal Point Phase 5"
                );
                bookingRequestRepository.save(req2);

                Notification notif2 = new Notification(
                        v.getSupplierId().toString(),
                        "BOOKING_REQUEST",
                        "New Duty Assigned: PB10XY9876",
                        "Duty request received for Ertiga PB10XY9876 at Ludhiana Station 02:00 PM",
                        req2.getId()
                );
                notificationRepository.save(notif2);
            });
            logger.info("Initialized sample booking requests and duty notifications.");
        }
    }
}

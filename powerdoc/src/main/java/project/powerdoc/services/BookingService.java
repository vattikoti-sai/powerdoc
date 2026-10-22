
package project.powerdoc.services;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import project.powerdoc.model.AppUser;
import project.powerdoc.model.Booking;
import project.powerdoc.model.Station;
import project.powerdoc.repository.AppUserRepo;
import project.powerdoc.repository.BookingRepo;
import project.powerdoc.repository.StationRepo;

@Service
public class BookingService {

    private final BookingRepo bookingRepo;
    private final AppUserRepo appUserRepo;
    private final StationRepo stationRepo;

    public BookingService(
            BookingRepo bookingRepo,
            AppUserRepo appUserRepo,
            StationRepo stationRepo) {
        this.bookingRepo = bookingRepo;
        this.appUserRepo = appUserRepo;
        this.stationRepo = stationRepo;
    }

    @Transactional
    public Booking createBooking(Booking booking) {

        Integer userId = booking.getUserId();
        Integer stationId = booking.getStationId();
        LocalDateTime start = booking.getStartTime();
        LocalDateTime end = booking.getEndTime();

        if (userId == null || stationId == null
                || start == null || end == null) {
            throw new RuntimeException(
                    "User, station, start time and end time are required");
        }

        if (!start.isBefore(end)) {
            throw new RuntimeException(
                    "End time must be after start time");
        }

        if (!start.toLocalDate().equals(end.toLocalDate())) {
            throw new RuntimeException(
                    "Booking must start and end on the same date");
        }

        if (start.isBefore(LocalDateTime.now())) {
            throw new RuntimeException(
                    "Cannot book a slot in the past");
        }

        LocalTime opening = LocalTime.of(6, 0);
        LocalTime closing = LocalTime.of(23, 0);

        if (start.toLocalTime().isBefore(opening)
                || end.toLocalTime().isAfter(closing)) {
            throw new RuntimeException(
                    "Stations are open from 6 AM to 11 PM");
        }

        long hours = Duration.between(start, end).toMinutes() / 60;

        if (Duration.between(start, end).toMinutes() % 60 != 0
                || hours <= 0) {
            throw new RuntimeException(
                    "Booking duration must be one or more whole hours");
        }

        AppUser user = appUserRepo.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        Station station = stationRepo.findById(stationId)
                .orElseThrow(() ->
                        new RuntimeException("Station not found"));

        List<Booking> conflicts =
                bookingRepo
                .findByStationIdAndStartTimeLessThanAndEndTimeGreaterThanAndStatus(
                        stationId, end, start, "BOOKED");

        if (!conflicts.isEmpty()) {
            throw new RuntimeException(
                    "This station is already booked for that time");
        }

        double amount = hours * 200.0;

        if (user.getWalletBalance() < amount) {
            throw new RuntimeException(
                    "Insufficient wallet balance");
        }

        user.setWalletBalance(user.getWalletBalance() - amount);
        appUserRepo.save(user);

        booking.setAmount(amount);
        booking.setStatus("BOOKED");

        return bookingRepo.save(booking);
    }

    public List<Booking> getAllBookings() {
        return bookingRepo.findAll();
    }

    public List<Booking> getBookingsByUser(Integer userId) {
        return bookingRepo.findByUserId(userId);
    }
}

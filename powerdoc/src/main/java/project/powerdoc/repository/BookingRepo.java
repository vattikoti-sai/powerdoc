
package project.powerdoc.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import project.powerdoc.model.Booking;

public interface BookingRepo extends JpaRepository<Booking, Integer> {

    List<Booking> findByStationIdAndStartTimeLessThanAndEndTimeGreaterThanAndStatus(
            Integer stationId,
            LocalDateTime endTime,
            LocalDateTime startTime,
            String status
    );

    List<Booking> findByUserId(Integer userId);
}

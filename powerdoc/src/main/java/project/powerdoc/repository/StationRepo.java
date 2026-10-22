
package project.powerdoc.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import project.powerdoc.model.Station;

public interface StationRepo extends JpaRepository<Station, Integer> {
}

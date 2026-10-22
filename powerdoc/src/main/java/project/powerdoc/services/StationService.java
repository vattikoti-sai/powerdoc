
package project.powerdoc.services;

import java.util.List;

import org.springframework.stereotype.Service;

import project.powerdoc.model.Station;
import project.powerdoc.repository.StationRepo;

@Service
public class StationService {

    private final StationRepo stationRepo;

    public StationService(StationRepo stationRepo) {
        this.stationRepo = stationRepo;
    }

    public Station addStation(Station station) {
        return stationRepo.save(station);
    }

    public List<Station> getAllStations() {
        return stationRepo.findAll();
    }

    public Station getStationById(Integer id) {
        return stationRepo.findById(id).orElse(null);
    }

    public void deleteStation(Integer id) {
        stationRepo.deleteById(id);
    }
}

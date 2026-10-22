
package project.powerdoc.controller;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import project.powerdoc.model.Station;
import project.powerdoc.services.StationService;

@RestController
@RequestMapping("/stations")
@CrossOrigin(origins = "http://localhost:5173")
public class StationController {

    private final StationService stationService;

    public StationController(StationService stationService) {
        this.stationService = stationService;
    }

    @PostMapping
    public Station addStation(@RequestBody Station station) {
        return stationService.addStation(station);
    }

    @GetMapping
    public List<Station> getAllStations() {
        return stationService.getAllStations();
    }

    @GetMapping("/{id}")
    public Station getStationById(@PathVariable Integer id) {
        return stationService.getStationById(id);
    }

    @DeleteMapping("/{id}")
    public void deleteStation(@PathVariable Integer id) {
        stationService.deleteStation(id);
    }
}

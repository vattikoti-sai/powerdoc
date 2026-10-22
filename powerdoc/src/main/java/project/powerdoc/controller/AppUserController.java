
package project.powerdoc.controller;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import project.powerdoc.model.AppUser;
import project.powerdoc.services.AppUserService;

@RestController
@RequestMapping("/users")
@CrossOrigin(origins = "http://localhost:5173")
public class AppUserController {

    private final AppUserService appUserService;

    public AppUserController(AppUserService appUserService) {
        this.appUserService = appUserService;
    }

    // POST - Register user
    @PostMapping
    public AppUser registerUser(@RequestBody AppUser user) {
        return appUserService.registerUser(user);
    }

    // GET - Get all users
    @GetMapping
    public List<AppUser> getAllUsers() {
        return appUserService.getAllUsers();
    }

    // GET - Get user by ID
    @GetMapping("/{id}")
    public AppUser getUserById(@PathVariable Integer id) {
        return appUserService.getUserById(id);
    }
}


package project.powerdoc.services;

import java.util.List;

import org.springframework.stereotype.Service;

import project.powerdoc.model.AppUser;
import project.powerdoc.repository.AppUserRepo;

@Service
public class AppUserService {

    private final AppUserRepo appUserRepo;

    public AppUserService(AppUserRepo appUserRepo) {
        this.appUserRepo = appUserRepo;
    }

    public AppUser registerUser(AppUser user) {

        if (appUserRepo.existsByMobile(user.getMobile())) {
            throw new RuntimeException("Mobile number already registered");
        }

        // Always start with ₹1000; don't accept a client-supplied balance.
        user.setWalletBalance(1000.0);

        return appUserRepo.save(user);
    }

    public List<AppUser> getAllUsers() {
        return appUserRepo.findAll();
    }

    public AppUser getUserById(Integer id) {
        return appUserRepo.findById(id).orElse(null);
    }

    public AppUser getUserByMobile(String mobile) {
        return appUserRepo.findByMobile(mobile).orElse(null);
    }
}

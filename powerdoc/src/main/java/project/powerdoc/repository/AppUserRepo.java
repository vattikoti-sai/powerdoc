
package project.powerdoc.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import project.powerdoc.model.AppUser;

public interface AppUserRepo extends JpaRepository<AppUser, Integer> {

    Optional<AppUser> findByMobile(String mobile);

    boolean existsByMobile(String mobile);
}

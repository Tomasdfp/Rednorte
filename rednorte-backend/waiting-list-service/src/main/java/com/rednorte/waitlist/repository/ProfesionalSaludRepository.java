package com.rednorte.waitlist.repository;

import com.rednorte.waitlist.model.ProfesionalSalud;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ProfesionalSaludRepository extends JpaRepository<ProfesionalSalud, Long> {
    Optional<ProfesionalSalud> findByRut(String rut);
}

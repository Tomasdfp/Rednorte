package com.rednorte.cancellation.repository;

import com.rednorte.cancellation.model.Cita;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CitaRepository extends JpaRepository<Cita, Long> {
    List<Cita> findByIdPaciente(Long idPaciente);
    List<Cita> findByIdProfesional(Long idProfesional);
}

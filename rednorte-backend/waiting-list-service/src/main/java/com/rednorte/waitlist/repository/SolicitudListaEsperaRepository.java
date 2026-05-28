package com.rednorte.waitlist.repository;

import com.rednorte.waitlist.model.SolicitudListaEspera;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SolicitudListaEsperaRepository extends JpaRepository<SolicitudListaEspera, Long> {
    List<SolicitudListaEspera> findByIdPaciente(Long idPaciente);
    List<SolicitudListaEspera> findByEspecialidadRequeridaAndEstado(String especialidadRequerida, String estado);
}

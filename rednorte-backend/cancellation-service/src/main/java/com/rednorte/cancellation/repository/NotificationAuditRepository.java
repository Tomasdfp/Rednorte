package com.rednorte.cancellation.repository;

import com.rednorte.cancellation.model.NotificationAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationAuditRepository extends JpaRepository<NotificationAudit, Long> {
    List<NotificationAudit> findByIdPaciente(Long idPaciente);
}

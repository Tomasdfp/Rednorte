package com.rednorte.cancellation.controller;

import com.rednorte.cancellation.model.Cita;
import com.rednorte.cancellation.model.ReasignacionLog;
import com.rednorte.cancellation.model.NotificationAudit;
import com.rednorte.cancellation.repository.CitaRepository;
import com.rednorte.cancellation.repository.ReasignacionLogRepository;
import com.rednorte.cancellation.repository.NotificationAuditRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class CancellationController {

    private final CitaRepository appointmentRepo;
    private final ReasignacionLogRepository logRepo;
    private final NotificationAuditRepository auditRepo;
    private final RestTemplate restTemplate = new RestTemplate();

    private static final String WAITLIST_URL = System.getenv("WAITLIST_SERVICE_URL") != null 
            ? System.getenv("WAITLIST_SERVICE_URL") 
            : "http://localhost:8081/api";
    private static final String BFF_URL = System.getenv("BFF_SERVICE_URL") != null 
            ? System.getenv("BFF_SERVICE_URL") 
            : "http://localhost:8080/api";

    public CancellationController(CitaRepository appointmentRepo, ReasignacionLogRepository logRepo, NotificationAuditRepository auditRepo) {
        this.appointmentRepo = appointmentRepo;
        this.logRepo = logRepo;
        this.auditRepo = auditRepo;
    }

    @GetMapping("/appointments")
    public List<Cita> getAllAppointments() {
        return appointmentRepo.findAll();
    }

    @GetMapping("/appointments/patient/{idPaciente}")
    public List<Cita> getPatientAppointments(@PathVariable Long idPaciente) {
        return appointmentRepo.findByIdPaciente(idPaciente);
    }

    @GetMapping("/appointments/doctor/{idProfesional}")
    public List<Cita> getDoctorAppointments(@PathVariable Long idProfesional) {
        return appointmentRepo.findByIdProfesional(idProfesional);
    }

    @PostMapping("/appointments/request")
    public ResponseEntity<?> requestAppointment(@RequestBody Cita request) {
        // Find if doctor is booked
        boolean isBooked = appointmentRepo.findAll().stream()
                .anyMatch(c -> c.getIdProfesional().equals(request.getIdProfesional()) &&
                        (c.getEstadoCita().equals("PROGRAMADA") || c.getEstadoCita().equals("CONFIRMADA")));

        if (!isBooked) {
            Long nextId = appointmentRepo.findAll().stream()
                    .mapToLong(Cita::getIdCita)
                    .max().orElse(300L) + 1;
            request.setIdCita(nextId);
            request.setEstadoCita("CONFIRMADA");
            Cita saved = appointmentRepo.save(request);
            
            // Notify BFF of appointments reset/reload
            notifyBffReset();

            Map<String, Object> response = new HashMap<>();
            response.put("status", "ASSIGNED");
            response.put("data", saved);
            return ResponseEntity.ok(response);
        } else {
            // Forward waitlist request details to Waitlist Service
            try {
                Map<String, Object> wlPayload = new HashMap<>();
                wlPayload.put("idPaciente", request.getIdPaciente());
                wlPayload.put("nivelGravedad", 3); // default gravity
                String specialty = getSpecialtyByDoctorId(request.getIdProfesional());
                wlPayload.put("especialidadRequerida", specialty);
                wlPayload.put("diagnosticoPreliminar", request.getObservaciones());
                wlPayload.put("comentariosMedicos", "Ingresado automáticamente por falta de cupo.");

                ResponseEntity<Map> wlRes = restTemplate.postForEntity(WAITLIST_URL + "/waitlist", wlPayload, Map.class);
                
                Map<String, Object> response = new HashMap<>();
                response.put("status", "WAITLIST");
                response.put("data", wlRes.getBody());
                return ResponseEntity.ok(response);
            } catch (Exception e) {
                return ResponseEntity.status(500).body("Error en comunicación con servicio de lista de espera: " + e.getMessage());
            }
        }
    }

    @PostMapping("/appointments/check-in/{id}")
    public ResponseEntity<?> checkInPatient(@PathVariable Long id) {
        Optional<Cita> apptOpt = appointmentRepo.findById(id);
        if (apptOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Cita appt = apptOpt.get();
        appt.setEstadoCita("PRESENTE");
        appointmentRepo.save(appt);

        // Fetch patient name from Waitlist service
        String patientName = "Paciente #" + appt.getIdPaciente();
        try {
            Map patient = restTemplate.getForObject(WAITLIST_URL + "/patients/" + appt.getIdPaciente(), Map.class);
            if (patient != null && patient.containsKey("nombreCompleto")) {
                patientName = (String) patient.get("nombreCompleto");
            }
        } catch (Exception e) {
            // ignore, use fallback
        }

        // Notify BFF of check-in
        try {
            Map<String, Object> notifyPayload = new HashMap<>();
            notifyPayload.put("type", "ARRIVED");
            notifyPayload.put("message", "¡Paciente ha llegado a recepción!");
            
            Map<String, Object> details = new HashMap<>();
            details.put("idCita", appt.getIdCita());
            details.put("idProfesional", appt.getIdProfesional());
            details.put("patientName", patientName);
            details.put("appointments", appointmentRepo.findAll());
            notifyPayload.put("details", details);

            restTemplate.postForEntity(BFF_URL + "/notifications/notify", notifyPayload, String.class);
        } catch (Exception e) {
            System.err.println("Error notifying BFF: " + e.getMessage());
        }

        return ResponseEntity.ok(appt);
    }

    @PostMapping("/appointments/cancel/{id}")
    public ResponseEntity<?> cancelAppointment(@PathVariable Long id, @RequestParam String reason, @RequestParam String specialty) {
        Optional<Cita> apptOpt = appointmentRepo.findById(id);
        if (apptOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Cita originalCita = apptOpt.get();
        originalCita.setEstadoCita("CANCELADA");
        originalCita.setMotivoCancelacion(reason);
        appointmentRepo.save(originalCita);

        // Get patient original name
        String patientOriginalName = "Paciente #" + originalCita.getIdPaciente();
        try {
            Map patient = restTemplate.getForObject(WAITLIST_URL + "/patients/" + originalCita.getIdPaciente(), Map.class);
            if (patient != null && patient.containsKey("nombreCompleto")) {
                patientOriginalName = (String) patient.get("nombreCompleto");
            }
        } catch (Exception e) {
            // ignore
        }

        // 2. Query Waitlist Service for highest priority candidate
        Map highestPriorityRequest = null;
        try {
            highestPriorityRequest = restTemplate.getForObject(
                    WAITLIST_URL + "/waitlist/highest-priority?specialty=" + specialty, Map.class);
        } catch (Exception e) {
            System.out.println("No high priority waitlist candidate found: " + e.getMessage());
        }

        if (highestPriorityRequest != null) {
            // 3. Extract request details
            Number idSolicitudNum = (Number) highestPriorityRequest.get("idSolicitud");
            Number idPacienteNum = (Number) highestPriorityRequest.get("idPaciente");
            Long idSolicitud = idSolicitudNum.longValue();
            Long idPaciente = idPacienteNum.longValue();

            // Fetch candidate patient details
            String candidateName = "Paciente #" + idPaciente;
            String candidatePhone = "+56999999999";
            String candidateEmail = "paciente@email.cl";
            try {
                Map patient = restTemplate.getForObject(WAITLIST_URL + "/patients/" + idPaciente, Map.class);
                if (patient != null) {
                    if (patient.containsKey("nombreCompleto")) candidateName = (String) patient.get("nombreCompleto");
                    if (patient.containsKey("telefono")) candidatePhone = (String) patient.get("telefono");
                    if (patient.containsKey("email")) candidateEmail = (String) patient.get("email");
                }
            } catch (Exception e) {
                // ignore
            }

            // 4. Update waitlist candidate status to ASIGNADA
            try {
                restTemplate.put(WAITLIST_URL + "/waitlist/" + idSolicitud + "/status?status=ASIGNADA", null);
            } catch (Exception e) {
                System.err.println("Error updating waitlist status: " + e.getMessage());
            }

            // 5. Create new appointment for the waitlist patient
            Long newCitaId = appointmentRepo.findAll().stream()
                    .mapToLong(Cita::getIdCita)
                    .max().orElse(300L) + 1;
            
            Cita newCita = new Cita(
                    newCitaId,
                    idPaciente,
                    originalCita.getIdProfesional(),
                    originalCita.getFechaHoraProgramada(),
                    originalCita.getDuracionEstimada(),
                    "PROGRAMADA",
                    "Reasignación automática debido a cancelación de " + patientOriginalName
            );
            appointmentRepo.save(newCita);

            // 6. Log reassignment transaction
            int processingTime = new Random().nextInt(70) + 60; // 60-130ms simulation
            ReasignacionLog logEntry = new ReasignacionLog(
                    LocalDateTime.now().toString(),
                    id,
                    newCitaId,
                    patientOriginalName,
                    candidateName,
                    specialty,
                    reason,
                    "Priority-Severity Matrix",
                    processingTime
            );
            logRepo.save(logEntry);

            // 7. Inform/Notify Patient (Audit simulated SMS & Email)
            String smsMessage = "Estimado(a) " + candidateName + ", se le ha asignado una hora en " + specialty +
                    " para el " + originalCita.getFechaHoraProgramada().replace("T", " ") + " hrs debido a una liberación de cupo. RedNorte.";
            String emailMessage = "Estimado(a) " + candidateName + ",\n\nLe informamos que se ha liberado una vacante en la especialidad de " + specialty +
                    " y ha sido asignada a su ficha debido a su prioridad en la lista de espera.\n\nFecha y Hora: " +
                    originalCita.getFechaHoraProgramada().replace("T", " ") + " hrs.\nProfesional: " + getDoctorNameById(originalCita.getIdProfesional()) + "\n\nSaludos,\nEquipo Clínico RedNorte.";

            // Save to NotificationAudit table
            auditRepo.save(new NotificationAudit(idPaciente, candidateName, "SMS", candidatePhone, smsMessage, LocalDateTime.now().toString()));
            auditRepo.save(new NotificationAudit(idPaciente, candidateName, "EMAIL", candidateEmail, emailMessage, LocalDateTime.now().toString()));

            // Print to console (Mock service logger)
            System.out.println("\n--- [NOTIFICATION SIMULATOR] ---");
            System.out.println("SMS SENT TO: " + candidatePhone + " | Message: " + smsMessage);
            System.out.println("EMAIL SENT TO: " + candidateEmail + " | Subject: Asignación de Hora Médica RedNorte");
            System.out.println("--------------------------------\n");

            // 8. Post notification to BFF
            try {
                Map<String, Object> notifyPayload = new HashMap<>();
                notifyPayload.put("type", "REASSIGNED");
                notifyPayload.put("message", "¡Cita de especialidad reasignada automáticamente!");
                
                Map<String, Object> details = new HashMap<>();
                details.put("log", logEntry);
                details.put("newCita", newCita);
                details.put("appointments", appointmentRepo.findAll());
                details.put("logs", logRepo.findAll());
                notifyPayload.put("details", details);

                restTemplate.postForEntity(BFF_URL + "/notifications/notify", notifyPayload, String.class);
            } catch (Exception e) {
                System.err.println("Error notifying BFF of reassignment: " + e.getMessage());
            }

        } else {
            // No candidate found, just notify BFF of cancellation
            try {
                Map<String, Object> notifyPayload = new HashMap<>();
                notifyPayload.put("type", "CANCELLED");
                notifyPayload.put("message", "Cita cancelada con éxito.");
                
                Map<String, Object> details = new HashMap<>();
                details.put("canceledCitaId", id);
                details.put("appointments", appointmentRepo.findAll());
                details.put("logs", logRepo.findAll());
                notifyPayload.put("details", details);

                restTemplate.postForEntity(BFF_URL + "/notifications/notify", notifyPayload, String.class);
            } catch (Exception e) {
                System.err.println("Error notifying BFF of cancellation: " + e.getMessage());
            }
        }

        return ResponseEntity.ok(originalCita);
    }

    @GetMapping("/reassignments")
    public List<ReasignacionLog> getReassignments() {
        return logRepo.findAll();
    }

    @GetMapping("/notifications/patient/{idPaciente}")
    public List<NotificationAudit> getPatientNotifications(@PathVariable Long idPaciente) {
        return auditRepo.findByIdPaciente(idPaciente);
    }

    @PostMapping("/appointments/reset")
    public ResponseEntity<?> resetAppointments() {
        appointmentRepo.deleteAll();
        logRepo.deleteAll();
        auditRepo.deleteAll();
        
        appointmentRepo.save(new Cita(301L, 102L, 201L, "2026-05-25T10:00:00", 30, "PROGRAMADA", "Electrocardiograma de esfuerzo anual."));
        appointmentRepo.save(new Cita(302L, 104L, 202L, "2026-05-26T15:30:00", 30, "CONFIRMADA", "Control post-operatorio de fractura de muñeca."));
        appointmentRepo.save(new Cita(303L, 101L, 203L, "2026-05-28T11:30:00", 20, "PROGRAMADA", "Fondo de ojo por sospecha de glaucoma."));
        
        // Reset Waitlist Service as well
        try {
            restTemplate.postForEntity(WAITLIST_URL + "/waitlist/reset", null, String.class);
        } catch (Exception e) {
            // ignore
        }
        
        notifyBffReset();

        Map<String, String> response = new HashMap<>();
        response.put("message", "Appointments database reset successfully");
        return ResponseEntity.ok(response);
    }

    private void notifyBffReset() {
        try {
            Map<String, Object> resetPayload = new HashMap<>();
            resetPayload.put("type", "APPOINTMENTS_RESET");
            resetPayload.put("message", "Reset");
            
            Map<String, Object> details = new HashMap<>();
            details.put("appointments", appointmentRepo.findAll());
            details.put("logs", logRepo.findAll());
            resetPayload.put("details", details);

            restTemplate.postForEntity(BFF_URL + "/notifications/notify", resetPayload, String.class);
        } catch (Exception e) {
            // ignore
        }
    }

    private String getSpecialtyByDoctorId(Long idProfesional) {
        if (idProfesional == 201) return "Cardiología";
        if (idProfesional == 202) return "Traumatología";
        return "Oftalmología";
    }

    private String getDoctorNameById(Long idProfesional) {
        if (idProfesional == 201) return "Dra. Karen Fuentealba Andrade";
        if (idProfesional == 202) return "Dr. Tomás Del Fierro Pardo";
        return "Dra. María José Arancibia";
    }
}

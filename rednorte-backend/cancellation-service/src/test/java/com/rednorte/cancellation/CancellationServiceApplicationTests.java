package com.rednorte.cancellation;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rednorte.cancellation.controller.CancellationController;
import com.rednorte.cancellation.model.Cita;
import com.rednorte.cancellation.model.NotificationAudit;
import com.rednorte.cancellation.model.ReasignacionLog;
import com.rednorte.cancellation.repository.CitaRepository;
import com.rednorte.cancellation.repository.NotificationAuditRepository;
import com.rednorte.cancellation.repository.ReasignacionLogRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CancellationServiceApplicationTests {

    @Autowired
    private CancellationController controller;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CitaRepository appointmentRepo;

    @Autowired
    private ReasignacionLogRepository logRepo;

    @Autowired
    private NotificationAuditRepository auditRepo;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void contextLoads() {
        assertThat(controller).isNotNull();
    }

    @Test
    void testGetAppointments() throws Exception {
        mockMvc.perform(get("/api/appointments")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3));
    }

    @Test
    void testGetPatientAppointments() throws Exception {
        mockMvc.perform(get("/api/appointments/patient/102"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].idCita").value(301));
    }

    @Test
    void testGetDoctorAppointments() throws Exception {
        mockMvc.perform(get("/api/appointments/doctor/201"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].idCita").value(301));
    }

    @Test
    void testRequestAppointmentDoctorAvailable() throws Exception {
        Cita newCita = new Cita(null, 105L, 999L, "2026-06-20T10:00:00", 30, "PROGRAMADA", "New request");
        mockMvc.perform(post("/api/appointments/request")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newCita)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ASSIGNED"))
                .andExpect(jsonPath("$.data.idCita").exists());
    }

    @Test
    void testRequestAppointmentDoctorBooked() throws Exception {
        Cita newCita = new Cita(null, 105L, 203L, "2026-06-20T10:00:00", 30, "PROGRAMADA", "New request");
        // Doctor 203 is already booked. Waitlist service is offline in tests, so it returns 500
        mockMvc.perform(post("/api/appointments/request")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newCita)))
                .andExpect(status().isInternalServerError());
    }



    @Test
    void testCheckInPatient() throws Exception {
        // Find appointment 301
        Cita cita = appointmentRepo.findById(301L).orElseThrow();
        assertThat(cita.getEstadoCita()).isEqualTo("PROGRAMADA");

        // Perform check-in (Waitlist & BFF offline, but handled gracefully)
        mockMvc.perform(post("/api/appointments/check-in/301")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estadoCita").value("PRESENTE"));

        Cita updated = appointmentRepo.findById(301L).orElseThrow();
        assertThat(updated.getEstadoCita()).isEqualTo("PRESENTE");
    }

    @Test
    void testCheckInPatientNotFound() throws Exception {
        mockMvc.perform(post("/api/appointments/check-in/99999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void testCancelAppointment() throws Exception {
        // Cancel appointment 302 (Waitlist & BFF offline, will fall back to normal cancel flow)
        mockMvc.perform(post("/api/appointments/cancel/302")
                .param("reason", "Patient cannot make it")
                .param("specialty", "Traumatología"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estadoCita").value("CANCELADA"))
                .andExpect(jsonPath("$.motivoCancelacion").value("Patient cannot make it"));
    }

    @Test
    void testCancelAppointmentNotFound() throws Exception {
        mockMvc.perform(post("/api/appointments/cancel/99999")
                .param("reason", "None")
                .param("specialty", "None"))
                .andExpect(status().isNotFound());
    }

    @Test
    void testGetReassignments() throws Exception {
        mockMvc.perform(get("/api/reassignments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void testGetPatientNotifications() throws Exception {
        mockMvc.perform(get("/api/notifications/patient/102"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void testResetAppointments() throws Exception {
        mockMvc.perform(post("/api/appointments/reset"))
                .andExpect(status().isOk());
    }

    @Test
    void testModels() {
        Cita c = new Cita();
        c.setIdCita(10L);
        c.setIdPaciente(11L);
        c.setIdProfesional(12L);
        c.setFechaHoraProgramada("2026-06-01T09:00:00");
        c.setDuracionEstimada(45);
        c.setEstadoCita("PROGRAMADA");
        c.setMotivoCancelacion("Motivo");
        c.setObservaciones("Obs");

        assertThat(c.getIdCita()).isEqualTo(10L);
        assertThat(c.getIdPaciente()).isEqualTo(11L);
        assertThat(c.getIdProfesional()).isEqualTo(12L);
        assertThat(c.getFechaHoraProgramada()).isEqualTo("2026-06-01T09:00:00");
        assertThat(c.getDuracionEstimada()).isEqualTo(45);
        assertThat(c.getEstadoCita()).isEqualTo("PROGRAMADA");
        assertThat(c.getMotivoCancelacion()).isEqualTo("Motivo");
        assertThat(c.getObservaciones()).isEqualTo("Obs");

        ReasignacionLog log = new ReasignacionLog();
        log.setIdLog(1L);
        log.setFechaEvento("2026-06-01T09:00:00");
        log.setCitaOriginal(101L);
        log.setCitaReasignada(102L);
        log.setNombrePacienteOriginal("Orig");
        log.setNombrePacienteReasignado("Reas");
        log.setEspecialidad("Esp");
        log.setMotivo("Mot");
        log.setAlgoritmoUsado("Algo");
        log.setTiempoProcesamiento(50);

        assertThat(log.getIdLog()).isEqualTo(1L);
        assertThat(log.getFechaEvento()).isEqualTo("2026-06-01T09:00:00");
        assertThat(log.getCitaOriginal()).isEqualTo(101L);
        assertThat(log.getCitaReasignada()).isEqualTo(102L);
        assertThat(log.getNombrePacienteOriginal()).isEqualTo("Orig");
        assertThat(log.getNombrePacienteReasignado()).isEqualTo("Reas");
        assertThat(log.getEspecialidad()).isEqualTo("Esp");
        assertThat(log.getMotivo()).isEqualTo("Mot");
        assertThat(log.getAlgoritmoUsado()).isEqualTo("Algo");
        assertThat(log.getTiempoProcesamiento()).isEqualTo(50);

        NotificationAudit audit = new NotificationAudit();
        audit.setIdNotification(5L);
        audit.setIdPaciente(15L);
        audit.setNombrePaciente("Name");
        audit.setTipoCanal("SMS");
        audit.setDestinatario("Dest");
        audit.setMensaje("Msg");
        audit.setFechaEnvio("2026-06-01T09:00:00");

        assertThat(audit.getIdNotification()).isEqualTo(5L);
        assertThat(audit.getIdPaciente()).isEqualTo(15L);
        assertThat(audit.getNombrePaciente()).isEqualTo("Name");
        assertThat(audit.getTipoCanal()).isEqualTo("SMS");
        assertThat(audit.getDestinatario()).isEqualTo("Dest");
        assertThat(audit.getMensaje()).isEqualTo("Msg");
        assertThat(audit.getFechaEnvio()).isEqualTo("2026-06-01T09:00:00");
    }
}



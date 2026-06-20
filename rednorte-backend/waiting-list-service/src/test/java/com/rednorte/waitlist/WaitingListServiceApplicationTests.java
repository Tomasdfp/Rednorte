package com.rednorte.waitlist;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rednorte.waitlist.controller.WaitlistController;
import com.rednorte.waitlist.model.Paciente;
import com.rednorte.waitlist.model.ProfesionalSalud;
import com.rednorte.waitlist.model.SolicitudListaEspera;
import com.rednorte.waitlist.repository.PacienteRepository;
import com.rednorte.waitlist.repository.ProfesionalSaludRepository;
import com.rednorte.waitlist.repository.SolicitudListaEsperaRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.Optional;

import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class WaitingListServiceApplicationTests {

    @Autowired
    private WaitlistController controller;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PacienteRepository patientRepo;

    @Autowired
    private ProfesionalSaludRepository doctorRepo;

    @Autowired
    private SolicitudListaEsperaRepository waitlistRepo;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void contextLoads() {
        assertThat(controller).isNotNull();
    }

    @Test
    void testPriorityCalculationForElderly() throws Exception {
        int birthYear = LocalDate.now().getYear() - 70;
        Paciente patient = new Paciente(999L, "19.345.678-2", "Test Elderly", birthYear + "-01-01", "+56999999999", "elderly@test.com", "Test Addr", "FONASA");
        patientRepo.save(patient);

        SolicitudListaEspera request = new SolicitudListaEspera();
        request.setIdPaciente(999L);
        request.setNivelGravedad(3);
        request.setEspecialidadRequerida("Cardiología");
        request.setDiagnosticoPreliminar("Hipertensión");
        request.setComentariosMedicos("Comentario de prueba");

        mockMvc.perform(post("/api/waitlist")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.prioridadCalculada").value(65))
                .andExpect(jsonPath("$.estado").value("PENDIENTE"));
    }

    @Test
    void testPriorityCalculationForChild() throws Exception {
        int birthYear = LocalDate.now().getYear() - 3;
        Paciente patient = new Paciente(888L, "12.345.678-5", "Test Child", birthYear + "-01-01", "+56988888888", "child@test.com", "Test Addr", "ISAPRE");
        patientRepo.save(patient);

        SolicitudListaEspera request = new SolicitudListaEspera();
        request.setIdPaciente(888L);
        request.setNivelGravedad(2);
        request.setEspecialidadRequerida("Pediatría");
        request.setDiagnosticoPreliminar("Fiebre");
        request.setComentariosMedicos("Pediatric request");

        mockMvc.perform(post("/api/waitlist")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.prioridadCalculada").value(40)); // 2 * 15 = 30 + 10 = 40
    }

    @Test
    void testPriorityCalculationForRegular() throws Exception {
        int birthYear = LocalDate.now().getYear() - 30;
        Paciente patient = new Paciente(777L, "15.932.184-3", "Test Regular", birthYear + "-01-01", "+56977777777", "regular@test.com", "Test Addr", "FONASA");
        patientRepo.save(patient);

        SolicitudListaEspera request = new SolicitudListaEspera();
        request.setIdPaciente(777L);
        request.setNivelGravedad(4);
        request.setEspecialidadRequerida("Oftalmología");
        request.setDiagnosticoPreliminar("Miopía");
        request.setComentariosMedicos("Regular check");

        mockMvc.perform(post("/api/waitlist")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.prioridadCalculada").value(60)); // 4 * 15 = 60 + 0 = 60
    }

    @Test
    void testGetAllPatients() throws Exception {
        mockMvc.perform(get("/api/patients"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void testGetPatientByRut() throws Exception {
        Paciente patient = new Paciente(701L, "18.342.185-9", "Rut Test", "1990-05-05", "+56912345678", "rut@test.com", "Address", "FONASA");
        patientRepo.save(patient);

        mockMvc.perform(get("/api/patients/rut/18.342.185-9"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombreCompleto").value("Rut Test"));

        mockMvc.perform(get("/api/patients/rut/99.999.999-9"))
                .andExpect(status().isNotFound());
    }

    @Test
    void testGetPatientById() throws Exception {
        Paciente patient = new Paciente(702L, "16.143.682-8", "Id Test", "1992-05-05", "+56912345678", "id@test.com", "Address", "FONASA");
        patientRepo.save(patient);

        mockMvc.perform(get("/api/patients/702"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombreCompleto").value("Id Test"));

        mockMvc.perform(get("/api/patients/99999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void testCreatePatient() throws Exception {
        Paciente validPatient = new Paciente(null, "14.932.184-5", "New Valid Patient", "1995-10-10", "+56955555555", "valid@test.com", "Address", "FONASA");
        mockMvc.perform(post("/api/patients")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validPatient)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombreCompleto").value("New Valid Patient"))
                .andExpect(jsonPath("$.idPaciente").exists());

        Paciente invalidPatient = new Paciente(null, "14.932.184-9", "New Invalid Patient", "1995-10-10", "+56955555555", "invalid@test.com", "Address", "FONASA");
        mockMvc.perform(post("/api/patients")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidPatient)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testUpdateExistingPatient() throws Exception {
        // Save initial patient
        Paciente patient = new Paciente(401L, "16.342.185-2", "Alejandra Reyes Castro", "1965-04-12", "+56 9 8765 4321", "alejandra.reyes@email.cl", "Address", "FONASA");
        patientRepo.save(patient);

        // Update details (same RUT, different phone)
        Paciente update = new Paciente(null, "16.342.185-2", "Alejandra Reyes Castro", "1965-04-12", "+56 9 9999 9999", "alejandra.reyes@email.cl", "Address", "FONASA");
        
        mockMvc.perform(post("/api/patients")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idPaciente").value(401L))
                .andExpect(jsonPath("$.telefono").value("+56 9 9999 9999"));

        // Verify in DB that size is still 1 (not duplicated)
        Optional<Paciente> dbPatient = patientRepo.findById(401L);
        assertThat(dbPatient).isPresent();
        assertThat(dbPatient.get().getTelefono()).isEqualTo("+56 9 9999 9999");
    }

    @Test
    void testGetAllDoctors() throws Exception {
        mockMvc.perform(get("/api/doctors"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void testCreateDoctor() throws Exception {
        ProfesionalSalud validDoc = new ProfesionalSalud(null, "13.432.195-4", "Dr. Valid", "Cardiología", "123456", "08:00 - 17:00", true);
        mockMvc.perform(post("/api/doctors")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validDoc)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombreCompleto").value("Dr. Valid"))
                .andExpect(jsonPath("$.idProfesional").exists());

        ProfesionalSalud invalidDoc = new ProfesionalSalud(null, "13.432.195-9", "Dr. Invalid", "Cardiología", "123456", "08:00 - 17:00", true);
        mockMvc.perform(post("/api/doctors")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidDoc)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testUpdateExistingDoctor() throws Exception {
        // Save initial doctor
        ProfesionalSalud doc = new ProfesionalSalud(501L, "15.342.195-1", "Dra. Karen Fuentealba Andrade", "Cardiología", "34891-C", "Lunes a Viernes 09:00 - 13:00", true);
        doctorRepo.save(doc);

        // Update details (same RUT, different hours)
        ProfesionalSalud update = new ProfesionalSalud(null, "15.342.195-1", "Dra. Karen Fuentealba Andrade", "Cardiología", "34891-C", "Lunes a Viernes 10:00 - 18:00", true);
        
        mockMvc.perform(post("/api/doctors")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idProfesional").value(501L))
                .andExpect(jsonPath("$.horarioAtencion").value("Lunes a Viernes 10:00 - 18:00"));

        // Verify in DB that size is still 1 (not duplicated)
        Optional<ProfesionalSalud> dbDoc = doctorRepo.findById(501L);
        assertThat(dbDoc).isPresent();
        assertThat(dbDoc.get().getHorarioAtencion()).isEqualTo("Lunes a Viernes 10:00 - 18:00");
    }

    @Test
    void testGetWaitlist() throws Exception {
        mockMvc.perform(get("/api/waitlist"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void testAddWaitlistRequestPatientNotFound() throws Exception {
        SolicitudListaEspera request = new SolicitudListaEspera();
        request.setIdPaciente(99999L);
        request.setNivelGravedad(3);
        request.setEspecialidadRequerida("Cardiología");

        mockMvc.perform(post("/api/waitlist")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testGetHighestPrioritySpecialty() throws Exception {
        // Clear waitlist first
        waitlistRepo.deleteAll();

        // 1. Get when nothing exists
        mockMvc.perform(get("/api/waitlist/highest-priority").param("specialty", "Neurología"))
                .andExpect(status().isNotFound());

        // 2. Add two requests for Neurología
        Paciente patient1 = new Paciente(601L, "10.342.185-3", "Patient 1", "1990-01-01", "1234", "1@test.com", "Addr", "FONASA");
        Paciente patient2 = new Paciente(602L, "11.342.185-1", "Patient 2", "1992-01-01", "1234", "2@test.com", "Addr", "FONASA");
        patientRepo.save(patient1);
        patientRepo.save(patient2);

        SolicitudListaEspera req1 = new SolicitudListaEspera(601L, LocalDate.now().toString(), 2, "Neurología", "Diag 1", "PENDIENTE", 30, "No comments");
        SolicitudListaEspera req2 = new SolicitudListaEspera(602L, LocalDate.now().toString(), 4, "Neurología", "Diag 2", "PENDIENTE", 60, "No comments");
        waitlistRepo.save(req1);
        waitlistRepo.save(req2);

        mockMvc.perform(get("/api/waitlist/highest-priority").param("specialty", "Neurología"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idPaciente").value(602L))
                .andExpect(jsonPath("$.prioridadCalculada").value(60));
    }

    @Test
    void testUpdateStatus() throws Exception {
        Paciente patient = new Paciente(650L, "09.342.185-K", "Patient Update", "1990-01-01", "123", "u@test.com", "Addr", "FONASA");
        patientRepo.save(patient);

        SolicitudListaEspera req = new SolicitudListaEspera(650L, LocalDate.now().toString(), 2, "Dermatología", "Diag", "PENDIENTE", 30, "Comments");
        req = waitlistRepo.save(req);

        mockMvc.perform(put("/api/waitlist/" + req.getIdSolicitud() + "/status").param("status", "ATENDIDO"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("ATENDIDO"));

        mockMvc.perform(put("/api/waitlist/99999/status").param("status", "ATENDIDO"))
                .andExpect(status().isNotFound());
    }

    @Test
    void testResetWaitlist() throws Exception {
        mockMvc.perform(post("/api/waitlist/reset"))
                .andExpect(status().isOk());
    }

    @Test
    void testGetPatientTimeline() throws Exception {
        Paciente patient = new Paciente(660L, "08.342.185-1", "Timeline Patient", "1990-01-01", "123", "t@test.com", "Addr", "FONASA");
        patientRepo.save(patient);

        mockMvc.perform(get("/api/patients/timeline/08.342.185-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.patient.nombreCompleto").value("Timeline Patient"))
                .andExpect(jsonPath("$.requests").isArray());

        mockMvc.perform(get("/api/patients/timeline/99.999.999-9"))
                .andExpect(status().isNotFound());
    }

    @Test
    void testModelGettersSetters() {
        Paciente p = new Paciente();
        p.setIdPaciente(1L);
        p.setRut("1.111.111-1");
        p.setNombreCompleto("Name");
        p.setFechaNacimiento("2000-01-01");
        p.setTelefono("123");
        p.setEmail("a@b.com");
        p.setDireccion("Addr");
        p.setPrevision("Prevision");

        assertThat(p.getIdPaciente()).isEqualTo(1L);
        assertThat(p.getRut()).isEqualTo("1.111.111-1");
        assertThat(p.getNombreCompleto()).isEqualTo("Name");
        assertThat(p.getFechaNacimiento()).isEqualTo("2000-01-01");
        assertThat(p.getTelefono()).isEqualTo("123");
        assertThat(p.getEmail()).isEqualTo("a@b.com");
        assertThat(p.getDireccion()).isEqualTo("Addr");
        assertThat(p.getPrevision()).isEqualTo("Prevision");

        ProfesionalSalud d = new ProfesionalSalud();
        d.setIdProfesional(2L);
        d.setRut("2.222.222-2");
        d.setNombreCompleto("Doc");
        d.setEspecialidad("Specialty");
        d.setRegistroNacional("Reg");
        d.setHorarioAtencion("Hours");
        d.setDisponible(false);

        assertThat(d.getIdProfesional()).isEqualTo(2L);
        assertThat(d.getRut()).isEqualTo("2.222.222-2");
        assertThat(d.getNombreCompleto()).isEqualTo("Doc");
        assertThat(d.getEspecialidad()).isEqualTo("Specialty");
        assertThat(d.getRegistroNacional()).isEqualTo("Reg");
        assertThat(d.getHorarioAtencion()).isEqualTo("Hours");
        assertThat(d.isDisponible()).isFalse();

        SolicitudListaEspera s = new SolicitudListaEspera();
        s.setIdSolicitud(3L);
        s.setIdPaciente(10L);
        s.setFechaSolicitud("2026-06-01");
        s.setNivelGravedad(5);
        s.setEspecialidadRequerida("Esp");
        s.setDiagnosticoPreliminar("Diag");
        s.setEstado("PENDIENTE");
        s.setPrioridadCalculada(80);
        s.setComentariosMedicos("Comm");

        assertThat(s.getIdSolicitud()).isEqualTo(3L);
        assertThat(s.getIdPaciente()).isEqualTo(10L);
        assertThat(s.getFechaSolicitud()).isEqualTo("2026-06-01");
        assertThat(s.getNivelGravedad()).isEqualTo(5);
        assertThat(s.getEspecialidadRequerida()).isEqualTo("Esp");
        assertThat(s.getDiagnosticoPreliminar()).isEqualTo("Diag");
        assertThat(s.getEstado()).isEqualTo("PENDIENTE");
        assertThat(s.getPrioridadCalculada()).isEqualTo(80);
        assertThat(s.getComentariosMedicos()).isEqualTo("Comm");
    }
}



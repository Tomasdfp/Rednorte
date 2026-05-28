package com.rednorte.waitlist;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rednorte.waitlist.controller.WaitlistController;
import com.rednorte.waitlist.model.Paciente;
import com.rednorte.waitlist.model.SolicitudListaEspera;
import com.rednorte.waitlist.repository.PacienteRepository;
import com.rednorte.waitlist.repository.SolicitudListaEsperaRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

@SpringBootTest
@AutoConfigureMockMvc
class WaitingListServiceApplicationTests {

    @Autowired
    private WaitlistController controller;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PacienteRepository patientRepo;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void contextLoads() {
        assertThat(controller).isNotNull();
    }

    @Test
    void testPriorityCalculationForElderly() throws Exception {
        // Create an elderly patient (e.g. 70 years old in current year)
        int birthYear = LocalDate.now().getYear() - 70;
        Paciente patient = new Paciente(999L, "99.999.999-9", "Test Elderly", birthYear + "-01-01", "+56999999999", "elderly@test.com", "Test Addr", "FONASA");
        patientRepo.save(patient);

        // Gravity level 3, base priority = 3 * 15 = 45. Elderly bonus = 20. Total expected = 65.
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
}


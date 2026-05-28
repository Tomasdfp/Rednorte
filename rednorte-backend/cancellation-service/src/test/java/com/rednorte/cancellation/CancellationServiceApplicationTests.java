package com.rednorte.cancellation;

import com.rednorte.cancellation.controller.CancellationController;
import com.rednorte.cancellation.model.Cita;
import com.rednorte.cancellation.repository.CitaRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

@SpringBootTest
@AutoConfigureMockMvc
class CancellationServiceApplicationTests {

    @Autowired
    private CancellationController controller;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CitaRepository appointmentRepo;

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
    void testCheckInPatient() throws Exception {
        // Find appointment 301 (loaded by DataLoader)
        Cita cita = appointmentRepo.findById(301L).orElseThrow();
        assertThat(cita.getEstadoCita()).isEqualTo("PROGRAMADA");

        // Perform check-in
        mockMvc.perform(post("/api/appointments/check-in/301")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estadoCita").value("PRESENTE"));

        // Verify database updated
        Cita updated = appointmentRepo.findById(301L).orElseThrow();
        assertThat(updated.getEstadoCita()).isEqualTo("PRESENTE");
    }
}


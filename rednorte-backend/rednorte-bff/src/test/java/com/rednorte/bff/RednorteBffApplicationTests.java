package com.rednorte.bff;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rednorte.bff.controller.BffController;
import com.rednorte.bff.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

@SpringBootTest
@AutoConfigureMockMvc
class RednorteBffApplicationTests {

    @Autowired
    private BffController controller;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RestTemplate restTemplate;

    @Test
    void contextLoads() {
        assertThat(controller).isNotNull();
    }

    @Test
    void testNotificationStreamEndpoint() throws Exception {
        // SSE endpoint is permitted to all, but will look for token inside filter if query param provided
        MvcResult mvcResult = mockMvc.perform(get("/api/notifications/stream"))
                .andExpect(status().isOk())
                .andReturn();

        String content = mvcResult.getResponse().getContentAsString();
        assertThat(content).contains("event:CONNECT");
        assertThat(content).contains("data:Connected successfully to RedNorte Real-Time Stream");
    }

    @Test
    void testUnauthorizedEndpointAccess() throws Exception {
        // Accessing protected endpoint without token should return 403 Forbidden
        mockMvc.perform(get("/api/appointments"))
                .andExpect(status().isForbidden());
    }

    @Test
    void testLoginReceptionistSuccess() throws Exception {
        Map<String, String> credentials = new HashMap<>();
        credentials.put("role", "receptionist");
        credentials.put("adminUser", "recep");
        credentials.put("adminPass", "recep123");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(credentials)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.role").value("receptionist"))
                .andExpect(jsonPath("$.data.name").value("Recepción RedNorte"));
    }

    @Test
    void testLoginReceptionistFailure() throws Exception {
        Map<String, String> credentials = new HashMap<>();
        credentials.put("role", "receptionist");
        credentials.put("adminUser", "recep");
        credentials.put("adminPass", "wrongpassword");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(credentials)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testLoginInvalidRole() throws Exception {
        Map<String, String> credentials = new HashMap<>();
        credentials.put("role", "invalid_role");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(credentials)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testAuthorizedEndpointAccessWithToken() throws Exception {
        // Generate valid token for receptionist
        String token = jwtUtil.generateToken("recep", "ROLE_RECEPTIONIST");

        // Request should pass Spring Security, but fail with 500 because the cancellation service is not running
        mockMvc.perform(get("/api/appointments")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void testSSEStreamWithQueryParamToken() throws Exception {
        // Generate valid token for patient
        String token = jwtUtil.generateToken("12.345.678-9", "ROLE_PATIENT");

        MvcResult mvcResult = mockMvc.perform(get("/api/notifications/stream")
                .param("token", token))
                .andExpect(status().isOk())
                .andReturn();

        String content = mvcResult.getResponse().getContentAsString();
        assertThat(content).contains("event:CONNECT");
    }

    @Test
    void testProxyPostPushNotification() throws Exception {
        String token = jwtUtil.generateToken("recep", "ROLE_RECEPTIONIST");

        Map<String, Object> notification = new HashMap<>();
        notification.put("type", "CANCELLED");
        notification.put("message", "Test notification");

        mockMvc.perform(post("/api/notifications/notify")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(notification)))
                .andExpect(status().isOk());
    }

    @Test
    void testAuthorizedProxyPostWithToken() throws Exception {
        String token = jwtUtil.generateToken("recep", "ROLE_RECEPTIONIST");

        // Test proxy post to reset endpoint (should pass security, return 500 due to downstream service down)
        mockMvc.perform(post("/api/reset")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void testProxyGetEndpoints() throws Exception {
        String token = jwtUtil.generateToken("recep", "ROLE_RECEPTIONIST");

        // Test proxy gets to verify exception catching and mapping
        mockMvc.perform(get("/api/patients")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isInternalServerError());

        mockMvc.perform(get("/api/patients/rut/12.345.678-9")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isInternalServerError());

        mockMvc.perform(get("/api/waitlist")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isInternalServerError());

        mockMvc.perform(get("/api/reassignments")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isInternalServerError());

        mockMvc.perform(get("/api/timeline/12.345.678-9")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void testProxyPostAndPutEndpoints() throws Exception {
        String token = jwtUtil.generateToken("recep", "ROLE_RECEPTIONIST");
        Map<String, Object> body = new HashMap<>();

        mockMvc.perform(post("/api/patients")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isInternalServerError());

        mockMvc.perform(post("/api/waitlist")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isInternalServerError());

        mockMvc.perform(post("/api/appointments/request")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isInternalServerError());

        mockMvc.perform(post("/api/appointments/check-in/1")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isInternalServerError());

        mockMvc.perform(post("/api/appointments/cancel/1")
                .param("reason", "test")
                .param("specialty", "Cardiologia")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isInternalServerError());

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/waitlist/1/status")
                .param("status", "PENDIENTE")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void testProxyGetPatientsSuccess() throws Exception {
        String token = jwtUtil.generateToken("recep", "ROLE_RECEPTIONIST");

        Mockito.when(restTemplate.getForEntity(
                Mockito.contains("/patients"), 
                Mockito.eq(Object.class)
        )).thenReturn(new ResponseEntity<>(List.of(Map.of("idPaciente", 101L)), HttpStatus.OK));

        mockMvc.perform(get("/api/patients")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].idPaciente").value(101L));
    }

    @Test
    void testProxyPostPatientsSuccess() throws Exception {
        String token = jwtUtil.generateToken("recep", "ROLE_RECEPTIONIST");
        Map<String, Object> body = Map.of("rut", "12.345.678-9", "nombreCompleto", "Test Patient");

        Mockito.when(restTemplate.postForEntity(
                Mockito.contains("/patients"), 
                Mockito.any(),
                Mockito.eq(Object.class)
        )).thenReturn(new ResponseEntity<>(Map.of("idPaciente", 101L), HttpStatus.OK));

        mockMvc.perform(post("/api/patients")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idPaciente").value(101L));
    }

    @Test
    void testProxyLoginPatientSuccess() throws Exception {
        Map<String, String> credentials = new HashMap<>();
        credentials.put("role", "patient");
        credentials.put("patientRut", "8.123.456-k");

        // Mock RestTemplate response for check patient
        Mockito.when(restTemplate.getForEntity(
                Mockito.contains("/patients/rut/8.123.456-k"),
                Mockito.eq(Map.class)
        )).thenReturn(new ResponseEntity<>(Map.of("idPaciente", 103L, "rut", "8.123.456-k"), HttpStatus.OK));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(credentials)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("patient"))
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.data.idPaciente").value(103L));
    }

    @Test
    void testGetPatientTimelineSuccess() throws Exception {
        String token = jwtUtil.generateToken("8.123.456-k", "ROLE_PATIENT");

        // Mock Waitlist timeline call
        Map<String, Object> mockWaitlistResponse = new HashMap<>();
        mockWaitlistResponse.put("patient", Map.of("idPaciente", 103L, "nombreCompleto", "Carlos Mendoza"));
        mockWaitlistResponse.put("requests", List.of(Map.of("idSolicitud", 1L)));
        Mockito.when(restTemplate.getForEntity(
                Mockito.contains("/patients/timeline/8.123.456-k"),
                Mockito.eq(Map.class)
        )).thenReturn(new ResponseEntity<>(mockWaitlistResponse, HttpStatus.OK));

        // Mock Cancellation appointments call
        Mockito.when(restTemplate.getForObject(
                Mockito.contains("/appointments/patient/103"),
                Mockito.eq(List.class)
        )).thenReturn(List.of(Map.of("idCita", 301L)));

        // Mock Cancellation notifications call
        Mockito.when(restTemplate.getForObject(
                Mockito.contains("/notifications/patient/103"),
                Mockito.eq(List.class)
        )).thenReturn(List.of(Map.of("idNotification", 5L)));

        mockMvc.perform(get("/api/timeline/8.123.456-k")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.patient.nombreCompleto").value("Carlos Mendoza"))
                .andExpect(jsonPath("$.requests[0].idSolicitud").value(1L))
                .andExpect(jsonPath("$.appointments[0].idCita").value(301L))
                .andExpect(jsonPath("$.notifications[0].idNotification").value(5L));
    }
}

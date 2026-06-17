package com.rednorte.bff.controller;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import com.rednorte.bff.security.JwtUtil;

import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class BffController {

    private final RestTemplate restTemplate = new RestTemplate();
    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();
    private final JwtUtil jwtUtil;

    public BffController(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String role = credentials.get("role");
        
        if ("patient".equals(role)) {
            String rut = credentials.get("patientRut");
            try {
                ResponseEntity<Map> response = restTemplate.getForEntity(
                        WAITLIST_SERVICE_URL + "/patients/rut/" + rut, Map.class);
                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    Map patient = response.getBody();
                    String token = jwtUtil.generateToken(rut, "ROLE_PATIENT");
                    
                    Map<String, Object> result = new HashMap<>();
                    result.put("token", token);
                    result.put("role", "patient");
                    result.put("data", patient);
                    return ResponseEntity.ok(result);
                }
            } catch (Exception e) {
                // fall through
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Paciente no registrado.");
            
        } else if ("doctor".equals(role)) {
            String doctorIdStr = credentials.get("doctorId");
            try {
                List<Map> doctors = restTemplate.getForObject(WAITLIST_SERVICE_URL + "/doctors", List.class);
                if (doctors != null) {
                    Optional<Map> doctorOpt = doctors.stream()
                            .filter(d -> d.get("idProfesional").toString().equals(doctorIdStr))
                            .findFirst();
                    if (doctorOpt.isPresent()) {
                        Map doctor = doctorOpt.get();
                        String token = jwtUtil.generateToken(doctorIdStr, "ROLE_DOCTOR");
                        
                        Map<String, Object> result = new HashMap<>();
                        result.put("token", token);
                        result.put("role", "doctor");
                        result.put("data", doctor);
                        return ResponseEntity.ok(result);
                    }
                }
            } catch (Exception e) {
                // fall through
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Médico no registrado.");
            
        } else if ("receptionist".equals(role)) {
            String username = credentials.get("adminUser");
            String password = credentials.get("adminPass");
            if ("recep".equals(username) && "recep123".equals(password)) {
                String token = jwtUtil.generateToken(username, "ROLE_RECEPTIONIST");
                
                Map<String, Object> result = new HashMap<>();
                result.put("token", token);
                result.put("role", "receptionist");
                result.put("data", Map.of("name", "Recepción RedNorte"));
                return ResponseEntity.ok(result);
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Credenciales incorrectas.");
        }
        
        return ResponseEntity.badRequest().body("Rol no válido.");
    }

    private static final String WAITLIST_SERVICE_URL = System.getenv("WAITLIST_SERVICE_URL") != null 
            ? System.getenv("WAITLIST_SERVICE_URL") 
            : "http://localhost:8081/api";
    private static final String CANCELLATION_SERVICE_URL = System.getenv("CANCELLATION_SERVICE_URL") != null 
            ? System.getenv("CANCELLATION_SERVICE_URL") 
            : "http://localhost:8082/api";

    @GetMapping("/notifications/stream")
    public SseEmitter getNotificationStream() {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        emitters.add(emitter);
        
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        
        try {
            emitter.send(SseEmitter.event()
                    .name("CONNECT")
                    .data("Connected successfully to RedNorte Real-Time Stream"));
        } catch (Exception e) {
            emitters.remove(emitter);
        }
        
        return emitter;
    }

    @PostMapping("/notifications/notify")
    public ResponseEntity<String> pushNotification(@RequestBody Map<String, Object> notification) {
        List<SseEmitter> deadEmitters = new ArrayList<>();
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("message")
                        .data(notification));
            } catch (Exception e) {
                deadEmitters.add(emitter);
            }
        }
        emitters.removeAll(deadEmitters);
        return ResponseEntity.ok("Notification broadcasted to " + (emitters.size() - deadEmitters.size()) + " clients.");
    }

    @GetMapping("/patients")
    public ResponseEntity<?> getAllPatients() {
        return proxyGet(WAITLIST_SERVICE_URL + "/patients");
    }

    @GetMapping("/patients/rut/{rut}")
    public ResponseEntity<?> getPatientByRut(@PathVariable String rut) {
        return proxyGet(WAITLIST_SERVICE_URL + "/patients/rut/" + rut);
    }

    @PostMapping("/patients")
    public ResponseEntity<?> createPatient(@RequestBody Map<String, Object> patient) {
        return proxyPost(WAITLIST_SERVICE_URL + "/patients", patient);
    }

    @GetMapping("/doctors")
    public ResponseEntity<?> getAllDoctors() {
        return proxyGet(WAITLIST_SERVICE_URL + "/doctors");
    }

    @PostMapping("/doctors")
    public ResponseEntity<?> createDoctor(@RequestBody Map<String, Object> doctor) {
        return proxyPost(WAITLIST_SERVICE_URL + "/doctors", doctor);
    }

    @GetMapping("/waitlist")
    public ResponseEntity<?> getWaitlist() {
        return proxyGet(WAITLIST_SERVICE_URL + "/waitlist");
    }

    @PostMapping("/waitlist")
    public ResponseEntity<?> createWaitlistRequest(@RequestBody Map<String, Object> request) {
        return proxyPost(WAITLIST_SERVICE_URL + "/waitlist", request);
    }

    @PutMapping("/waitlist/{id}/status")
    public ResponseEntity<?> updateWaitlistStatus(@PathVariable Long id, @RequestParam String status) {
        try {
            restTemplate.put(WAITLIST_SERVICE_URL + "/waitlist/" + id + "/status?status=" + status, null);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Proxy error PUT: " + e.getMessage());
        }
    }

    @GetMapping("/appointments")
    public ResponseEntity<?> getAllAppointments() {
        return proxyGet(CANCELLATION_SERVICE_URL + "/appointments");
    }

    @PostMapping("/appointments/request")
    public ResponseEntity<?> createAppointmentRequest(@RequestBody Map<String, Object> request) {
        return proxyPost(CANCELLATION_SERVICE_URL + "/appointments/request", request);
    }

    @PostMapping("/appointments/check-in/{id}")
    public ResponseEntity<?> checkInPatient(@PathVariable Long id) {
        return proxyPost(CANCELLATION_SERVICE_URL + "/appointments/check-in/" + id, null);
    }

    @PostMapping("/appointments/cancel/{id}")
    public ResponseEntity<?> cancelAppointment(
            @PathVariable Long id, 
            @RequestParam String reason, 
            @RequestParam String specialty) {
        return proxyPost(CANCELLATION_SERVICE_URL + "/appointments/cancel/" + id + "?reason=" + reason + "&specialty=" + specialty, null);
    }

    @GetMapping("/reassignments")
    public ResponseEntity<?> getAllReassignments() {
        return proxyGet(CANCELLATION_SERVICE_URL + "/reassignments");
    }

    @PostMapping("/reset")
    public ResponseEntity<?> resetAllData() {
        return proxyPost(CANCELLATION_SERVICE_URL + "/appointments/reset", null);
    }

    @GetMapping("/timeline/{rut}")
    public ResponseEntity<?> getPatientTimeline(@PathVariable String rut) {
        try {
            ResponseEntity<Map> waitlistRes = restTemplate.getForEntity(WAITLIST_SERVICE_URL + "/patients/timeline/" + rut, Map.class);
            if (!waitlistRes.getStatusCode().is2xxSuccessful() || waitlistRes.getBody() == null) {
                return ResponseEntity.notFound().build();
            }

            Map<String, Object> waitlistBody = waitlistRes.getBody();
            Map patient = (Map) waitlistBody.get("patient");
            List requests = (List) waitlistBody.get("requests");

            Number idPacienteNum = (Number) patient.get("idPaciente");
            Long idPaciente = idPacienteNum.longValue();

            List appointments = new ArrayList();
            try {
                appointments = restTemplate.getForObject(CANCELLATION_SERVICE_URL + "/appointments/patient/" + idPaciente, List.class);
            } catch (Exception e) {
                System.err.println("Error fetching appointments: " + e.getMessage());
            }

            List notifications = new ArrayList();
            try {
                notifications = restTemplate.getForObject(CANCELLATION_SERVICE_URL + "/notifications/patient/" + idPaciente, List.class);
            } catch (Exception e) {
                System.err.println("Error fetching notifications: " + e.getMessage());
            }

            Map<String, Object> aggregatedResult = new HashMap<>();
            aggregatedResult.put("patient", patient);
            aggregatedResult.put("requests", requests);
            aggregatedResult.put("appointments", appointments);
            aggregatedResult.put("notifications", notifications);

            return ResponseEntity.ok(aggregatedResult);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error compiling clinical history: " + e.getMessage());
        }
    }

    private ResponseEntity<?> proxyGet(String url) {
        try {
            ResponseEntity<Object> res = restTemplate.getForEntity(url, Object.class);
            return ResponseEntity.status(res.getStatusCode()).body(res.getBody());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Proxy error GET: " + e.getMessage());
        }
    }

    private ResponseEntity<?> proxyPost(String url, Object body) {
        try {
            ResponseEntity<Object> res = restTemplate.postForEntity(url, body, Object.class);
            return ResponseEntity.status(res.getStatusCode()).body(res.getBody());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Proxy error POST: " + e.getMessage());
        }
    }
}

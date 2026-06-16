package com.rednorte.waitlist.controller;

import com.rednorte.waitlist.model.Paciente;
import com.rednorte.waitlist.model.ProfesionalSalud;
import com.rednorte.waitlist.model.SolicitudListaEspera;
import com.rednorte.waitlist.repository.PacienteRepository;
import com.rednorte.waitlist.repository.ProfesionalSaludRepository;
import com.rednorte.waitlist.repository.SolicitudListaEsperaRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.Period;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class WaitlistController {

    private final PacienteRepository patientRepo;
    private final ProfesionalSaludRepository doctorRepo;
    private final SolicitudListaEsperaRepository waitlistRepo;

    public WaitlistController(PacienteRepository patientRepo, ProfesionalSaludRepository doctorRepo, SolicitudListaEsperaRepository waitlistRepo) {
        this.patientRepo = patientRepo;
        this.doctorRepo = doctorRepo;
        this.waitlistRepo = waitlistRepo;
    }

    @GetMapping("/patients")
    public List<Paciente> getAllPatients() {
        return patientRepo.findAll();
    }

    @GetMapping("/patients/rut/{rut}")
    public ResponseEntity<Paciente> getPatientByRut(@PathVariable String rut) {
        return patientRepo.findByRut(rut)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/patients/{id}")
    public ResponseEntity<Paciente> getPatientById(@PathVariable Long id) {
        return patientRepo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/patients")
    public ResponseEntity<?> createPatient(@RequestBody Paciente patient) {
        if (!isValidRut(patient.getRut())) {
            return ResponseEntity.badRequest().body("Error: El RUT del paciente no es válido.");
        }
        Long nextId = patientRepo.findAll().stream()
                .mapToLong(Paciente::getIdPaciente)
                .max().orElse(100L) + 1;
        patient.setIdPaciente(nextId);
        Paciente saved = patientRepo.save(patient);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/doctors")
    public List<ProfesionalSalud> getAllDoctors() {
        return doctorRepo.findAll();
    }

    @PostMapping("/doctors")
    public ResponseEntity<?> createDoctor(@RequestBody ProfesionalSalud doctor) {
        if (!isValidRut(doctor.getRut())) {
            return ResponseEntity.badRequest().body("Error: El RUT del médico no es válido.");
        }
        Long nextId = doctorRepo.findAll().stream()
                .mapToLong(ProfesionalSalud::getIdProfesional)
                .max().orElse(200L) + 1;
        doctor.setIdProfesional(nextId);
        doctor.setDisponible(true);
        ProfesionalSalud saved = doctorRepo.save(doctor);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/waitlist")
    public List<SolicitudListaEspera> getWaitlist() {
        return waitlistRepo.findAll().stream()
                .sorted(Comparator.comparingInt(SolicitudListaEspera::getPrioridadCalculada).reversed()
                        .thenComparing(SolicitudListaEspera::getFechaSolicitud))
                .collect(Collectors.toList());
    }

    @PostMapping("/waitlist")
    public ResponseEntity<?> addWaitlistRequest(@RequestBody SolicitudListaEspera request) {
        Optional<Paciente> patientOpt = patientRepo.findById(request.getIdPaciente());
        if (patientOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Error: Paciente no encontrado.");
        }
        
        Paciente patient = patientOpt.get();
        int gravity = request.getNivelGravedad();
        int basePriority = gravity * 15;
        
        int ageBonus = 0;
        try {
            LocalDate birthDate = LocalDate.parse(patient.getFechaNacimiento());
            int age = Period.between(birthDate, LocalDate.now()).getYears();
            if (age >= 60) {
                ageBonus = 20;
            } else if (age <= 5) {
                ageBonus = 10;
            }
        } catch (Exception e) {
            // ignore and proceed without bonus
        }
        
        int priority = Math.min(100, basePriority + ageBonus);
        request.setPrioridadCalculada(priority);
        request.setFechaSolicitud(LocalDate.now().toString());
        request.setEstado("PENDIENTE");
        
        SolicitudListaEspera saved = waitlistRepo.save(request);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/waitlist/highest-priority")
    public ResponseEntity<SolicitudListaEspera> getHighestPriority(@RequestParam String specialty) {
        List<SolicitudListaEspera> pendings = waitlistRepo.findByEspecialidadRequeridaAndEstado(specialty, "PENDIENTE");
        if (pendings.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        SolicitudListaEspera highest = pendings.stream()
                .sorted(Comparator.comparingInt(SolicitudListaEspera::getPrioridadCalculada).reversed()
                        .thenComparing(SolicitudListaEspera::getFechaSolicitud))
                .findFirst().get();
                
        return ResponseEntity.ok(highest);
    }

    @PutMapping("/waitlist/{id}/status")
    public ResponseEntity<SolicitudListaEspera> updateStatus(@PathVariable Long id, @RequestParam String status) {
        return waitlistRepo.findById(id)
                .map(req -> {
                    req.setEstado(status);
                    return ResponseEntity.ok(waitlistRepo.save(req));
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping("/waitlist/reset")
    public ResponseEntity<?> resetWaitlist() {
        waitlistRepo.deleteAll();
        waitlistRepo.save(new SolicitudListaEspera(103L, "2026-04-10", 4, "Cardiología", "Insuficiencia cardíaca congestiva descompensada", "PENDIENTE", 85, "Paciente prioritario por edad y severidad de síntomas. Requiere control urgente."));
        waitlistRepo.save(new SolicitudListaEspera(105L, "2026-05-01", 3, "Traumatología", "Sospecha de rotura de menisco en rodilla izquierda", "PENDIENTE", 55, "Dolor persistente. Derivado para evaluación quirúrgica."));
        waitlistRepo.save(new SolicitudListaEspera(101L, "2026-05-10", 2, "Cardiología", "Hipertensión arterial en estudio", "PENDIENTE", 42, "Monitoreo ambulatorio de presión. Control rutinario."));
        return ResponseEntity.ok("Waitlist reset successfully");
    }

    @GetMapping("/patients/timeline/{rut}")
    public ResponseEntity<?> getPatientTimeline(@PathVariable String rut) {
        Optional<Paciente> patientOpt = patientRepo.findByRut(rut);
        if (patientOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Paciente p = patientOpt.get();
        List<SolicitudListaEspera> requests = waitlistRepo.findByIdPaciente(p.getIdPaciente());
        
        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("patient", p);
        result.put("requests", requests);
        return ResponseEntity.ok(result);
    }

    private static boolean isValidRut(String rut) {
        if (rut == null || rut.trim().isEmpty()) {
            return false;
        }
        String cleanRut = rut.replace(".", "").replace("-", "").replace(" ", "").toUpperCase();
        if (cleanRut.length() < 2) {
            return false;
        }
        
        String body = cleanRut.substring(0, cleanRut.length() - 1);
        String dv = cleanRut.substring(cleanRut.length() - 1);
        
        if (!body.matches("\\d+")) {
            return false;
        }
        
        try {
            int sum = 0;
            int multiplier = 2;
            for (int i = body.length() - 1; i >= 0; i--) {
                sum += Character.getNumericValue(body.charAt(i)) * multiplier;
                multiplier = (multiplier == 7) ? 2 : multiplier + 1;
            }
            
            int expectedDvVal = 11 - (sum % 11);
            String expectedDv;
            if (expectedDvVal == 11) {
                expectedDv = "0";
            } else if (expectedDvVal == 10) {
                expectedDv = "K";
            } else {
                expectedDv = String.valueOf(expectedDvVal);
            }
            
            return expectedDv.equals(dv);
        } catch (Exception e) {
            return false;
        }
    }
}

package com.rednorte.cancellation.config;

import com.rednorte.cancellation.model.Cita;
import com.rednorte.cancellation.repository.CitaRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataLoader implements CommandLineRunner {

    private final CitaRepository appointmentRepo;

    public DataLoader(CitaRepository appointmentRepo) {
        this.appointmentRepo = appointmentRepo;
    }

    @Override
    public void run(String... args) throws Exception {
        if (appointmentRepo.count() == 0) {
            appointmentRepo.save(new Cita(301L, 102L, 201L, "2026-05-25T10:00:00", 30, "PROGRAMADA", "Electrocardiograma de esfuerzo anual."));
            appointmentRepo.save(new Cita(302L, 104L, 202L, "2026-05-26T15:30:00", 30, "CONFIRMADA", "Control post-operatorio de fractura de muñeca."));
            appointmentRepo.save(new Cita(303L, 101L, 203L, "2026-05-28T11:30:00", 20, "PROGRAMADA", "Fondo de ojo por sospecha de glaucoma."));
        }
    }
}

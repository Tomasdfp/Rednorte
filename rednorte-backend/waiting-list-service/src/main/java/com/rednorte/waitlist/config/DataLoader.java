package com.rednorte.waitlist.config;

import com.rednorte.waitlist.model.Paciente;
import com.rednorte.waitlist.model.ProfesionalSalud;
import com.rednorte.waitlist.model.SolicitudListaEspera;
import com.rednorte.waitlist.repository.PacienteRepository;
import com.rednorte.waitlist.repository.ProfesionalSaludRepository;
import com.rednorte.waitlist.repository.SolicitudListaEsperaRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataLoader implements CommandLineRunner {

    private final PacienteRepository patientRepo;
    private final ProfesionalSaludRepository doctorRepo;
    private final SolicitudListaEsperaRepository waitlistRepo;

    public DataLoader(PacienteRepository patientRepo, ProfesionalSaludRepository doctorRepo, SolicitudListaEsperaRepository waitlistRepo) {
        this.patientRepo = patientRepo;
        this.doctorRepo = doctorRepo;
        this.waitlistRepo = waitlistRepo;
    }

    @Override
    public void run(String... args) throws Exception {
        if (patientRepo.count() == 0) {
            patientRepo.save(new Paciente(101L, "12.345.678-9", "Alejandra Reyes Castro", "1965-04-12", "+56 9 8765 4321", "alejandra.reyes@email.cl", "Av. Providencia 1204, Santiago", "FONASA"));
            patientRepo.save(new Paciente(102L, "18.765.432-1", "Diego Muñoz Valenzuela", "1994-11-23", "+56 9 7654 3210", "diego.munoz@email.cl", "Paseo Huérfanos 834, Santiago", "ISAPRE"));
            patientRepo.save(new Paciente(103L, "8.123.456-k", "Carlos Mendoza Silva", "1951-08-05", "+56 9 6543 2109", "carlos.mendoza@email.cl", "Gran Avenida 5670, San Miguel", "FONASA"));
            patientRepo.save(new Paciente(104L, "20.987.654-3", "Valentina Gómez Soto", "2001-02-28", "+56 9 5432 1098", "valen.gomez@email.cl", "Las Condes 8900, Las Condes", "ISAPRE"));
            patientRepo.save(new Paciente(105L, "15.432.109-8", "Julio Plaza Vergara", "1978-07-19", "+56 9 4321 0987", "julio.plaza@email.cl", "Vicuña Mackenna 450, La Florida", "FONASA"));
        }

        if (doctorRepo.count() == 0) {
            doctorRepo.save(new ProfesionalSalud(201L, "11.111.111-1", "Dra. Karen Fuentealba Andrade", "Cardiología", "34891-C", "Lunes a Viernes 09:00 - 13:00", true));
            doctorRepo.save(new ProfesionalSalud(202L, "22.222.222-2", "Dr. Tomás Del Fierro Pardo", "Traumatología", "45092-T", "Lunes, Miércoles y Viernes 14:00 - 18:00", true));
            doctorRepo.save(new ProfesionalSalud(203L, "33.333.333-3", "Dra. María José Arancibia", "Oftalmología", "52109-O", "Martes y Jueves 09:00 - 17:00", true));
        }

        if (waitlistRepo.count() == 0) {
            waitlistRepo.save(new SolicitudListaEspera(103L, "2026-04-10", 4, "Cardiología", "Insuficiencia cardíaca congestiva descompensada", "PENDIENTE", 85, "Paciente prioritario por edad y severidad de síntomas. Requiere control urgente."));
            waitlistRepo.save(new SolicitudListaEspera(105L, "2026-05-01", 3, "Traumatología", "Sospecha de rotura de menisco en rodilla izquierda", "PENDIENTE", 55, "Dolor persistente. Derivado para evaluación quirúrgica."));
            waitlistRepo.save(new SolicitudListaEspera(101L, "2026-05-10", 2, "Cardiología", "Hipertensión arterial en estudio", "PENDIENTE", 42, "Monitoreo ambulatorio de presión. Control rutinario."));
        }
    }
}

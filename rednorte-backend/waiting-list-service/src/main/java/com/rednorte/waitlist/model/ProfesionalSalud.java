package com.rednorte.waitlist.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
public class ProfesionalSalud {
    @Id
    private Long idProfesional;
    
    private String rut;
    private String nombreCompleto;
    private String especialidad;
    private String registroNacional;
    private String horarioAtencion;
    private boolean disponible;

    public ProfesionalSalud() {}

    public ProfesionalSalud(Long idProfesional, String rut, String nombreCompleto, String especialidad, String registroNacional, String horarioAtencion, boolean disponible) {
        this.idProfesional = idProfesional;
        this.rut = rut;
        this.nombreCompleto = nombreCompleto;
        this.especialidad = especialidad;
        this.registroNacional = registroNacional;
        this.horarioAtencion = horarioAtencion;
        this.disponible = disponible;
    }

    public Long getIdProfesional() { return idProfesional; }
    public void setIdProfesional(Long idProfesional) { this.idProfesional = idProfesional; }
    public String getRut() { return rut; }
    public void setRut(String rut) { this.rut = rut; }
    public String getNombreCompleto() { return nombreCompleto; }
    public void setNombreCompleto(String nombreCompleto) { this.nombreCompleto = nombreCompleto; }
    public String getEspecialidad() { return especialidad; }
    public void setEspecialidad(String especialidad) { this.especialidad = especialidad; }
    public String getRegistroNacional() { return registroNacional; }
    public void setRegistroNacional(String registroNacional) { this.registroNacional = registroNacional; }
    public String getHorarioAtencion() { return horarioAtencion; }
    public void setHorarioAtencion(String horarioAtencion) { this.horarioAtencion = horarioAtencion; }
    public boolean isDisponible() { return disponible; }
    public void setDisponible(boolean disponible) { this.disponible = disponible; }
}

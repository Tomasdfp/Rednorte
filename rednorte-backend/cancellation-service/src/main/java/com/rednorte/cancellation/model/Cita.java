package com.rednorte.cancellation.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
public class Cita {
    @Id
    private Long idCita;
    
    private Long idPaciente;
    private Long idProfesional;
    private String fechaHoraProgramada;
    private int duracionEstimada;
    private String estadoCita;
    private String motivoCancelacion;
    private String observaciones;

    public Cita() {}

    public Cita(Long idCita, Long idPaciente, Long idProfesional, String fechaHoraProgramada, int duracionEstimada, String estadoCita, String observaciones) {
        this.idCita = idCita;
        this.idPaciente = idPaciente;
        this.idProfesional = idProfesional;
        this.fechaHoraProgramada = fechaHoraProgramada;
        this.duracionEstimada = duracionEstimada;
        this.estadoCita = estadoCita;
        this.observaciones = observaciones;
    }

    public Long getIdCita() { return idCita; }
    public void setIdCita(Long idCita) { this.idCita = idCita; }
    public Long getIdPaciente() { return idPaciente; }
    public void setIdPaciente(Long idPaciente) { this.idPaciente = idPaciente; }
    public Long getIdProfesional() { return idProfesional; }
    public void setIdProfesional(Long idProfesional) { this.idProfesional = idProfesional; }
    public String getFechaHoraProgramada() { return fechaHoraProgramada; }
    public void setFechaHoraProgramada(String fechaHoraProgramada) { this.fechaHoraProgramada = fechaHoraProgramada; }
    public int getDuracionEstimada() { return duracionEstimada; }
    public void setDuracionEstimada(int duracionEstimada) { this.duracionEstimada = duracionEstimada; }
    public String getEstadoCita() { return estadoCita; }
    public void setEstadoCita(String estadoCita) { this.estadoCita = estadoCita; }
    public String getMotivoCancelacion() { return motivoCancelacion; }
    public void setMotivoCancelacion(String motivoCancelacion) { this.motivoCancelacion = motivoCancelacion; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
}

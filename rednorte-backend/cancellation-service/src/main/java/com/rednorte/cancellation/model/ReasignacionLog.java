package com.rednorte.cancellation.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;

@Entity
public class ReasignacionLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idLog;
    
    private String fechaEvento;
    private Long citaOriginal;
    private Long citaReasignada;
    private String nombrePacienteOriginal;
    private String nombrePacienteReasignado;
    private String especialidad;
    private String motivo;
    private String algoritmoUsado;
    private int tiempoProcesamiento;

    public ReasignacionLog() {}

    public ReasignacionLog(String fechaEvento, Long citaOriginal, Long citaReasignada, String nombrePacienteOriginal, String nombrePacienteReasignado, String especialidad, String motivo, String algoritmoUsado, int tiempoProcesamiento) {
        this.fechaEvento = fechaEvento;
        this.citaOriginal = citaOriginal;
        this.citaReasignada = citaReasignada;
        this.nombrePacienteOriginal = nombrePacienteOriginal;
        this.nombrePacienteReasignado = nombrePacienteReasignado;
        this.especialidad = especialidad;
        this.motivo = motivo;
        this.algoritmoUsado = algoritmoUsado;
        this.tiempoProcesamiento = tiempoProcesamiento;
    }

    public Long getIdLog() { return idLog; }
    public void setIdLog(Long idLog) { this.idLog = idLog; }
    public String getFechaEvento() { return fechaEvento; }
    public void setFechaEvento(String fechaEvento) { this.fechaEvento = fechaEvento; }
    public Long getCitaOriginal() { return citaOriginal; }
    public void setCitaOriginal(Long citaOriginal) { this.citaOriginal = citaOriginal; }
    public Long getCitaReasignada() { return citaReasignada; }
    public void setCitaReasignada(Long citaReasignada) { this.citaReasignada = citaReasignada; }
    public String getNombrePacienteOriginal() { return nombrePacienteOriginal; }
    public void setNombrePacienteOriginal(String nombrePacienteOriginal) { this.nombrePacienteOriginal = nombrePacienteOriginal; }
    public String getNombrePacienteReasignado() { return nombrePacienteReasignado; }
    public void setNombrePacienteReasignado(String nombrePacienteReasignado) { this.nombrePacienteReasignado = nombrePacienteReasignado; }
    public String getEspecialidad() { return especialidad; }
    public void setEspecialidad(String especialidad) { this.especialidad = especialidad; }
    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }
    public String getAlgoritmoUsado() { return algoritmoUsado; }
    public void setAlgoritmoUsado(String algoritmoUsado) { this.algoritmoUsado = algoritmoUsado; }
    public int getTiempoProcesamiento() { return tiempoProcesamiento; }
    public void setTiempoProcesamiento(int tiempoProcesamiento) { this.tiempoProcesamiento = tiempoProcesamiento; }
}

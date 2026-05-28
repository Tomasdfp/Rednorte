package com.rednorte.waitlist.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;

@Entity
public class SolicitudListaEspera {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idSolicitud;
    
    private Long idPaciente;
    private String fechaSolicitud;
    private int nivelGravedad;
    private String especialidadRequerida;
    private String diagnosticoPreliminar;
    private String estado;
    private int prioridadCalculada;
    private String comentariosMedicos;

    public SolicitudListaEspera() {}

    public SolicitudListaEspera(Long idPaciente, String fechaSolicitud, int nivelGravedad, String especialidadRequerida, String diagnosticoPreliminar, String estado, int prioridadCalculada, String comentariosMedicos) {
        this.idPaciente = idPaciente;
        this.fechaSolicitud = fechaSolicitud;
        this.nivelGravedad = nivelGravedad;
        this.especialidadRequerida = especialidadRequerida;
        this.diagnosticoPreliminar = diagnosticoPreliminar;
        this.estado = estado;
        this.prioridadCalculada = prioridadCalculada;
        this.comentariosMedicos = comentariosMedicos;
    }

    public Long getIdSolicitud() { return idSolicitud; }
    public void setIdSolicitud(Long idSolicitud) { this.idSolicitud = idSolicitud; }
    public Long getIdPaciente() { return idPaciente; }
    public void setIdPaciente(Long idPaciente) { this.idPaciente = idPaciente; }
    public String getFechaSolicitud() { return fechaSolicitud; }
    public void setFechaSolicitud(String fechaSolicitud) { this.fechaSolicitud = fechaSolicitud; }
    public int getNivelGravedad() { return nivelGravedad; }
    public void setNivelGravedad(int nivelGravedad) { this.nivelGravedad = nivelGravedad; }
    public String getEspecialidadRequerida() { return especialidadRequerida; }
    public void setEspecialidadRequerida(String especialidadRequerida) { this.especialidadRequerida = especialidadRequerida; }
    public String getDiagnosticoPreliminar() { return diagnosticoPreliminar; }
    public void setDiagnosticoPreliminar(String diagnosticoPreliminar) { this.diagnosticoPreliminar = diagnosticoPreliminar; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public int getPrioridadCalculada() { return prioridadCalculada; }
    public void setPrioridadCalculada(int prioridadCalculada) { this.prioridadCalculada = prioridadCalculada; }
    public String getComentariosMedicos() { return comentariosMedicos; }
    public void setComentariosMedicos(String comentariosMedicos) { this.comentariosMedicos = comentariosMedicos; }
}

package com.rednorte.cancellation.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;

@Entity
public class NotificationAudit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idNotification;
    
    private Long idPaciente;
    private String nombrePaciente;
    private String tipoCanal;
    private String destinatario;
    @jakarta.persistence.Column(length = 2000)
    private String mensaje;
    private String fechaEnvio;

    public NotificationAudit() {}

    public NotificationAudit(Long idPaciente, String nombrePaciente, String tipoCanal, String destinatario, String mensaje, String fechaEnvio) {
        this.idPaciente = idPaciente;
        this.nombrePaciente = nombrePaciente;
        this.tipoCanal = tipoCanal;
        this.destinatario = destinatario;
        this.mensaje = mensaje;
        this.fechaEnvio = fechaEnvio;
    }

    public Long getIdNotification() { return idNotification; }
    public void setIdNotification(Long idNotification) { this.idNotification = idNotification; }
    public Long getIdPaciente() { return idPaciente; }
    public void setIdPaciente(Long idPaciente) { this.idPaciente = idPaciente; }
    public String getNombrePaciente() { return nombrePaciente; }
    public void setNombrePaciente(String nombrePaciente) { this.nombrePaciente = nombrePaciente; }
    public String getTipoCanal() { return tipoCanal; }
    public void setTipoCanal(String tipoCanal) { this.tipoCanal = tipoCanal; }
    public String getDestinatario() { return destinatario; }
    public void setDestinatario(String destinatario) { this.destinatario = destinatario; }
    public String getMensaje() { return mensaje; }
    public void setMensaje(String mensaje) { this.mensaje = mensaje; }
    public String getFechaEnvio() { return fechaEnvio; }
    public void setFechaEnvio(String fechaEnvio) { this.fechaEnvio = fechaEnvio; }
}

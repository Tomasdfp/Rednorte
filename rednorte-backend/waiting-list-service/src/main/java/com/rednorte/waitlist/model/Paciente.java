package com.rednorte.waitlist.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
public class Paciente {
    @Id
    private Long idPaciente;
    
    private String rut;
    private String nombreCompleto;
    private String fechaNacimiento;
    private String telefono;
    private String email;
    private String direccion;
    private String prevision;

    public Paciente() {}

    public Paciente(Long idPaciente, String rut, String nombreCompleto, String fechaNacimiento, String telefono, String email, String direccion, String prevision) {
        this.idPaciente = idPaciente;
        this.rut = rut;
        this.nombreCompleto = nombreCompleto;
        this.fechaNacimiento = fechaNacimiento;
        this.telefono = telefono;
        this.email = email;
        this.direccion = direccion;
        this.prevision = prevision;
    }

    public Long getIdPaciente() { return idPaciente; }
    public void setIdPaciente(Long idPaciente) { this.idPaciente = idPaciente; }
    public String getRut() { return rut; }
    public void setRut(String rut) { this.rut = rut; }
    public String getNombreCompleto() { return nombreCompleto; }
    public void setNombreCompleto(String nombreCompleto) { this.nombreCompleto = nombreCompleto; }
    public String getFechaNacimiento() { return fechaNacimiento; }
    public void setFechaNacimiento(String fechaNacimiento) { this.fechaNacimiento = fechaNacimiento; }
    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getDireccion() { return direccion; }
    public void setDireccion(String direccion) { this.direccion = direccion; }
    public String getPrevision() { return prevision; }
    public void setPrevision(String prevision) { this.prevision = prevision; }
}

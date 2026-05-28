import React, { useState } from 'react';
import { useWaitingList, useAppointments } from '../observer/ObserverContext';
import { mockDoctors, mockPatients, mockMedicalAttentions } from '../mockData';
import type { Paciente, SolicitudListaEspera, ProfesionalSalud } from '../mockData';
import { UserCheck, Search, UserPlus, Trash2, FolderSync, PlusCircle } from 'lucide-react';

export const ReceptionistPortalView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'checkin' | 'search' | 'waitlist' | 'users'>('checkin');
  
  const { requests, addRequest, updateRequestStatus } = useWaitingList();
  const { appointments, cancelAppointment, markPatientArrival } = useAppointments();

  // Search tab state
  const [searchRut, setSearchRut] = useState('');
  const [searchedPatient, setSearchedPatient] = useState<Paciente | null>(null);

  // Users tab state
  const [activeFormTab, setActiveFormTab] = useState<'patient' | 'doctor'>('patient');
  const [patRut, setPatRut] = useState('');
  const [patName, setPatName] = useState('');
  const [patBirth, setPatBirth] = useState('');
  const [patPhone, setPatPhone] = useState('');
  const [patEmail, setPatEmail] = useState('');
  const [patAddress, setPatAddress] = useState('');
  const [patPrevision, setPatPrevision] = useState<'FONASA' | 'ISAPRE'>('FONASA');

  const [docRut, setDocRut] = useState('');
  const [docName, setDocName] = useState('');
  const [docSpecialty, setDocSpecialty] = useState('Cardiología');
  const [docRegistry, setDocRegistry] = useState('');
  const docHours = 'Lunes a Viernes 09:00 - 13:00';

  // Waitlist tab states
  const [wlRut, setWlRut] = useState('');
  const [wlName, setWlName] = useState('');
  const [wlBirth, setWlBirth] = useState('');
  const [wlPhone, setWlPhone] = useState('');
  const [wlEmail, setWlEmail] = useState('');
  const [wlAddress, setWlAddress] = useState('');
  const [wlPrevision, setWlPrevision] = useState<'FONASA' | 'ISAPRE'>('FONASA');
  
  const [wlGravity, setWlGravity] = useState(3);
  const [wlSpecialty, setWlSpecialty] = useState('Cardiología');
  const [wlDiagnosis, setWlDiagnosis] = useState('');
  const [wlComments, setWlComments] = useState('');

  const [wlFilterSpecialty, setWlFilterSpecialty] = useState('Todas');
  const [wlFilterStatus, setWlFilterStatus] = useState('Todas');

  const [, setRefresh] = useState(0);

  // Helper getters
  const getPatientName = (idPaciente: number) => {
    const p = mockPatients.find(x => x.idPaciente === idPaciente);
    return p ? p.nombreCompleto : `Paciente #${idPaciente}`;
  };

  const getPatientRut = (idPaciente: number) => {
    const p = mockPatients.find(x => x.idPaciente === idPaciente);
    return p ? p.rut : '-';
  };

  const getDoctorName = (idDoctor: number) => {
    const d = mockDoctors.find(x => x.idProfesional === idDoctor);
    return d ? d.nombreCompleto : `Médico #${idDoctor}`;
  };

  const getDoctorSpecialty = (idDoctor: number) => {
    const d = mockDoctors.find(x => x.idProfesional === idDoctor);
    return d ? d.especialidad : 'General';
  };

  // Check-In handler
  const handleMarkArrival = (idCita: number) => {
    markPatientArrival(idCita, mockPatients);
    alert('Paciente marcado como PRESENTE. El médico ha sido notificado en su portal.');
  };

  // Cancel Appointment handler
  const handleCancelAppt = (idCita: number, doctorId: number) => {
    const reason = window.prompt('Ingrese el motivo de la cancelación para liberar cupo:');
    if (reason === null) return;
    if (!reason.trim()) {
      alert('Motivo requerido.');
      return;
    }
    const specialty = getDoctorSpecialty(doctorId);
    cancelAppointment(idCita, reason, mockPatients, specialty);
    alert('Cita cancelada. Cupo reasignado al paciente con mayor prioridad.');
  };

  // Search patient profile handler
  const handleSearchPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchRut) return;

    const patient = mockPatients.find(
      p => p.rut.trim().replace(/\s/g, '') === searchRut.trim().replace(/\s/g, '')
    );

    if (patient) {
      setSearchedPatient(patient);
    } else {
      alert('Paciente no registrado. Intente con: 12.345.678-9');
      setSearchedPatient(null);
    }
  };

  // Create Patient handler
  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patRut || !patName || !patBirth) {
      alert('Complete los campos obligatorios.');
      return;
    }
    const exists = mockPatients.some(p => p.rut.trim() === patRut.trim());
    if (exists) {
      alert(`Error: Ya existe el paciente.`);
      return;
    }
    const newPatient: Paciente = {
      idPaciente: mockPatients.reduce((max, p) => Math.max(max, p.idPaciente), 0) + 1,
      rut: patRut,
      nombreCompleto: patName,
      fechaNacimiento: patBirth,
      telefono: patPhone,
      email: patEmail,
      direccion: patAddress,
      prevision: patPrevision
    };
    mockPatients.push(newPatient);
    alert(`Paciente registrado con éxito.`);
    setPatRut(''); setPatName(''); setPatBirth(''); setPatPhone(''); setPatEmail(''); setPatAddress('');
    setRefresh(p => p + 1);
  };

  // Create Doctor handler
  const handleCreateDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docRut || !docName || !docRegistry) {
      alert('Complete los campos obligatorios.');
      return;
    }
    const exists = mockDoctors.some(d => d.rut.trim() === docRut.trim());
    if (exists) {
      alert('Error: Ya existe el médico.');
      return;
    }
    const newDoctor: ProfesionalSalud = {
      idProfesional: mockDoctors.reduce((max, d) => Math.max(max, d.idProfesional), 0) + 1,
      rut: docRut,
      nombreCompleto: docName,
      especialidad: docSpecialty,
      registroNacional: docRegistry,
      horarioAtencion: docHours,
      disponible: true
    };
    mockDoctors.push(newDoctor);
    alert('Médico registrado con éxito.');
    setDocRut(''); setDocName(''); setDocRegistry('');
    setRefresh(p => p + 1);
  };

  // Waitlist insert handler
  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wlRut || !wlName || !wlBirth || !wlDiagnosis) {
      alert('Complete los campos obligatorios.');
      return;
    }

    let patient = mockPatients.find(p => p.rut === wlRut);
    if (!patient) {
      patient = {
        idPaciente: mockPatients.reduce((max, p) => Math.max(max, p.idPaciente), 0) + 1,
        rut: wlRut,
        nombreCompleto: wlName,
        fechaNacimiento: wlBirth,
        telefono: wlPhone,
        email: wlEmail,
        direccion: wlAddress,
        prevision: wlPrevision
      };
      mockPatients.push(patient);
    }

    let basePriority = wlGravity * 15;
    const birthYear = new Date(wlBirth).getFullYear();
    const age = new Date().getFullYear() - birthYear;
    let ageBonus = 0;
    if (age >= 60) ageBonus = 20;
    else if (age <= 5) ageBonus = 10;
    const priority = Math.min(100, basePriority + ageBonus);

    const newRequest: SolicitudListaEspera = {
      idSolicitud: requests.reduce((max, r) => Math.max(max, r.idSolicitud), 0) + 1,
      idPaciente: patient.idPaciente,
      fechaSolicitud: new Date().toISOString().split('T')[0],
      nivelGravedad: wlGravity,
      especialidadRequerida: wlSpecialty,
      diagnosticoPreliminar: wlDiagnosis,
      estado: 'PENDIENTE',
      prioridadCalculada: priority,
      comentariosMedicos: wlComments
    };

    addRequest(newRequest);
    alert('Paciente registrado en la lista de espera.');
    setWlRut(''); setWlName(''); setWlBirth(''); setWlPhone(''); setWlEmail(''); setWlAddress(''); setWlDiagnosis(''); setWlComments('');
  };

  // Autocomplete RUT on waitlist tab
  const handleWlRutBlur = () => {
    const existing = mockPatients.find(p => p.rut.trim() === wlRut.trim());
    if (existing) {
      setWlName(existing.nombreCompleto);
      setWlBirth(existing.fechaNacimiento);
      setWlPhone(existing.telefono);
      setWlEmail(existing.email);
      setWlAddress(existing.direccion);
      setWlPrevision(existing.prevision);
    }
  };

  // Timelines for search tab
  const searchedAppointments = searchedPatient
    ? appointments.filter(c => c.idPaciente === searchedPatient.idPaciente)
    : [];

  const searchedRequests = searchedPatient
    ? requests.filter(r => r.idPaciente === searchedPatient.idPaciente)
    : [];

  const searchedAttentions = searchedPatient
    ? mockMedicalAttentions.filter(a => {
        const appt = appointments.find(c => c.idCita === a.idCita);
        return appt ? appt.idPaciente === searchedPatient.idPaciente : false;
      })
    : [];

  return (
    <div className="main-content">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Portal de Recepción RedNorte</h1>
          <p className="page-description">
            Recepción, control de flujo en sala de espera, asignación clínica e historial de pacientes.
          </p>
        </div>

        {/* Tab Routing Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'hsl(var(--bg-card))', padding: '0.35rem', borderRadius: 'var(--radius-md)', border: '1px solid hsl(var(--border-color))' }}>
          <button 
            onClick={() => setActiveTab('checkin')} 
            className={`btn ${activeTab === 'checkin' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
          >
            Recepción (Check-In)
          </button>
          <button 
            onClick={() => setActiveTab('search')} 
            className={`btn ${activeTab === 'search' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
          >
            Buscador Paciente
          </button>
          <button 
            onClick={() => setActiveTab('waitlist')} 
            className={`btn ${activeTab === 'waitlist' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
          >
            Listas de Espera
          </button>
          <button 
            onClick={() => setActiveTab('users')} 
            className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
          >
            Crear Usuarios
          </button>
        </div>
      </div>

      {/* Tab CONTENT 1: Reception & Check-In */}
      {activeTab === 'checkin' && (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserCheck style={{ color: 'hsl(var(--primary))' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Flujo de Llegada de Pacientes</h2>
          </div>

          <p style={{ fontSize: '0.9rem', color: 'hsl(var(--text-muted))' }}>
            Marque la llegada de un paciente para avisar directamente al consultorio del médico en tiempo real.
          </p>

          <div className="table-container">
            <table className="medical-table">
              <thead>
                <tr>
                  <th>Cita ID</th>
                  <th>Paciente</th>
                  <th>RUT</th>
                  <th>Médico / Especialidad</th>
                  <th>Hora Programada</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map(appt => (
                  <tr key={appt.idCita}>
                    <td>#{appt.idCita}</td>
                    <td style={{ fontWeight: 600 }}>{getPatientName(appt.idPaciente)}</td>
                    <td><code>{getPatientRut(appt.idPaciente)}</code></td>
                    <td>{getDoctorName(appt.idProfesional)} ({getDoctorSpecialty(appt.idProfesional)})</td>
                    <td>
                      <code>{new Date(appt.fechaHoraProgramada).toLocaleTimeString('es-CL', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })} hrs</code>
                    </td>
                    <td>
                      <span className={`badge ${appt.estadoCita.toLowerCase()}`}>
                        {appt.estadoCita === 'PRESENTE' ? 'En Espera (Box)' : appt.estadoCita}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {appt.estadoCita === 'PROGRAMADA' || appt.estadoCita === 'CONFIRMADA' ? (
                          <>
                            <button
                              onClick={() => handleMarkArrival(appt.idCita)}
                              className="btn btn-primary"
                              style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}
                            >
                              Marcar Llegada
                            </button>
                            <button
                              onClick={() => handleCancelAppt(appt.idCita, appt.idProfesional)}
                              className="btn btn-danger"
                              style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </>
                        ) : appt.estadoCita === 'PRESENTE' ? (
                          <span style={{ fontSize: '0.85rem', color: 'hsl(var(--accent))', fontWeight: 600 }}>En Sala de Espera</span>
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>Listo / Cancelado</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab CONTENT 2: Patient History Timeline Search */}
      {activeTab === 'search' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <form onSubmit={handleSearchPatient} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: '250px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Search size={16} />
                  Buscador Clínico de Pacientes (Ingrese RUT)
                </label>
                <input
                  type="text"
                  placeholder="Ej: 12.345.678-9 o 18.765.432-1"
                  value={searchRut}
                  onChange={e => setSearchRut(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>
                Buscar Ficha
              </button>
            </form>
          </div>

          {searchedPatient ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
              {/* Profile details */}
              <div className="glass-panel" style={{ height: 'fit-content' }}>
                <h3 style={{ fontWeight: 700, fontSize: '1.15rem', color: 'hsl(var(--primary))', marginBottom: '1rem' }}>Ficha del Paciente</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <p><strong>Paciente:</strong> {searchedPatient.nombreCompleto}</p>
                  <p><strong>RUT:</strong> {searchedPatient.rut}</p>
                  <p><strong>F. Nacimiento:</strong> {searchedPatient.fechaNacimiento}</p>
                  <p><strong>Previsión:</strong> {searchedPatient.prevision}</p>
                  <p><strong>Teléfono:</strong> {searchedPatient.telefono}</p>
                  <p><strong>Email:</strong> {searchedPatient.email}</p>
                  <p><strong>Dirección:</strong> {searchedPatient.direccion}</p>
                </div>
              </div>

              {/* Consultation and Waitlist History */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Appointments Timeline */}
                <div className="glass-panel">
                  <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1rem', color: 'hsl(var(--primary))' }}>Historial de Citas Médicas</h3>
                  {searchedAppointments.length === 0 ? (
                    <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>No registra citas agendadas.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {searchedAppointments.map(c => (
                        <div key={c.idCita} style={{ padding: '0.75rem', border: '1px solid hsl(var(--border-color))', borderRadius: 'var(--radius-sm)', backgroundColor: 'hsl(var(--bg-card))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ fontWeight: 700 }}>{getDoctorName(c.idProfesional)} ({getDoctorSpecialty(c.idProfesional)})</span>
                            <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Fecha: {new Date(c.fechaHoraProgramada).toLocaleString('es-CL')}</div>
                            <div style={{ fontSize: '0.8rem', fontStyle: 'italic', opacity: 0.9 }}>{c.observaciones}</div>
                          </div>
                          <span className={`badge ${c.estadoCita.toLowerCase()}`}>{c.estadoCita}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Waitlist history */}
                <div className="glass-panel">
                  <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1rem', color: 'hsl(var(--primary))' }}>Historial en Lista de Espera</h3>
                  {searchedRequests.length === 0 ? (
                    <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>No registra solicitudes en listas de espera.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {searchedRequests.map(r => (
                        <div key={r.idSolicitud} style={{ padding: '0.75rem', border: '1px solid hsl(var(--border-color))', borderRadius: 'var(--radius-sm)', backgroundColor: 'hsl(var(--bg-card))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ fontWeight: 700 }}>Especialidad: {r.especialidadRequerida}</span>
                            <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Solicitado el: {r.fechaSolicitud} (Gravedad: {r.nivelGravedad})</div>
                            <div style={{ fontSize: '0.8rem' }}>Puntaje Prioridad: <strong>{r.prioridadCalculada}/100</strong></div>
                          </div>
                          <span className={`badge ${r.estado.toLowerCase()}`}>{r.estado}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recipes / Medical attentions */}
                <div className="glass-panel">
                  <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1rem', color: 'hsl(var(--primary))' }}>Consultas Cerradas y Recetas</h3>
                  {searchedAttentions.length === 0 ? (
                    <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>No registra atenciones médicas finalizadas.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {searchedAttentions.map(a => (
                        <div key={a.idAtencion} style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'hsl(var(--bg-main) / 0.3)', border: '1px solid hsl(var(--border-color))' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Consulta Fecha: {a.fechaAtencion}</span>
                          <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}><strong>Diagnóstico:</strong> {a.diagnosticoFinal}</p>
                          <p style={{ fontSize: '0.85rem' }}><strong>Tratamiento:</strong> {a.tratamientoIndicado}</p>
                          <div style={{ margin: '0.5rem 0 0 0', padding: '0.5rem', backgroundColor: 'hsl(var(--bg-card))', borderLeft: '3px solid hsl(var(--accent))', borderRadius: '4px', fontSize: '0.8rem' }}>
                            <strong>Receta Emitida:</strong> {a.recetaMedica}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'hsl(var(--text-muted))' }}>
              <Search size={48} style={{ margin: '0 auto 1rem', color: 'hsl(var(--border-color))' }} />
              <h3>Buscador Clínico</h3>
              <p style={{ fontSize: '0.9rem', maxWidth: '350px', margin: '0.5rem auto 0' }}>
                Ingrese el RUT del paciente para consultar todas sus horas asignadas, historial de consultas médicas y solicitudes activas.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab CONTENT 3: Waiting List management */}
      {activeTab === 'waitlist' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {/* Waitlist register form */}
          <div className="glass-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <PlusCircle style={{ color: 'hsl(var(--primary))' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Ingreso a Lista de Espera</h2>
            </div>
            
            <form onSubmit={handleWaitlistSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '0.25rem', color: 'hsl(var(--primary))' }}>
                1. Datos del Paciente
              </h3>

              <div className="form-grid">
                <div className="form-group">
                  <label>RUT *</label>
                  <input
                    type="text"
                    placeholder="Ej: 12.345.678-9"
                    value={wlRut}
                    onChange={e => setWlRut(e.target.value)}
                    onBlur={handleWlRutBlur}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Nombre Completo *</label>
                  <input
                    type="text"
                    placeholder="Nombre Apellido"
                    value={wlName}
                    onChange={e => setWlName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Fecha de Nacimiento *</label>
                  <input
                    type="date"
                    value={wlBirth}
                    onChange={e => setWlBirth(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Previsión *</label>
                  <select value={wlPrevision} onChange={e => setWlPrevision(e.target.value as any)}>
                    <option value="FONASA">FONASA</option>
                    <option value="ISAPRE">ISAPRE</option>
                  </select>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Teléfono</label>
                  <input
                    type="text"
                    value={wlPhone}
                    onChange={e => setWlPhone(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={wlEmail}
                    onChange={e => setWlEmail(e.target.value)}
                  />
                </div>
              </div>

              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '0.25rem', color: 'hsl(var(--primary))', marginTop: '0.5rem' }}>
                2. Diagnóstico y Especialidad
              </h3>

              <div className="form-grid">
                <div className="form-group">
                  <label>Especialidad Requerida *</label>
                  <select value={wlSpecialty} onChange={e => setWlSpecialty(e.target.value)}>
                    <option value="Cardiología">Cardiología</option>
                    <option value="Traumatología">Traumatología</option>
                    <option value="Oftalmología">Oftalmología</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Nivel de Gravedad (1-5) *</label>
                  <select value={wlGravity} onChange={e => setWlGravity(Number(e.target.value))}>
                    <option value="1">1 - Baja Complejidad</option>
                    <option value="2">2 - Moderada Leve</option>
                    <option value="3">3 - Moderada</option>
                    <option value="4">4 - Alta Complejidad</option>
                    <option value="5">5 - Crítica / Urgencia</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Diagnóstico Preliminar *</label>
                <textarea
                  rows={2}
                  value={wlDiagnosis}
                  onChange={e => setWlDiagnosis(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary">Registrar en Lista de Espera</button>
            </form>
          </div>

          {/* Waitlist active table */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Lista de Espera Activa</h2>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: '130px' }}>
                <label>Especialidad</label>
                <select value={wlFilterSpecialty} onChange={e => setWlFilterSpecialty(e.target.value)}>
                  <option value="Todas">Todas</option>
                  <option value="Cardiología">Cardiología</option>
                  <option value="Traumatología">Traumatología</option>
                  <option value="Oftalmología">Oftalmología</option>
                </select>
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: '130px' }}>
                <label>Estado</label>
                <select value={wlFilterStatus} onChange={e => setWlFilterStatus(e.target.value)}>
                  <option value="Todas">Todos</option>
                  <option value="PENDIENTE">PENDIENTE</option>
                  <option value="ASIGNADA">ASIGNADA</option>
                  <option value="CANCELADA">CANCELADA</option>
                </select>
              </div>
            </div>

            <div className="table-container" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <table className="medical-table">
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>Especialidad</th>
                    <th>Gravedad</th>
                    <th>Prioridad</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.filter(r => {
                    const matchSp = wlFilterSpecialty === 'Todas' || r.especialidadRequerida === wlFilterSpecialty;
                    const matchSt = wlFilterStatus === 'Todas' || r.estado === wlFilterStatus;
                    return matchSp && matchSt;
                  }).map(req => (
                    <tr key={req.idSolicitud}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{getPatientName(req.idPaciente)}</div>
                        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>{getPatientRut(req.idPaciente)}</div>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>{req.especialidadRequerida}</td>
                      <td>
                        <span className={`badge severity-${req.nivelGravedad}`} style={{ fontSize: '0.7rem' }}>
                          G{req.nivelGravedad}
                        </span>
                      </td>
                      <td><strong>{req.prioridadCalculada}/100</strong></td>
                      <td><span className={`badge ${req.estado.toLowerCase()}`} style={{ fontSize: '0.7rem' }}>{req.estado}</span></td>
                      <td>
                        <select
                          style={{ padding: '0.2rem', fontSize: '0.8rem', width: 'auto' }}
                          value={req.estado}
                          onChange={e => updateRequestStatus(req.idSolicitud, e.target.value as any)}
                        >
                          <option value="PENDIENTE">PENDIENTE</option>
                          <option value="ASIGNADA">ASIGNADA</option>
                          <option value="CANCELADA">CANCELADA</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab CONTENT 4: User Creation form */}
      {activeTab === 'users' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          
          {/* Form Create */}
          <div className="glass-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <UserPlus style={{ color: 'hsl(var(--primary))' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Ingreso de Cuentas Fichas</h2>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '0.5rem' }}>
              <button
                onClick={() => setActiveFormTab('patient')}
                className={`btn ${activeFormTab === 'patient' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem' }}
              >
                Crear Paciente
              </button>
              <button
                onClick={() => setActiveFormTab('doctor')}
                className={`btn ${activeFormTab === 'doctor' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem' }}
              >
                Crear Médico
              </button>
            </div>

            {activeFormTab === 'patient' ? (
              <form onSubmit={handleCreatePatient} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label>RUT *</label>
                  <input type="text" placeholder="Ej: 14.222.333-4" value={patRut} onChange={e => setPatRut(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Nombre Completo *</label>
                  <input type="text" placeholder="Nombre Apellidos" value={patName} onChange={e => setPatName(e.target.value)} required />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>F. Nacimiento *</label>
                    <input type="date" value={patBirth} onChange={e => setPatBirth(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Previsión *</label>
                    <select value={patPrevision} onChange={e => setPatPrevision(e.target.value as any)}>
                      <option value="FONASA">FONASA</option>
                      <option value="ISAPRE">ISAPRE</option>
                    </select>
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Teléfono</label>
                    <input type="text" value={patPhone} onChange={e => setPatPhone(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={patEmail} onChange={e => setPatEmail(e.target.value)} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary">Crear Cuenta Paciente</button>
              </form>
            ) : (
              <form onSubmit={handleCreateDoctor} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label>RUT Médico *</label>
                  <input type="text" placeholder="Ej: 10.999.888-7" value={docRut} onChange={e => setDocRut(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Nombre Profesional *</label>
                  <input type="text" value={docName} onChange={e => setDocName(e.target.value)} required />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Especialidad *</label>
                    <select value={docSpecialty} onChange={e => setDocSpecialty(e.target.value)}>
                      <option value="Cardiología">Cardiología</option>
                      <option value="Traumatología">Traumatología</option>
                      <option value="Oftalmología">Oftalmología</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Registro N° *</label>
                    <input type="text" value={docRegistry} onChange={e => setDocRegistry(e.target.value)} required />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary">Registrar Médico</button>
              </form>
            )}
          </div>

          {/* Directory Active Listings */}
          <div className="glass-panel" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FolderSync style={{ color: 'hsl(var(--accent))' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Directorio Clínico Registrado</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <h4 style={{ fontWeight: 700, color: 'hsl(var(--primary))', marginBottom: '0.5rem' }}>Pacientes ({mockPatients.length})</h4>
                <div className="table-container" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  <table className="medical-table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>RUT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockPatients.map(p => (
                        <tr key={p.idPaciente}>
                          <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.nombreCompleto}</td>
                          <td style={{ fontSize: '0.85rem' }}><code>{p.rut}</code></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 style={{ fontWeight: 700, color: 'hsl(var(--primary))', marginBottom: '0.5rem' }}>Médicos ({mockDoctors.length})</h4>
                <div className="table-container" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  <table className="medical-table">
                    <thead>
                      <tr>
                        <th>Médico</th>
                        <th>Especialidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockDoctors.map(d => (
                        <tr key={d.idProfesional}>
                          <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>{d.nombreCompleto}</td>
                          <td style={{ fontSize: '0.85rem' }}>{d.especialidad}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

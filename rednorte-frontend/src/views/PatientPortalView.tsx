import React, { useState, useEffect } from 'react';
import { useWaitingList, useAppointments } from '../observer/ObserverContext';
import { mockPatients, mockMedicalAttentions, mockDoctors } from '../mockData';
import type { Paciente } from '../mockData';
import { User, Shield, CheckCircle, FileText, PlusCircle, Calendar, Trash2, Bell } from 'lucide-react';

interface PatientPortalViewProps {
  patient: Paciente;
  onLogout: () => void;
}

export const PatientPortalView: React.FC<PatientPortalViewProps> = ({ patient, onLogout }) => {
  const { requests } = useWaitingList();
  const { appointments, cancelAppointment, requestAppointment } = useAppointments();

  // Edit contact info state
  const [phone, setPhone] = useState(patient.telefono);
  const [email, setEmail] = useState(patient.email);
  const [address, setAddress] = useState(patient.direccion);

  // Appointment Request form state
  const [reqSpecialty, setReqSpecialty] = useState('Cardiología');
  const [reqSeverity, setReqSeverity] = useState(3);
  const [reqSymptoms, setReqSymptoms] = useState('');

  // Informed Consent state
  const [isSigned, setIsSigned] = useState(false);
  const [consentSaved, setConsentSaved] = useState(false);
  const [signedDate, setSignedDate] = useState('');

  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    fetch(`http://localhost:8080/api/timeline/${patient.rut}`)
      .then(res => res.json())
      .then(data => {
        if (data.notifications) {
          setNotifications(data.notifications);
        }
      })
      .catch(err => console.error("Error fetching patient timeline notifications:", err));
  }, [appointments, requests, patient.rut]);

  // Update contact info handler
  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch(`http://localhost:8080/api/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...patient,
          telefono: phone,
          email: email,
          direccion: address
        })
      });
      if (res.ok) {
        alert('Información de contacto actualizada con éxito.');
      }
    } catch (err) {
      console.error(err);
      alert('Error al actualizar datos.');
    }
  };

  // Submit appointment request
  const handleRequestAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqSymptoms) {
      alert('Por favor describa sus síntomas o motivo de consulta.');
      return;
    }

    const res = await requestAppointment(patient.idPaciente, reqSpecialty, reqSeverity, reqSymptoms, mockPatients);
    
    if (res.status === 'ASSIGNED') {
      alert(`¡Cita médica CONFIRMADA automáticamente!\nAsignada con éxito. Horario: ${new Date(res.data.fechaHoraProgramada).toLocaleString('es-CL')}\nUbicación: Edificio Central, Box 102.`);
    } else if (res.status === 'WAITLIST') {
      alert(`No hay cupos disponibles de inmediato.\nHas sido ingresado a la LISTA DE ESPERA en la especialidad de ${reqSpecialty}.\nPuntaje de Prioridad Calculado: ${res.data.prioridadCalculada} / 100.`);
    } else {
      alert('Error al procesar la solicitud.');
    }

    // Reset request form
    setReqSymptoms('');
  };

  // Submit cancellation - this triggers Observer reallocations
  const handleCancelAppointment = (idCita: number, doctorSpecialty: string) => {
    const reason = window.prompt('Ingrese el motivo de la cancelación de su hora médica:');
    if (reason === null) return; // Cancelled prompt
    if (!reason.trim()) {
      alert('Debe ingresar un motivo para cancelar la cita.');
      return;
    }

    cancelAppointment(idCita, reason, mockPatients, doctorSpecialty);
    alert('Cita cancelada con éxito. Se ha notificado al sistema para la reasignación automática.');
  };

  // Get current patient requests
  const patientRequests = requests.filter(r => r.idPaciente === patient.idPaciente);

  // Get patient appointments
  const patientAppointments = appointments.filter(
    c => c.idPaciente === patient.idPaciente && c.estadoCita !== 'CANCELADA'
  );

  // Get patient medical attentions (recipes, etc)
  const patientAttentions = mockMedicalAttentions.filter(a => {
    const linkedAppt = appointments.find(c => c.idCita === a.idCita);
    return linkedAppt ? linkedAppt.idPaciente === patient.idPaciente : false;
  });

  // Sign informed consent
  const handleSignConsent = () => {
    setIsSigned(prev => !prev);
  };

  const handleSaveConsent = () => {
    if (!isSigned) {
      alert('Debe firmar el documento para guardarlo.');
      return;
    }
    setConsentSaved(true);
    setSignedDate(new Date().toLocaleString('es-CL'));
    alert('Consentimiento informado registrado y guardado en su ficha clínica.');
  };

  // Helper getters
  const getDoctorName = (idDoctor: number) => {
    const d = mockDoctors.find(x => x.idProfesional === idDoctor);
    return d ? d.nombreCompleto : `Médico #${idDoctor}`;
  };

  const getDoctorSpecialty = (idDoctor: number) => {
    const d = mockDoctors.find(x => x.idProfesional === idDoctor);
    return d ? d.especialidad : 'General';
  };

  return (
    <div className="main-content">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Mi Portal de Paciente: {patient.nombreCompleto}</h1>
          <p className="page-description">
            RUT: {patient.rut} | Sistema de Salud: {patient.prevision}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={onLogout}>
          Cerrar Sesión
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        
        {/* Left Column: Status, Appointments, Request form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Active Appointments */}
          <div className="glass-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Calendar style={{ color: 'hsl(var(--primary))' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Mis Horas Médicas Asignadas</h2>
            </div>
            {patientAppointments.length === 0 ? (
              <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem' }}>
                Usted no registra citas activas programadas en este momento. Solicite una hora abajo.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {patientAppointments.map(appt => (
                  <div key={appt.idCita} style={{ border: '1px solid hsl(var(--border-color))', borderRadius: 'var(--radius-sm)', padding: '1rem', backgroundColor: 'hsl(var(--bg-card))' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                        📆 {new Date(appt.fechaHoraProgramada).toLocaleString('es-CL', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })} hrs
                      </span>
                      <span className={`badge ${appt.estadoCita.toLowerCase()}`}>
                        {appt.estadoCita}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.875rem' }}>
                      <strong>Médico:</strong> {getDoctorName(appt.idProfesional)} ({getDoctorSpecialty(appt.idProfesional)})
                    </p>
                    <p style={{ fontSize: '0.875rem', color: 'hsl(var(--text-muted))' }}>
                      <strong>Lugar:</strong> Centro Médico RedNorte - Box 102 (Piso 1)
                    </p>
                    {appt.estadoCita !== 'COMPLETADA' && (
                      <button 
                        className="btn btn-danger" 
                        onClick={() => handleCancelAppointment(appt.idCita, getDoctorSpecialty(appt.idProfesional))}
                        style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem', marginTop: '0.75rem', width: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <Trash2 size={12} />
                        Cancelar Hora
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Request Medical Appointment Form */}
          <div className="glass-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <PlusCircle style={{ color: 'hsl(var(--primary))' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Solicitar Nueva Hora Médica</h2>
            </div>
            
            <form onSubmit={handleRequestAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Especialidad Requerida *</label>
                <select value={reqSpecialty} onChange={e => setReqSpecialty(e.target.value)}>
                  <option value="Cardiología">Cardiología (Dra. Karen Fuentealba)</option>
                  <option value="Traumatología">Traumatología (Dr. Tomás Del Fierro)</option>
                  <option value="Oftalmología">Oftalmología (Dra. María José Arancibia)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Nivel de Urgencia Estimado *</label>
                <select value={reqSeverity} onChange={e => setReqSeverity(Number(e.target.value))}>
                  <option value="1">1 - Control de Rutina / Receta</option>
                  <option value="2">2 - Molestia Leve</option>
                  <option value="3">3 - Dolor Moderado</option>
                  <option value="4">4 - Síntomas Agudos / Severos</option>
                  <option value="5">5 - Emergencia Crítica</option>
                </select>
              </div>

              <div className="form-group">
                <label>Sintomatología / Motivo de Consulta *</label>
                <textarea
                  rows={2}
                  placeholder="Describa brevemente qué síntomas presenta..."
                  value={reqSymptoms}
                  onChange={e => setReqSymptoms(e.target.value)}
                  required
                />
              </div>

              <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'hsl(var(--bg-main) / 0.5)', borderRadius: '4px', fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                ℹ️ El sistema buscará cupo disponible inmediato. De no haberlo, te asignará a la Lista de Espera con prioridad calculada de forma justa.
              </div>

              <button type="submit" className="btn btn-primary">
                Solicitar y Asignar Hora
              </button>
            </form>
          </div>

          {/* Waitlist Status */}
          <div className="glass-panel">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: 'hsl(var(--primary))' }}>
              Mis Solicitudes Activas en Lista de Espera
            </h2>
            {patientRequests.length === 0 ? (
              <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem' }}>
                Usted no tiene solicitudes pendientes en la lista de espera activa.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {patientRequests.map(req => (
                  <div key={req.idSolicitud} style={{ border: '1px solid hsl(var(--border-color))', borderRadius: 'var(--radius-sm)', padding: '1rem', backgroundColor: 'hsl(var(--bg-card))' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Especialidad: {req.especialidadRequerida}</h4>
                        <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Fecha: {req.fechaSolicitud}</span>
                      </div>
                      <span className={`badge ${req.estado.toLowerCase()}`}>
                        {req.estado}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem' }}>
                      <p><strong>Diagnóstico Preliminar:</strong> {req.diagnosticoPreliminar}</p>
                      <p><strong>Prioridad Calculada:</strong> {req.prioridadCalculada} / 100</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Profile edit, Consent, History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Ficha de Datos Personales */}
          <div className="glass-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <User style={{ color: 'hsl(var(--primary))' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Ficha de Datos Personales</h2>
            </div>
            
            <div style={{ fontSize: '0.9rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <p><strong>Nombre:</strong> {patient.nombreCompleto}</p>
              <p><strong>RUT:</strong> {patient.rut}</p>
              <p><strong>Fecha de Nacimiento:</strong> {patient.fechaNacimiento}</p>
              <p><strong>Previsión de Salud:</strong> {patient.prevision}</p>
            </div>

            <form onSubmit={handleUpdateContact} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'hsl(var(--primary))', borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '0.25rem' }}>
                Actualizar Datos de Contacto
              </h4>
              <div className="form-group">
                <label>Teléfono Móvil</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email de Contacto</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Dirección Residencia</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                Guardar Cambios
              </button>
            </form>
          </div>

          {/* Informed Consent (Ley 20.584) */}
          <div className="glass-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Shield style={{ color: 'hsl(var(--accent))' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Consentimiento Informado (Ley N°20.584)</h2>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', marginBottom: '1rem' }}>
              Conforme al Art. 14 de la Ley N°20.584, el paciente debe manifestar su consentimiento libre para someterse a tratamientos o procedimientos quirúrgicos.
            </p>

            <div className="consent-document">
              <h4 style={{ textAlign: 'center', marginBottom: '0.5rem', fontWeight: 700 }}>ACTA DE CONSENTIMIENTO INFORMADO</h4>
              <p>
                Yo, <strong>{patient.nombreCompleto}</strong>, con RUT <strong>{patient.rut}</strong>, declaro que he sido informado de forma libre, voluntaria, expresa e instruida acerca del tratamiento propuesto en el Servicio Clínico de RedNorte.
              </p>
              <p style={{ marginTop: '0.5rem' }}>
                Comprendo los beneficios esperados, riesgos generales inherentes al procedimiento (incluyendo efectos secundarios y complicaciones del tratamiento) y las alternativas clínicas disponibles. Autorizo a los profesionales de salud del establecimiento a realizar las intervenciones prescritas en mi ficha médica.
              </p>
            </div>

            {consentSaved ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', padding: '1rem', backgroundColor: 'hsl(var(--accent) / 0.15)', border: '1px solid hsl(var(--accent) / 0.3)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--accent))', fontWeight: 700 }}>
                  <CheckCircle size={20} />
                  <span>Consentimiento Firmado</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', textAlign: 'center' }}>
                  Registrado digitalmente el {signedDate}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div 
                  onClick={handleSignConsent}
                  className={`consent-signature ${isSigned ? 'signed' : ''}`}
                >
                  {isSigned ? (
                    <div>
                      <p style={{ fontWeight: 700 }}>✓ FIRMA DIGITAL REGISTRADA</p>
                      <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>Haga clic para remover la firma</p>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontWeight: 600 }}>HAGA CLIC AQUÍ PARA FIRMAR DIGITALMENTE</p>
                      <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Confirma consentimiento para procedimientos clínicos</p>
                    </div>
                  )}
                </div>
                <button 
                  className="btn btn-primary"
                  onClick={handleSaveConsent}
                  disabled={!isSigned}
                >
                  Enviar Consentimiento
                </button>
              </div>
            )}
          </div>

          {/* Historical Consultation and Recipes */}
          <div className="glass-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <FileText style={{ color: 'hsl(var(--primary))' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Historial Clínico de Consultas</h2>
            </div>
            {patientAttentions.length === 0 ? (
              <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem' }}>
                No registra atenciones finalizadas anteriormente.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {patientAttentions.map(att => (
                  <div key={att.idAtencion} style={{ border: '1px solid hsl(var(--border-color))', borderRadius: 'var(--radius-sm)', padding: '1rem', backgroundColor: 'hsl(var(--bg-main) / 0.2)' }}>
                    <h4 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      Consulta - {att.fechaAtencion}
                    </h4>
                    <div style={{ fontSize: '0.875rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <p><strong>Diagnóstico Final:</strong> {att.diagnosticoFinal}</p>
                      <p><strong>Tratamiento:</strong> {att.tratamientoIndicado}</p>
                      <div style={{ padding: '0.5rem', backgroundColor: 'hsl(var(--bg-card))', borderLeft: '3px solid hsl(var(--accent))', borderRadius: '4px' }}>
                        <p style={{ fontSize: '0.8rem', fontWeight: 600 }}>Receta Médica:</p>
                        <p style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>{att.recetaMedica}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notifications / Informed patient logs */}
          <div className="glass-panel" style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Bell style={{ color: 'hsl(var(--accent))' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Notificaciones de Canales Digitales (SMS / Email)</h2>
            </div>
            {notifications.length === 0 ? (
              <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem' }}>
                No registra notificaciones enviadas recientemente.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {notifications.map((notif: any) => (
                  <div key={notif.idNotification} style={{ border: '1px solid hsl(var(--border-color))', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', backgroundColor: 'hsl(var(--bg-main) / 0.1)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                      <span className={`badge ${notif.tipoCanal === 'SMS' ? 'assigned' : 'completed'}`} style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}>
                        {notif.tipoCanal}
                      </span>
                      <code style={{ fontSize: '0.75rem', opacity: 0.8 }}>{notif.fechaEnvio.split('T')[0]}</code>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>
                      Destino: <code>{notif.destinatario}</code>
                    </div>
                    <p style={{ fontSize: '0.85rem', whiteSpace: 'pre-line', margin: '0.25rem 0 0 0' }}>
                      {notif.mensaje}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

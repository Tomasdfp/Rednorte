import React, { useState, useEffect } from 'react';
import { useAppointments } from '../observer/ObserverContext';
import { mockPatients, mockMedicalAttentions } from '../mockData';
import type { Cita, Paciente, AtencionMedica } from '../mockData';
import { Calendar, FileText, ClipboardList, Activity, Bell } from 'lucide-react';

interface DoctorPortalViewProps {
  doctor: {
    idProfesional: number;
    rut: string;
    nombreCompleto: string;
    especialidad: string;
    registroNacional: string;
    horarioAtencion: string;
    disponible: boolean;
  };
  onLogout: () => void;
}

export const DoctorPortalView: React.FC<DoctorPortalViewProps> = ({ doctor, onLogout }) => {
  const { appointments, latestNotification } = useAppointments();

  // Selected patient details state
  const [selectedPatient, setSelectedPatient] = useState<Paciente | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Cita | null>(null);

  // Diagnosis form states
  const [diagnosticoFinal, setDiagnosticoFinal] = useState('');
  const [tratamientoIndicado, setTratamientoIndicado] = useState('');
  const [recetaMedica, setRecetaMedica] = useState('');
  const [certificadoEmitido, setCertificadoEmitido] = useState(false);
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);

  // Local check-in alert banner state
  const [checkInAlert, setCheckInAlert] = useState<string | null>(null);

  // Observer listener inside Doctor view for real-time patient check-ins
  useEffect(() => {
    if (
      latestNotification && 
      latestNotification.type === 'ARRIVED' && 
      latestNotification.details.idProfesional === doctor.idProfesional
    ) {
      setCheckInAlert(
        `¡Su paciente ${latestNotification.details.patientName} ha llegado y está en Sala de Espera!`
      );
      
      const timer = setTimeout(() => {
        setCheckInAlert(null);
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [latestNotification, doctor.idProfesional]);

  // Filter appointments for this doctor
  const doctorAppointments = appointments.filter(
    c => c.idProfesional === doctor.idProfesional && c.estadoCita !== 'CANCELADA'
  );

  const getPatientDetails = (idPaciente: number) => {
    return mockPatients.find(p => p.idPaciente === idPaciente);
  };

  const handleOpenPatientFile = (appt: Cita) => {
    const patient = getPatientDetails(appt.idPaciente);
    if (patient) {
      setSelectedPatient(patient);
      setSelectedAppointment(appt);
      setDiagnosticoFinal('');
      setTratamientoIndicado('');
      setRecetaMedica('');
      setCertificadoEmitido(false);
      setIsConsultationModalOpen(true);
    }
  };

  const handleCompleteAttentionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment || !selectedPatient || !diagnosticoFinal) {
      alert('Por favor ingrese al menos el diagnóstico final.');
      return;
    }

    const newAttentionId = mockMedicalAttentions.reduce((max, a) => Math.max(max, a.idAtencion), 0) + 1;
    const newAttention: AtencionMedica = {
      idAtencion: newAttentionId,
      idCita: selectedAppointment.idCita,
      fechaAtencion: new Date().toISOString().split('T')[0],
      diagnosticoFinal,
      tratamientoIndicado,
      recetaMedica,
      certificadoEmitido
    };

    mockMedicalAttentions.push(newAttention);

    // Mutate state locally
    selectedAppointment.estadoCita = 'COMPLETADA';
    
    alert(`Atención registrada con éxito. Cita #${selectedAppointment.idCita} marcada como COMPLETADA.`);
    setIsConsultationModalOpen(false);
    setSelectedPatient(null);
    setSelectedAppointment(null);
  };

  return (
    <div className="main-content">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Portal Médico: {doctor.nombreCompleto}</h1>
          <p className="page-description">
            Especialidad de {doctor.especialidad} | Registro Nacional N° {doctor.registroNacional}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={onLogout}>
          Cerrar Sesión
        </button>
      </div>

      {/* Real-time check-in alert inside Doctor Portal */}
      {checkInAlert && (
        <div className="glass-panel" style={{
          backgroundColor: 'hsl(var(--accent) / 0.15)',
          borderLeft: '4px solid hsl(var(--accent))',
          padding: '1rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          animation: 'slideIn 0.3s ease-out',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'hsl(var(--text-main))' }}>
            <Bell size={20} className="toast-icon" style={{ backgroundColor: 'hsl(var(--accent) / 0.2)', color: 'hsl(var(--accent))' }} />
            <span style={{ fontWeight: 600 }}>{checkInAlert}</span>
          </div>
          <button 
            onClick={() => setCheckInAlert(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))' }}
          >
            ×
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        {/* Doctor Info */}
        <div className="glass-panel" style={{ height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <Activity style={{ color: 'hsl(var(--primary))' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Mi Perfil Profesional</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.95rem' }}>
            <p><strong>Médico:</strong> {doctor.nombreCompleto}</p>
            <p><strong>RUT:</strong> {doctor.rut}</p>
            <p><strong>Especialidad:</strong> {doctor.especialidad}</p>
            <p><strong>Registro Nacional:</strong> <code>{doctor.registroNacional}</code></p>
            <p><strong>Horarios:</strong> {doctor.horarioAtencion}</p>
            <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <strong>Estado:</strong> 
              <span className="badge assigned">Activo</span>
            </p>
          </div>
        </div>

        {/* Doctor Agenda */}
        <div className="glass-panel" style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Calendar style={{ color: 'hsl(var(--primary))' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Agenda de Pacientes Asignados</h2>
          </div>

          <div className="table-container">
            <table className="medical-table">
              <thead>
                <tr>
                  <th>Cita ID</th>
                  <th>Paciente</th>
                  <th>RUT Paciente</th>
                  <th>Hora Cita</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {doctorAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'hsl(var(--text-muted))', padding: '2rem' }}>
                      No registra citas programadas para hoy.
                    </td>
                  </tr>
                ) : (
                  doctorAppointments.map(appt => {
                    const patient = getPatientDetails(appt.idPaciente);
                    const isPresent = appt.estadoCita === 'PRESENTE';
                    return (
                      <tr key={appt.idCita} style={isPresent ? { backgroundColor: 'hsl(var(--accent) / 0.05)' } : {}}>
                        <td>#{appt.idCita}</td>
                        <td style={{ fontWeight: 600 }}>{patient?.nombreCompleto || `Paciente #${appt.idPaciente}`}</td>
                        <td>{patient?.rut || '-'}</td>
                        <td>
                          <code>{new Date(appt.fechaHoraProgramada).toLocaleTimeString('es-CL', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })} hrs</code>
                        </td>
                        <td>
                          {isPresent ? (
                            <span className="badge" style={{ backgroundColor: 'hsl(var(--accent))', color: 'white', border: 'none' }}>
                              En Sala de Espera
                            </span>
                          ) : (
                            <span className={`badge ${appt.estadoCita.toLowerCase()}`}>
                              {appt.estadoCita}
                            </span>
                          )}
                        </td>
                        <td>
                          {appt.estadoCita === 'COMPLETADA' ? (
                            <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>Atención Completada</span>
                          ) : (
                            <button
                              className="btn btn-primary"
                              onClick={() => handleOpenPatientFile(appt)}
                              style={{ 
                                padding: '0.4rem 0.8rem', 
                                fontSize: '0.85rem',
                                boxShadow: isPresent ? '0 0 10px hsl(var(--accent) / 0.4)' : 'none',
                                animation: isPresent ? 'pulse 2s infinite' : 'none'
                              }}
                            >
                              <ClipboardList size={14} />
                              Atender
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Patient consultation and diagnosis Modal */}
      {isConsultationModalOpen && selectedPatient && selectedAppointment && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px', width: '95%' }}>
            <div className="modal-header">
              <h3 className="modal-title">Ficha Clínica & Registro de Atención</h3>
              <button className="close-btn" onClick={() => setIsConsultationModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleCompleteAttentionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Patient General Info */}
              <div style={{ backgroundColor: 'hsl(var(--bg-main) / 0.5)', padding: '1rem', borderRadius: 'var(--radius-sm)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
                <p><strong>Paciente:</strong> {selectedPatient.nombreCompleto}</p>
                <p><strong>RUT:</strong> {selectedPatient.rut}</p>
                <p><strong>Edad:</strong> {new Date().getFullYear() - new Date(selectedPatient.fechaNacimiento).getFullYear()} años</p>
                <p><strong>Previsión:</strong> {selectedPatient.prevision}</p>
                <p><strong>Contacto:</strong> {selectedPatient.telefono}</p>
                <p><strong>Email:</strong> {selectedPatient.email}</p>
                <p style={{ gridColumn: 'span 2' }}><strong>Sintomatología / Obs Cita:</strong> {selectedAppointment.observaciones}</p>
              </div>

              {/* Diagnosis Form */}
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'hsl(var(--primary))', borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '0.25rem' }}>
                Registro Clínico de la Consulta
              </h4>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <FileText size={14} />
                  Diagnóstico Médico Final *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Cardiopatía coronaria leve, Esguince de tobillo tipo II..."
                  value={diagnosticoFinal}
                  onChange={e => setDiagnosticoFinal(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Tratamiento Indicado</label>
                <textarea
                  rows={2}
                  placeholder="Instrucciones de reposo, reposo relativo..."
                  value={tratamientoIndicado}
                  onChange={e => setTratamientoIndicado(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Receta Médica / Prescripción de Fármacos</label>
                <textarea
                  rows={2}
                  placeholder="Medicamento, Dosis, Frecuencia..."
                  value={recetaMedica}
                  onChange={e => setRecetaMedica(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="cert"
                  checked={certificadoEmitido}
                  onChange={e => setCertificadoEmitido(e.target.checked)}
                  style={{ width: 'auto', cursor: 'pointer' }}
                />
                <label htmlFor="cert" style={{ cursor: 'pointer', fontSize: '0.9rem' }}>Emitir Certificado de Asistencia</label>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsConsultationModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Completar Consulta Médica
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

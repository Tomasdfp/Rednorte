import React, { useState } from 'react';
import { useAppointments } from '../observer/ObserverContext';
import { mockDoctors, mockPatients } from '../mockData';
import { Calendar, Trash2, RefreshCw, Clock } from 'lucide-react';

export const ReassignmentView: React.FC = () => {
  const { appointments, logs, cancelAppointment, resetAllData } = useAppointments();

  // Local state for modal
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Helper getters
  const getPatientName = (idPaciente: number) => {
    const p = mockPatients.find(x => x.idPaciente === idPaciente);
    return p ? p.nombreCompleto : `Paciente #${idPaciente}`;
  };

  const getDoctorName = (idDoctor: number) => {
    const d = mockDoctors.find(x => x.idProfesional === idDoctor);
    return d ? d.nombreCompleto : `Médico #${idDoctor}`;
  };

  const getDoctorSpecialty = (idDoctor: number) => {
    const d = mockDoctors.find(x => x.idProfesional === idDoctor);
    return d ? d.especialidad : 'General';
  };

  const getAppointmentDetails = (idCita: number) => {
    return appointments.find(c => c.idCita === idCita);
  };

  // Open modal handler
  const handleOpenCancelModal = (idCita: number) => {
    setSelectedAppointmentId(idCita);
    setCancellationReason('');
    setIsModalOpen(true);
  };

  // Submit cancellation
  const handleConfirmCancel = () => {
    if (!selectedAppointmentId || !cancellationReason) {
      alert('Por favor ingrese el motivo de cancelación.');
      return;
    }

    const appt = getAppointmentDetails(selectedAppointmentId);
    if (!appt) return;

    const specialty = getDoctorSpecialty(appt.idProfesional);

    // Call cancellation through the Subject - this executes the Observer trigger in the background
    cancelAppointment(selectedAppointmentId, cancellationReason, mockPatients, specialty);
    
    // Close modal
    setIsModalOpen(false);
    setSelectedAppointmentId(null);
  };

  const activeAppointments = appointments.filter(c => c.estadoCita !== 'CANCELADA');

  return (
    <div className="main-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Sistema de Reasignación Automática</h1>
          <p className="page-description">
            Gestión inteligente de vacantes médicas y reasignación de horas críticas por cancelación.
          </p>
        </div>
        <button 
          className="btn btn-secondary" 
          onClick={() => {
            if(window.confirm('¿Está seguro de reiniciar todos los datos a sus valores iniciales?')) {
              resetAllData();
            }
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <RefreshCw size={16} />
          Reiniciar Simulación
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        
        {/* Appointments Table */}
        <div className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Calendar style={{ color: 'hsl(var(--primary))' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Agenda del Día (Horas Médicas Programadas)</h2>
          </div>

          <div className="table-container">
            <table className="medical-table">
              <thead>
                <tr>
                  <th>Cita ID</th>
                  <th>Paciente</th>
                  <th>Profesional</th>
                  <th>Especialidad</th>
                  <th>Fecha / Hora</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {activeAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'hsl(var(--text-muted))', padding: '2rem' }}>
                      No hay citas programadas actualmente.
                    </td>
                  </tr>
                ) : (
                  activeAppointments.map(appt => (
                    <tr key={appt.idCita}>
                      <td>#{appt.idCita}</td>
                      <td style={{ fontWeight: 600 }}>{getPatientName(appt.idPaciente)}</td>
                      <td>{getDoctorName(appt.idProfesional)}</td>
                      <td>{getDoctorSpecialty(appt.idProfesional)}</td>
                      <td>
                        <code>{new Date(appt.fechaHoraProgramada).toLocaleString('es-CL', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</code>
                      </td>
                      <td>
                        <span className={`badge ${appt.estadoCita.toLowerCase()}`}>
                          {appt.estadoCita}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn btn-danger" 
                          onClick={() => handleOpenCancelModal(appt.idCita)}
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                        >
                          <Trash2 size={14} />
                          Cancelar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reassignment Logs Table */}
        <div className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <RefreshCw style={{ color: 'hsl(var(--accent))' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Bitácora de Reasignación Automática (Logs del Algoritmo)</h2>
          </div>

          <div className="table-container">
            <table className="medical-table">
              <thead>
                <tr>
                  <th>Log ID</th>
                  <th>Fecha/Hora</th>
                  <th>Cita Cancelada</th>
                  <th>Cita Reasignada</th>
                  <th>Paciente Original</th>
                  <th>Paciente Reasignado</th>
                  <th>Especialidad</th>
                  <th>Algoritmo</th>
                  <th>Procesamiento</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', color: 'hsl(var(--text-muted))', padding: '2rem' }}>
                      No hay reasignaciones registradas aún. Cancele una cita programada arriba.
                    </td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.idLog}>
                      <td>#{log.idLog}</td>
                      <td>
                        <span style={{ fontSize: '0.85rem' }}>
                          {new Date(log.fechaEvento).toLocaleTimeString('es-CL')}
                        </span>
                      </td>
                      <td><code>Cita #{log.citaOriginal}</code></td>
                      <td><code>Cita #{log.citaReasignada}</code></td>
                      <td style={{ textDecoration: 'line-through', color: 'hsl(var(--text-muted))' }}>
                        {log.nombrePacienteOriginal}
                      </td>
                      <td style={{ fontWeight: 600, color: 'hsl(var(--accent))' }}>
                        {log.nombrePacienteReasignado}
                      </td>
                      <td>{log.especialidad}</td>
                      <td>
                        <span className="badge pending" style={{ textTransform: 'none' }}>
                          {log.algoritmoUsado}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'hsl(var(--accent))', fontWeight: 600 }}>
                          <Clock size={12} />
                          <span>{log.tiempoProcesamiento} ms</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Cancellation Modal */}
      {isModalOpen && selectedAppointmentId !== null && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Cancelar Cita Médica</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.9rem', color: 'hsl(var(--text-muted))' }}>Cita seleccionada:</p>
                <p style={{ fontWeight: 600 }}>
                  ID #{selectedAppointmentId} - {getPatientName(getAppointmentDetails(selectedAppointmentId)?.idPaciente || 0)}
                </p>
                <p style={{ fontSize: '0.85rem' }}>
                  Con {getDoctorName(getAppointmentDetails(selectedAppointmentId)?.idProfesional || 0)} ({getDoctorSpecialty(getAppointmentDetails(selectedAppointmentId)?.idProfesional || 0)})
                </p>
              </div>

              <div className="form-group">
                <label>Motivo de la Cancelación *</label>
                <textarea
                  rows={3}
                  placeholder="Ej: Paciente presenta licencia laboral / Solicitud de cambio de fecha..."
                  value={cancellationReason}
                  onChange={e => setCancellationReason(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', padding: '0.75rem', backgroundColor: 'hsl(var(--primary-glow))', borderRadius: 'var(--radius-sm)' }}>
                <Clock size={20} style={{ color: 'hsl(var(--primary))', flexShrink: 0, marginTop: '2px' }} />
                <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>
                  <strong>Simulación:</strong> Al confirmar, el sistema de forma asíncrona reasignará esta hora al paciente con mayor prioridad clínica en la especialidad de {getDoctorSpecialty(getAppointmentDetails(selectedAppointmentId)?.idProfesional || 0)}.
                </p>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleConfirmCancel}
                disabled={!cancellationReason}
              >
                Confirmar Cancelación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

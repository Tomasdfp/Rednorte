import React from 'react';
import { useWaitingList, useAppointments } from '../observer/ObserverContext';
import { mockDoctors } from '../mockData';
import { Users, Clock, ArrowLeftRight, CheckCircle, ShieldAlert } from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { requests } = useWaitingList();
  const { logs } = useAppointments();

  const pendingCount = requests.filter(r => r.estado === 'PENDIENTE').length;
  const reassignmentsCount = logs.length;
  
  // Calculate average priority
  const avgPriority = requests.length > 0 
    ? Math.round(requests.reduce((acc, curr) => acc + curr.prioridadCalculada, 0) / requests.length)
    : 0;

  return (
    <div className="main-content">
      <div>
        <h1 className="page-title">Dashboard RedNorte</h1>
        <p className="page-description">
          Consola de Control de Listas de Espera y Optimización de Consultas Médicas.
        </p>
      </div>

      <div className="kpi-grid">
        <div className="glass-panel kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-label">Pacientes en Espera</span>
            <Users size={20} style={{ color: 'hsl(var(--primary))' }} />
          </div>
          <span className="kpi-value">{pendingCount}</span>
          <span className="kpi-trend up">Solicitudes activas</span>
        </div>

        <div className="glass-panel kpi-card accent">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-label">Reasignaciones Exitosas</span>
            <ArrowLeftRight size={20} style={{ color: 'hsl(var(--accent))' }} />
          </div>
          <span className="kpi-value">{reassignmentsCount}</span>
          <span className="kpi-trend up" style={{ color: 'hsl(var(--accent))' }}>Evitan pérdida de horas</span>
        </div>

        <div className="glass-panel kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-label">Prioridad Promedio</span>
            <Clock size={20} style={{ color: 'hsl(var(--primary))' }} />
          </div>
          <span className="kpi-value">{avgPriority} / 100</span>
          <span className="kpi-trend">Gravedad ponderada</span>
        </div>

        <div className="glass-panel kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-label">Tasa de Asignación</span>
            <CheckCircle size={20} style={{ color: 'hsl(var(--accent))' }} />
          </div>
          <span className="kpi-value">
            {requests.length > 0 
              ? Math.round((requests.filter(r => r.estado === 'ASIGNADA' || r.estado === 'ATENDIDA').length / requests.length) * 100) 
              : 0}%
          </span>
          <span className="kpi-trend up">Eficiencia del servicio</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        <div className="glass-panel">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>Personal de Salud en Servicio</h2>
          <div className="table-container">
            <table className="medical-table">
              <thead>
                <tr>
                  <th>Profesional</th>
                  <th>Especialidad</th>
                  <th>N° Registro</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {mockDoctors.map(doctor => (
                  <tr key={doctor.idProfesional}>
                    <td style={{ fontWeight: 600 }}>{doctor.nombreCompleto}</td>
                    <td>{doctor.especialidad}</td>
                    <td><code>{doctor.registroNacional}</code></td>
                    <td>
                      <span className="badge assigned">
                        Activo
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-panel">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>Cumplimiento de Leyes Sanitarias</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <ShieldAlert size={24} style={{ color: 'hsl(var(--primary))', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ fontWeight: 600 }}>Ley N°20.584: Derechos y Deberes</h4>
                <p style={{ fontSize: '0.875rem', color: 'hsl(var(--text-muted))' }}>
                  El portal del paciente garantiza el acceso a la información del estado de su solicitud de forma transparente y segura.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <ShieldAlert size={24} style={{ color: 'hsl(var(--primary))', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ fontWeight: 600 }}>Art. 14: Consentimiento Informado</h4>
                <p style={{ fontSize: '0.875rem', color: 'hsl(var(--text-muted))' }}>
                  Todos los procedimientos médicos requieren firma de consentimiento libre y voluntario por parte del paciente.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <ShieldAlert size={24} style={{ color: 'hsl(var(--primary))', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ fontWeight: 600 }}>Ley de Interoperabilidad</h4>
                <p style={{ fontSize: '0.875rem', color: 'hsl(var(--text-muted))' }}>
                  Los datos de registro y especialidad médica son validados contra los registros nacionales correspondientes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useAppointments } from './observer/ObserverContext';
import { LoginView } from './views/LoginView';
import { DoctorPortalView } from './views/DoctorPortalView';
import { PatientPortalView } from './views/PatientPortalView';
import { ReceptionistPortalView } from './views/ReceptionistPortalView';
import { 
  Bell, 
  X, 
  HeartHandshake,
  LogOut,
  Stethoscope,
  UserCheck
} from 'lucide-react';

export const App: React.FC = () => {
  // Session authentication state
  const [currentUser, setCurrentUser] = useState<{
    role: 'patient' | 'doctor' | 'receptionist';
    data: any;
  } | null>(null);
  
  // Real-time Observer notifications
  const { latestNotification } = useAppointments();
  const [showToast, setShowToast] = useState(false);
  const [toastData, setToastData] = useState<any>(null);

  // Observer listener for cancellation & reallocations & arrivals
  useEffect(() => {
    if (latestNotification) {
      setToastData(latestNotification);
      setShowToast(true);

      const timer = setTimeout(() => {
        setShowToast(false);
      }, 7000);

      return () => clearTimeout(timer);
    }
  }, [latestNotification]);

  // Logout handler
  const handleLogout = () => {
    setCurrentUser(null);
  };

  // 1. Render Login Portal if not authenticated
  if (currentUser === null) {
    return <LoginView onLogin={(user) => setCurrentUser(user)} />;
  }

  // 2. Render Patient View
  if (currentUser.role === 'patient') {
    return (
      <div className="app-container">
        <aside className="sidebar">
          <div className="brand">
            <HeartHandshake size={28} style={{ strokeWidth: 2.5 }} />
            <span>RedNorte</span>
          </div>
          <nav>
            <ul className="nav-links">
              <li className="nav-item active">
                <button>
                  <UserCheck />
                  Mi Portal
                </button>
              </li>
            </ul>
          </nav>
          <div className="sidebar-footer">
            <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <p style={{ fontWeight: 600, color: 'hsl(var(--primary))' }}>{currentUser.data.nombreCompleto}</p>
              <p>Rol: Paciente</p>
              <button className="btn btn-secondary" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem' }}>
                <LogOut size={14} />
                Salir
              </button>
            </div>
          </div>
        </aside>

        <PatientPortalView patient={currentUser.data} onLogout={handleLogout} />
      </div>
    );
  }

  // 3. Render Doctor View
  if (currentUser.role === 'doctor') {
    return (
      <div className="app-container">
        <aside className="sidebar">
          <div className="brand">
            <HeartHandshake size={28} style={{ strokeWidth: 2.5 }} />
            <span>RedNorte</span>
          </div>
          <nav>
            <ul className="nav-links">
              <li className="nav-item active">
                <button>
                  <Stethoscope />
                  Agenda Médica
                </button>
              </li>
            </ul>
          </nav>
          <div className="sidebar-footer">
            <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <p style={{ fontWeight: 600, color: 'hsl(var(--primary))' }}>{currentUser.data.nombreCompleto}</p>
              <p>Rol: Médico</p>
              <button className="btn btn-secondary" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem' }}>
                <LogOut size={14} />
                Salir
              </button>
            </div>
          </div>
        </aside>

        <DoctorPortalView doctor={currentUser.data} onLogout={handleLogout} />
      </div>
    );
  }

  // 4. Render Receptionist View
  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="brand">
          <HeartHandshake size={28} style={{ strokeWidth: 2.5 }} />
          <span>RedNorte</span>
        </div>
        <nav>
          <ul className="nav-links">
            <li className="nav-item active">
              <button>
                <UserCheck />
                Recepción Clínica
              </button>
            </li>
          </ul>
        </nav>
        <div className="sidebar-footer">
          <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p style={{ fontWeight: 600, color: 'hsl(var(--primary))' }}>{currentUser.data.name}</p>
            <p>Rol: Recepcionista</p>
            <button className="btn btn-secondary" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem' }}>
              <LogOut size={14} />
              Salir
            </button>
          </div>
        </div>
      </aside>

      <ReceptionistPortalView />

      {/* Real-time Floating Toast Notification (Observer Banner) */}
      {showToast && toastData && (
        <div className="notification-container">
          <div className="toast">
            <div className="toast-icon">
              <Bell size={20} />
            </div>
            
            <div className="toast-content">
              <div className="toast-title">
                {toastData.message}
              </div>
              <div className="toast-description">
                {toastData.type === 'REASSIGNED' ? (
                  <div>
                    <p style={{ marginTop: '0.25rem' }}>
                      Se liberó cupo de <strong style={{ color: 'hsl(var(--danger))' }}>{toastData.details.log.nombrePacienteOriginal}</strong>.
                    </p>
                    <p style={{ marginTop: '0.25rem' }}>
                      Reasignado a: <strong style={{ color: 'hsl(var(--accent))' }}>{toastData.details.log.nombrePacienteReasignado}</strong> ({toastData.details.log.especialidad}).
                    </p>
                    <p style={{ fontSize: '0.75rem', marginTop: '0.35rem', fontStyle: 'italic' }}>
                      Puntaje {toastData.details.log.algoritmoUsado} en {toastData.details.log.tiempoProcesamiento} ms.
                    </p>
                  </div>
                ) : toastData.type === 'ARRIVED' ? (
                  <div>
                    <p style={{ marginTop: '0.25rem' }}>
                      El paciente <strong style={{ color: 'hsl(var(--accent))' }}>{toastData.details.patientName}</strong> ha llegado para su cita.
                    </p>
                    <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      Registrado en Sala de Espera para el box del médico asignado.
                    </p>
                  </div>
                ) : (
                  <div>
                    Cita ID #{toastData.details.canceledCitaId} marcada como cancelada sin reasignación.
                  </div>
                )}
              </div>
            </div>

            <button 
              className="close-btn" 
              onClick={() => setShowToast(false)}
              style={{ padding: '0.25rem', marginLeft: '0.5rem' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { mockDoctors } from '../mockData';
import { HeartHandshake, Shield, User, Key } from 'lucide-react';

interface LoginViewProps {
  onLogin: (user: { role: 'patient' | 'doctor' | 'receptionist'; data: any }) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<'patient' | 'doctor' | 'receptionist'>('patient');

  // Input states
  const [patientRut, setPatientRut] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');

  const [doctors, setDoctors] = useState<any[]>([]);

  useEffect(() => {
    fetch(`http://localhost:8080/api/doctors`)
      .then(res => res.json())
      .then(data => {
        setDoctors(data);
        if (data.length > 0) {
          setSelectedDoctorId(data[0].idProfesional.toString());
        }
      })
      .catch(err => {
        console.error("Error fetching doctors for login:", err);
        setDoctors(mockDoctors);
        if (mockDoctors.length > 0) {
          setSelectedDoctorId(mockDoctors[0].idProfesional.toString());
        }
      });
  }, []);

  const handlePatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientRut) return;

    try {
      const res = await fetch(`http://localhost:8080/api/patients/rut/${encodeURIComponent(patientRut.trim())}`);
      if (res.ok) {
        const patient = await res.json();
        onLogin({ role: 'patient', data: patient });
      } else {
        alert('Paciente no registrado. Intente con un RUT de prueba, por ejemplo: 12.345.678-9');
      }
    } catch (err) {
      console.error("Error authenticating patient:", err);
      alert('Error de conexión con el servidor.');
    }
  };

  const handleDoctorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const doctor = doctors.find(d => d.idProfesional.toString() === selectedDoctorId);
    if (doctor) {
      onLogin({ role: 'doctor', data: doctor });
    } else {
      alert('Médico no encontrado.');
    }
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUser.trim() === 'recep' && adminPass === 'recep123') {
      onLogin({ role: 'receptionist', data: { name: 'Recepción RedNorte' } });
    } else {
      alert('Credenciales de recepcionista incorrectas. Use: recep / recep123');
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      width: '100vw',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'hsl(var(--bg-main))',
      padding: '2rem',
      flexDirection: 'column',
      gap: '2rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'hsl(var(--primary))' }}>
        <HeartHandshake size={42} style={{ strokeWidth: 2.5 }} />
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>RedNorte</h1>
      </div>

      <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center', marginBottom: '1.5rem' }}>
          Portal de Acceso Clínico
        </h2>

        {/* Tab Selection */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid hsl(var(--border-color))',
          marginBottom: '2rem',
          gap: '0.5rem'
        }}>
          <button
            onClick={() => setActiveTab('patient')}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'patient' ? '3px solid hsl(var(--primary))' : 'none',
              color: activeTab === 'patient' ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.95rem'
            }}
          >
            Paciente
          </button>
          <button
            onClick={() => setActiveTab('doctor')}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'doctor' ? '3px solid hsl(var(--primary))' : 'none',
              color: activeTab === 'doctor' ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.95rem'
            }}
          >
            Médico
          </button>
          <button
            onClick={() => setActiveTab('receptionist')}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'receptionist' ? '3px solid hsl(var(--primary))' : 'none',
              color: activeTab === 'receptionist' ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.95rem'
            }}
          >
            Recepcionista
          </button>
        </div>

        {/* Patient Login Form */}
        {activeTab === 'patient' && (
          <form onSubmit={handlePatientSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={16} />
                Ingrese su RUT de Paciente
              </label>
              <input
                type="text"
                placeholder="Ej: 12.345.678-9"
                value={patientRut}
                onChange={e => setPatientRut(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              Ingresar como Paciente
            </button>
          </form>
        )}

        {/* Doctor Login Form */}
        {activeTab === 'doctor' && (
          <form onSubmit={handleDoctorSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={16} />
                Seleccione su cuenta de Médico
              </label>
              <select value={selectedDoctorId} onChange={e => setSelectedDoctorId(e.target.value)}>
                {doctors.map(doctor => (
                  <option key={doctor.idProfesional} value={doctor.idProfesional.toString()}>
                    {doctor.nombreCompleto} ({doctor.especialidad})
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              Ingresar como Médico
            </button>
          </form>
        )}

        {/* Receptionist Login Form */}
        {activeTab === 'receptionist' && (
          <form onSubmit={handleAdminSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={16} />
                Usuario de Recepción
              </label>
              <input
                type="text"
                placeholder="Usuario (ej. recep)"
                value={adminUser}
                onChange={e => setAdminUser(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Key size={16} />
                Contraseña
              </label>
              <input
                type="password"
                placeholder="Contraseña"
                value={adminPass}
                onChange={e => setAdminPass(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              Ingresar como Recepcionista
            </button>
          </form>
        )}
      </div>

      {/* Demo Credentials Guide Card */}
      <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', borderLeft: '4px solid hsl(var(--primary))' }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, marginBottom: '0.75rem', color: 'hsl(var(--primary))' }}>
          <Shield size={18} />
          Credenciales de Demostración (Evaluación)
        </h4>
        <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p>
            <strong>Paciente (Con Cita):</strong> Use el RUT <code>12.345.678-9</code> (Alejandra Reyes) o <code>18.765.432-1</code>.
          </p>
          <p>
            <strong>Paciente (En Espera):</strong> Use el RUT <code>8.123.456-k</code> (Carlos Mendoza - prioridad Cardiología).
          </p>
          <p>
            <strong>Médicos:</strong> Seleccione de la lista (ej: <code>Dra. Karen Fuentealba</code> en Cardiología).
          </p>
          <p>
            <strong>Recepcionista:</strong> Usuario: <code>recep</code> / Clave: <code>recep123</code>.
          </p>
        </div>
      </div>
    </div>
  );
};

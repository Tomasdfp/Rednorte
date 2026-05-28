import React, { useState } from 'react';
import { useWaitingList } from '../observer/ObserverContext';
import { mockPatients } from '../mockData';
import type { SolicitudListaEspera } from '../mockData';
import { PlusCircle, Filter } from 'lucide-react';

export const WaitingListView: React.FC = () => {
  const { requests, addRequest, updateRequestStatus } = useWaitingList();
  
  // Local state for registering new patient and request
  const [rut, setRut] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [prevision, setPrevision] = useState<'FONASA' | 'ISAPRE'>('FONASA');
  
  const [nivelGravedad, setNivelGravedad] = useState(3);
  const [especialidadRequerida, setEspecialidadRequerida] = useState('Cardiología');
  const [diagnosticoPreliminar, setDiagnosticoPreliminar] = useState('');
  const [comentariosMedicos, setComentariosMedicos] = useState('');

  // Filtering state
  const [filterSpecialty, setFilterSpecialty] = useState('Todas');
  const [filterStatus, setFilterStatus] = useState('Todas');

  // Submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!rut || !nombreCompleto || !fechaNacimiento || !diagnosticoPreliminar) {
      alert('Por favor complete los campos obligatorios.');
      return;
    }

    // 1. Find or create patient
    let patient = mockPatients.find(p => p.rut === rut);
    if (!patient) {
      const newPatientId = mockPatients.reduce((max, p) => Math.max(max, p.idPaciente), 0) + 1;
      patient = {
        idPaciente: newPatientId,
        rut,
        nombreCompleto,
        fechaNacimiento,
        telefono,
        email,
        direccion,
        prevision
      };
      mockPatients.push(patient); // Persist in global mock database
    }

    // 2. Calculate priority
    // Formula: gravity (1-5) * 15 points.
    // Plus age factor: if elderly (>= 60) + 20 points, if child (<= 5) + 10 points.
    let basePriority = nivelGravedad * 15;
    const birthYear = new Date(fechaNacimiento).getFullYear();
    const age = new Date().getFullYear() - birthYear;
    let ageBonus = 0;
    if (age >= 60) {
      ageBonus = 20;
    } else if (age <= 5) {
      ageBonus = 10;
    }
    const priority = Math.min(100, basePriority + ageBonus);

    // 3. Create request
    const newRequestId = requests.reduce((max, r) => Math.max(max, r.idSolicitud), 0) + 1;
    const newRequest: SolicitudListaEspera = {
      idSolicitud: newRequestId,
      idPaciente: patient.idPaciente,
      fechaSolicitud: new Date().toISOString().split('T')[0],
      nivelGravedad,
      especialidadRequerida,
      diagnosticoPreliminar,
      estado: 'PENDIENTE',
      prioridadCalculada: priority,
      comentariosMedicos
    };

    addRequest(newRequest);

    // Reset fields
    setRut('');
    setNombreCompleto('');
    setFechaNacimiento('');
    setTelefono('');
    setEmail('');
    setDireccion('');
    setDiagnosticoPreliminar('');
    setComentariosMedicos('');
    alert('Paciente registrado exitosamente en la lista de espera.');
  };

  // Autocomplete patient data if RUT already exists
  const handleRutBlur = () => {
    const existing = mockPatients.find(p => p.rut.trim() === rut.trim());
    if (existing) {
      setNombreCompleto(existing.nombreCompleto);
      setFechaNacimiento(existing.fechaNacimiento);
      setTelefono(existing.telefono);
      setEmail(existing.email);
      setDireccion(existing.direccion);
      setPrevision(existing.prevision);
    }
  };

  // Helper to map patient name
  const getPatientName = (idPaciente: number) => {
    const p = mockPatients.find(x => x.idPaciente === idPaciente);
    return p ? p.nombreCompleto : `Paciente #${idPaciente}`;
  };

  // Helper to map patient RUT
  const getPatientRut = (idPaciente: number) => {
    const p = mockPatients.find(x => x.idPaciente === idPaciente);
    return p ? p.rut : '-';
  };

  // Filter requests
  const filteredRequests = requests.filter(r => {
    const matchSpecialty = filterSpecialty === 'Todas' || r.especialidadRequerida === filterSpecialty;
    const matchStatus = filterStatus === 'Todas' || r.estado === filterStatus;
    return matchSpecialty && matchStatus;
  });

  return (
    <div className="main-content">
      <div>
        <h1 className="page-title">Sistema Integrado de Listas de Espera</h1>
        <p className="page-description">
          Registro de solicitudes clínicas e indexación por prioridad diagnóstica ponderada.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        
        {/* Form panel */}
        <div className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <PlusCircle style={{ color: 'hsl(var(--primary))' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Ingreso a Lista de Espera</h2>
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '0.25rem', color: 'hsl(var(--primary))' }}>
              1. Datos del Paciente
            </h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label>RUT *</label>
                <input 
                  type="text" 
                  placeholder="12.345.678-9" 
                  value={rut} 
                  onChange={e => setRut(e.target.value)}
                  onBlur={handleRutBlur}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Nombre Completo *</label>
                <input 
                  type="text" 
                  placeholder="Nombre y Apellidos" 
                  value={nombreCompleto} 
                  onChange={e => setNombreCompleto(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Fecha de Nacimiento *</label>
                <input 
                  type="date" 
                  value={fechaNacimiento} 
                  onChange={e => setFechaNacimiento(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Previsión *</label>
                <select value={prevision} onChange={e => setPrevision(e.target.value as any)}>
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
                  placeholder="+56 9 1234 5678" 
                  value={telefono} 
                  onChange={e => setTelefono(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  placeholder="correo@ejemplo.com" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                />
              </div>
            </div>

            <div className="form-group">
              <label>Dirección</label>
              <input 
                type="text" 
                placeholder="Calle, Número, Comuna" 
                value={direccion} 
                onChange={e => setDireccion(e.target.value)} 
              />
            </div>

            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '0.25rem', color: 'hsl(var(--primary))', marginTop: '0.5rem' }}>
              2. Datos del Requerimiento Clínico
            </h3>

            <div className="form-grid">
              <div className="form-group">
                <label>Especialidad Requerida *</label>
                <select value={especialidadRequerida} onChange={e => setEspecialidadRequerida(e.target.value)}>
                  <option value="Cardiología">Cardiología</option>
                  <option value="Traumatología">Traumatología</option>
                  <option value="Oftalmología">Oftalmología</option>
                </select>
              </div>
              <div className="form-group">
                <label>Nivel de Gravedad (1 al 5) *</label>
                <select value={nivelGravedad} onChange={e => setNivelGravedad(Number(e.target.value))}>
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
                placeholder="Descripción del diagnóstico preliminar..." 
                value={diagnosticoPreliminar} 
                onChange={e => setDiagnosticoPreliminar(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Comentarios Médicos Adicionales</label>
              <textarea 
                rows={2} 
                placeholder="Indicaciones o especificaciones clínicas..." 
                value={comentariosMedicos} 
                onChange={e => setComentariosMedicos(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
              Registrar en Espera
            </button>
          </form>
        </div>

        {/* Table panel */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Lista de Espera Activa</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}>
                <Filter size={16} />
                <span>Filtrar por:</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
              <label>Especialidad</label>
              <select value={filterSpecialty} onChange={e => setFilterSpecialty(e.target.value)}>
                <option value="Todas">Todas</option>
                <option value="Cardiología">Cardiología</option>
                <option value="Traumatología">Traumatología</option>
                <option value="Oftalmología">Oftalmología</option>
              </select>
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
              <label>Estado</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="Todas">Todos los estados</option>
                <option value="PENDIENTE">PENDIENTE</option>
                <option value="ASIGNADA">ASIGNADA</option>
                <option value="REASIGNADA">REASIGNADA</option>
                <option value="ATENDIDA">ATENDIDA</option>
                <option value="CANCELADA">CANCELADA</option>
              </select>
            </div>
          </div>

          <div className="table-container" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            <table className="medical-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Paciente (RUT)</th>
                  <th>Especialidad</th>
                  <th>Nivel Gravedad</th>
                  <th>Prioridad</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'hsl(var(--text-muted))', padding: '2rem' }}>
                      No se encontraron solicitudes registradas.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map(req => (
                    <tr key={req.idSolicitud}>
                      <td>#{req.idSolicitud}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{getPatientName(req.idPaciente)}</div>
                        <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>{getPatientRut(req.idPaciente)}</div>
                      </td>
                      <td>{req.especialidadRequerida}</td>
                      <td>
                        <span className={`badge severity-${req.nivelGravedad}`}>
                          Gravedad {req.nivelGravedad}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span style={{ fontWeight: 700, color: req.prioridadCalculada >= 70 ? 'hsl(var(--danger))' : req.prioridadCalculada >= 50 ? 'hsl(var(--warning))' : 'hsl(var(--text-main))' }}>
                            {req.prioridadCalculada}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>/100</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${req.estado.toLowerCase()}`}>
                          {req.estado}
                        </span>
                      </td>
                      <td>
                        <select 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', width: 'auto' }}
                          value={req.estado}
                          onChange={e => updateRequestStatus(req.idSolicitud, e.target.value as any)}
                        >
                          <option value="PENDIENTE">PENDIENTE</option>
                          <option value="ASIGNADA">ASIGNADA</option>
                          <option value="REASIGNADA">REASIGNADA</option>
                          <option value="ATENDIDA">ATENDIDA</option>
                          <option value="CANCELADA">CANCELADA</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

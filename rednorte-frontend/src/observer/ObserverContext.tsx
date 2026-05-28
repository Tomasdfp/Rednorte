import React, { createContext, useContext, useState, useEffect } from 'react';
import type { SolicitudListaEspera, Cita, ReasignacionLog, Paciente } from '../mockData';

const BFF_URL = 'http://localhost:8080/api';

interface ObserverContextProps {
  appointments: Cita[];
  logs: ReasignacionLog[];
  requests: SolicitudListaEspera[];
  latestNotification: any;
  setAppointments: React.Dispatch<React.SetStateAction<Cita[]>>;
  setLogs: React.Dispatch<React.SetStateAction<ReasignacionLog[]>>;
  setRequests: React.Dispatch<React.SetStateAction<SolicitudListaEspera[]>>;
  setLatestNotification: React.Dispatch<React.SetStateAction<any>>;
}

const ObserverContext = createContext<ObserverContextProps | null>(null);

export const ObserverProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appointments, setAppointments] = useState<Cita[]>([]);
  const [logs, setLogs] = useState<ReasignacionLog[]>([]);
  const [requests, setRequests] = useState<SolicitudListaEspera[]>([]);
  const [latestNotification, setLatestNotification] = useState<any>(null);

  const loadData = () => {
    fetch(`${BFF_URL}/appointments`)
      .then(res => res.json())
      .then(data => setAppointments(data))
      .catch(err => console.error("Error loading appointments:", err));

    fetch(`${BFF_URL}/reassignments`)
      .then(res => res.json())
      .then(data => setLogs(data))
      .catch(err => console.error("Error loading reassignments:", err));

    fetch(`${BFF_URL}/waitlist`)
      .then(res => res.json())
      .then(data => setRequests(data))
      .catch(err => console.error("Error loading waitlist:", err));
  };

  useEffect(() => {
    loadData();

    const eventSource = new EventSource(`${BFF_URL}/notifications/stream`);

    eventSource.addEventListener('message', (event) => {
      try {
        const payload = JSON.parse(event.data);
        console.log("SSE Notification received:", payload);
        
        if (payload.type === 'ARRIVED') {
          if (payload.details && payload.details.appointments) {
            setAppointments(payload.details.appointments);
          }
          setLatestNotification({
            type: 'ARRIVED',
            message: payload.message,
            details: payload.details,
            timestamp: Date.now()
          });
        } else if (payload.type === 'REASSIGNED') {
          if (payload.details && payload.details.appointments) {
            setAppointments(payload.details.appointments);
          }
          if (payload.details && payload.details.logs) {
            setLogs(payload.details.logs);
          }
          fetch(`${BFF_URL}/waitlist`)
            .then(res => res.json())
            .then(data => setRequests(data))
            .catch(err => console.error("Error updating waitlist:", err));

          setLatestNotification({
            type: 'REASSIGNED',
            message: payload.message,
            details: payload.details,
            timestamp: Date.now()
          });
        } else if (payload.type === 'CANCELLED') {
          if (payload.details && payload.details.appointments) {
            setAppointments(payload.details.appointments);
          }
          setLatestNotification({
            type: 'CANCELLED',
            message: payload.message,
            details: payload.details,
            timestamp: Date.now()
          });
        } else if (payload.type === 'APPOINTMENTS_RESET') {
          if (payload.details && payload.details.appointments) {
            setAppointments(payload.details.appointments);
          }
          if (payload.details && payload.details.logs) {
            setLogs(payload.details.logs);
          }
          fetch(`${BFF_URL}/waitlist`)
            .then(res => res.json())
            .then(data => setRequests(data));
          setLatestNotification(null);
        }
      } catch (err) {
        console.error("Error parsing SSE data:", err);
      }
    });

    eventSource.addEventListener('error', (err) => {
      console.warn("SSE Connection lost. Retrying...", err);
    });

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <ObserverContext.Provider
      value={{
        appointments,
        logs,
        requests,
        latestNotification,
        setAppointments,
        setLogs,
        setRequests,
        setLatestNotification
      }}
    >
      {children}
    </ObserverContext.Provider>
  );
};

export const useWaitingList = () => {
  const context = useContext(ObserverContext);
  if (!context) throw new Error("useWaitingList must be used within an ObserverProvider");

  const { requests, setRequests } = context;

  const addRequest = async (request: SolicitudListaEspera) => {
    try {
      const res = await fetch(`${BFF_URL}/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });
      if (res.ok) {
        const saved = await res.json();
        const wlRes = await fetch(`${BFF_URL}/waitlist`);
        const wlData = await wlRes.json();
        setRequests(wlData);
        return saved;
      }
    } catch (err) {
      console.error("Error adding waitlist request:", err);
    }
  };

  const updateRequestStatus = async (idSolicitud: number, status: SolicitudListaEspera['estado']) => {
    try {
      const res = await fetch(`${BFF_URL}/waitlist/${idSolicitud}/status?status=${status}`, {
        method: 'PUT'
      });
      if (res.ok) {
        const wlRes = await fetch(`${BFF_URL}/waitlist`);
        const wlData = await wlRes.json();
        setRequests(wlData);
      }
    } catch (err) {
      console.error("Error updating waitlist status:", err);
    }
  };

  return {
    requests,
    addRequest,
    updateRequestStatus
  };
};

export const useAppointments = () => {
  const context = useContext(ObserverContext);
  if (!context) throw new Error("useAppointments must be used within an ObserverProvider");

  const { appointments, logs, latestNotification } = context;

  const cancelAppointment = async (idCita: number, reason: string, _patients: Paciente[], specialty: string) => {
    try {
      await fetch(`${BFF_URL}/appointments/cancel/${idCita}?reason=${encodeURIComponent(reason)}&specialty=${encodeURIComponent(specialty)}`, {
        method: 'POST'
      });
    } catch (err) {
      console.error("Error cancelling appointment:", err);
    }
  };

  const requestAppointment = async (idPaciente: number, specialty: string, _severity: number, observations: string, _patients: Paciente[]) => {
    try {
      const res = await fetch(`${BFF_URL}/appointments/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idPaciente,
          idProfesional: specialty === 'Cardiología' ? 201 : specialty === 'Traumatología' ? 202 : 203,
          fechaHoraProgramada: new Date(Date.now() + 86400000).toISOString().split('T')[0] + 'T10:00:00',
          duracionEstimada: 30,
          estadoCita: 'PROGRAMADA',
          observaciones: observations
        })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error("Error requesting appointment:", err);
    }
    return { status: 'ERROR', data: null };
  };

  const markPatientArrival = async (idCita: number, _patients: Paciente[]) => {
    try {
      await fetch(`${BFF_URL}/appointments/check-in/${idCita}`, {
        method: 'POST'
      });
    } catch (err) {
      console.error("Error marking patient arrival:", err);
    }
  };

  const resetAllData = async () => {
    try {
      await fetch(`${BFF_URL}/reset`, {
        method: 'POST'
      });
    } catch (err) {
      console.error("Error resetting data:", err);
    }
  };

  return {
    appointments,
    logs,
    latestNotification,
    cancelAppointment,
    requestAppointment,
    markPatientArrival,
    resetAllData
  };
};

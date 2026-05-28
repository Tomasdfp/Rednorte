import { Subject } from './Subject';
import { WaitingListSubject } from './WaitingListSubject';
import { mockAppointments, mockReassignmentLogs } from '../mockData';
import type { Cita, ReasignacionLog, Paciente, SolicitudListaEspera } from '../mockData';

export class AppointmentSubject extends Subject {
  private appointments: Cita[] = [...mockAppointments];
  private logs: ReasignacionLog[] = [...mockReassignmentLogs];
  private waitingListSubject: WaitingListSubject;

  constructor(waitingListSubject: WaitingListSubject) {
    super();
    this.waitingListSubject = waitingListSubject;
  }

  public getAppointments(): Cita[] {
    return this.appointments;
  }

  public getLogs(): ReasignacionLog[] {
    return this.logs;
  }

  public requestAppointment(
    idPaciente: number,
    specialty: string,
    severity: number,
    observations: string,
    patients: Paciente[]
  ): { status: 'ASSIGNED' | 'WAITLIST'; data: any } {
    let doctorId = 201;
    if (specialty === 'Traumatología') doctorId = 202;
    else if (specialty === 'Oftalmología') doctorId = 203;

    // Check if there is an active appointment for this doctor
    const isBooked = this.appointments.some(
      c => c.idProfesional === doctorId && (c.estadoCita === 'PROGRAMADA' || c.estadoCita === 'CONFIRMADA')
    );

    const patient = patients.find(p => p.idPaciente === idPaciente);
    const birthYear = patient ? new Date(patient.fechaNacimiento).getFullYear() : 1980;
    const age = new Date().getFullYear() - birthYear;
    let ageBonus = 0;
    if (age >= 60) ageBonus = 20;
    else if (age <= 5) ageBonus = 10;
    const priority = Math.min(100, severity * 15 + ageBonus);

    if (!isBooked) {
      const newCitaId = this.appointments.reduce((max, c) => Math.max(max, c.idCita), 0) + 1;
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      const newCita: Cita = {
        idCita: newCitaId,
        idPaciente,
        idProfesional: doctorId,
        fechaHoraProgramada: `${tomorrowStr}T10:00:00`,
        duracionEstimada: 30,
        estadoCita: 'CONFIRMADA',
        observaciones: `Asignación automática. Motivo: ${observations}`
      };
      this.appointments.push(newCita);
      this.notify({
        type: 'APPOINTMENTS_RESET',
        payload: {
          appointments: [...this.appointments],
          logs: [...this.logs]
        }
      });
      return { status: 'ASSIGNED', data: newCita };
    } else {
      const newReqId = this.waitingListSubject.getRequests().reduce((max, r) => Math.max(max, r.idSolicitud), 0) + 1;
      const newReq: SolicitudListaEspera = {
        idSolicitud: newReqId,
        idPaciente,
        fechaSolicitud: new Date().toISOString().split('T')[0],
        nivelGravedad: severity,
        especialidadRequerida: specialty,
        diagnosticoPreliminar: observations,
        estado: 'PENDIENTE',
        prioridadCalculada: priority,
        comentariosMedicos: 'Ingresado automáticamente por falta de cupo.'
      };
      this.waitingListSubject.addRequest(newReq);
      return { status: 'WAITLIST', data: newReq };
    }
  }

  public markPatientArrival(idCita: number, patients: Paciente[]): void {
    const idx = this.appointments.findIndex(c => c.idCita === idCita);
    if (idx !== -1) {
      this.appointments[idx] = {
        ...this.appointments[idx],
        estadoCita: 'PRESENTE'
      };
      const patient = patients.find(p => p.idPaciente === this.appointments[idx].idPaciente);
      const patientName = patient ? patient.nombreCompleto : `Paciente #${this.appointments[idx].idPaciente}`;
      
      this.notify({
        type: 'PATIENT_ARRIVED',
        payload: {
          idCita,
          idProfesional: this.appointments[idx].idProfesional,
          patientName,
          appointments: [...this.appointments],
          logs: [...this.logs]
        }
      });
    }
  }

  public cancelAppointment(
    idCita: number,
    reason: string,
    patients: Paciente[],
    specialty: string
  ): void {
    const citaIndex = this.appointments.findIndex(c => c.idCita === idCita);
    if (citaIndex === -1) return;

    const originalCita = this.appointments[citaIndex];
    
    // 1. Mark original appointment as CANCELADA
    this.appointments[citaIndex] = {
      ...originalCita,
      estadoCita: 'CANCELADA',
      motivoCancelacion: reason
    };

    const originalPatient = patients.find(p => p.idPaciente === originalCita.idPaciente);
    const originalPatientName = originalPatient ? originalPatient.nombreCompleto : `Paciente #${originalCita.idPaciente}`;

    // 2. Find highest priority patient in the waitlist for this doctor's specialty
    const candidateRequest = this.waitingListSubject.getHighestPriorityRequest(specialty);

    if (candidateRequest) {
      // 3. Create a new appointment for the waitlist patient
      const newCitaId = this.appointments.reduce((max, c) => Math.max(max, c.idCita), 0) + 1;
      const newCita: Cita = {
        idCita: newCitaId,
        idPaciente: candidateRequest.idPaciente,
        idProfesional: originalCita.idProfesional,
        fechaHoraProgramada: originalCita.fechaHoraProgramada,
        duracionEstimada: originalCita.duracionEstimada,
        estadoCita: 'PROGRAMADA',
        observaciones: `Reasignado auto (Cita #${idCita} cancelada). Obs orig: ${originalCita.observaciones}`
      };

      this.appointments.push(newCita);

      // 4. Update the candidate's waitlist request state to ASIGNADA
      this.waitingListSubject.updateRequestStatus(candidateRequest.idSolicitud, 'ASIGNADA');

      const reassignedPatient = patients.find(p => p.idPaciente === candidateRequest.idPaciente);
      const reassignedPatientName = reassignedPatient ? reassignedPatient.nombreCompleto : `Paciente #${candidateRequest.idPaciente}`;

      // 5. Create reassignment log
      const newLogId = this.logs.reduce((max, l) => Math.max(max, l.idLog), 0) + 1;
      const processingTime = Math.floor(Math.random() * 70) + 60; // 60ms - 130ms simulation
      const newLog: ReasignacionLog = {
        idLog: newLogId,
        fechaEvento: new Date().toISOString(),
        citaOriginal: idCita,
        citaReasignada: newCitaId,
        nombrePacienteOriginal: originalPatientName,
        nombrePacienteReasignado: reassignedPatientName,
        especialidad: specialty,
        motivo: reason,
        algoritmoUsado: 'Priority-Severity Matrix',
        tiempoProcesamiento: processingTime
      };

      this.logs.unshift(newLog); // Put latest at top

      // 6. Notify observers of the cancellation & successful automatic reassignment
      this.notify({
        type: 'APPOINTMENT_CANCELLED_AND_REASSIGNED',
        payload: {
          canceledCitaId: idCita,
          newCita,
          log: newLog,
          appointments: [...this.appointments],
          logs: [...this.logs]
        }
      });
    } else {
      // No candidates found, just cancel the appointment
      this.notify({
        type: 'APPOINTMENT_CANCELLED',
        payload: {
          canceledCitaId: idCita,
          appointments: [...this.appointments],
          logs: [...this.logs] // Keep same logs
        }
      });
    }
  }

  public reset(initialAppointments: Cita[], initialLogs: ReasignacionLog[]): void {
    this.appointments = [...initialAppointments];
    this.logs = [...initialLogs];
    this.notify({
      type: 'APPOINTMENTS_RESET',
      payload: {
        appointments: [...this.appointments],
        logs: [...this.logs]
      }
    });
  }
}

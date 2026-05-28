// Domain model interfaces matching the RedNorte class diagram

export interface Paciente {
  idPaciente: number;
  rut: string;
  nombreCompleto: string;
  fechaNacimiento: string;
  telefono: string;
  email: string;
  direccion: string;
  prevision: 'FONASA' | 'ISAPRE';
}

export type EstadoSolicitud = 'PENDIENTE' | 'ASIGNADA' | 'CANCELADA' | 'ATENDIDA' | 'REASIGNADA';

export interface SolicitudListaEspera {
  idSolicitud: number;
  idPaciente: number; // Linked to Paciente
  fechaSolicitud: string;
  nivelGravedad: number; // 1 (Least severe) to 5 (Most severe)
  especialidadRequerida: string;
  diagnosticoPreliminar: string;
  estado: EstadoSolicitud;
  prioridadCalculada: number;
  comentariosMedicos: string;
}

export type EstadoCita = 'PROGRAMADA' | 'CONFIRMADA' | 'CANCELADA' | 'COMPLETADA' | 'REASIGNADA' | 'PRESENTE';

export interface Cita {
  idCita: number;
  idPaciente: number; // Linked to Paciente
  idProfesional: number; // Linked to ProfesionalSalud
  fechaHoraProgramada: string;
  duracionEstimada: number; // minutes
  estadoCita: EstadoCita;
  motivoCancelacion?: string;
  observaciones: string;
}

export interface ProfesionalSalud {
  idProfesional: number;
  rut: string;
  nombreCompleto: string;
  especialidad: string;
  registroNacional: string;
  horarioAtencion: string;
  disponible: boolean;
}

export interface ReasignacionLog {
  idLog: number;
  fechaEvento: string;
  citaOriginal: number; // idCita
  citaReasignada: number; // idCita
  nombrePacienteOriginal: string;
  nombrePacienteReasignado: string;
  especialidad: string;
  motivo: string;
  algoritmoUsado: string;
  tiempoProcesamiento: number; // ms
}

export interface AtencionMedica {
  idAtencion: number;
  idCita: number;
  fechaAtencion: string;
  diagnosticoFinal: string;
  tratamientoIndicado: string;
  recetaMedica: string;
  certificadoEmitido: boolean;
}

// Initial mock data to populate our dashboard

export const mockPatients: Paciente[] = [
  {
    idPaciente: 101,
    rut: "12.345.678-9",
    nombreCompleto: "Alejandra Reyes Castro",
    fechaNacimiento: "1965-04-12",
    telefono: "+56 9 8765 4321",
    email: "alejandra.reyes@email.cl",
    direccion: "Av. Providencia 1204, Santiago",
    prevision: "FONASA"
  },
  {
    idPaciente: 102,
    rut: "18.765.432-1",
    nombreCompleto: "Diego Muñoz Valenzuela",
    fechaNacimiento: "1994-11-23",
    telefono: "+56 9 7654 3210",
    email: "diego.munoz@email.cl",
    direccion: "Paseo Huérfanos 834, Santiago",
    prevision: "ISAPRE"
  },
  {
    idPaciente: 103,
    rut: "8.123.456-k",
    nombreCompleto: "Carlos Mendoza Silva",
    fechaNacimiento: "1951-08-05",
    telefono: "+56 9 6543 2109",
    email: "carlos.mendoza@email.cl",
    direccion: "Gran Avenida 5670, San Miguel",
    prevision: "FONASA"
  },
  {
    idPaciente: 104,
    rut: "20.987.654-3",
    nombreCompleto: "Valentina Gómez Soto",
    fechaNacimiento: "2001-02-28",
    telefono: "+56 9 5432 1098",
    email: "valen.gomez@email.cl",
    direccion: "Las Condes 8900, Las Condes",
    prevision: "ISAPRE"
  },
  {
    idPaciente: 105,
    rut: "15.432.109-8",
    nombreCompleto: "Julio Plaza Vergara",
    fechaNacimiento: "1978-07-19",
    telefono: "+56 9 4321 0987",
    email: "julio.plaza@email.cl",
    direccion: "Vicuña Mackenna 450, La Florida",
    prevision: "FONASA"
  }
];

export const mockDoctors: ProfesionalSalud[] = [
  {
    idProfesional: 201,
    rut: "11.111.111-1",
    nombreCompleto: "Dra. Karen Fuentealba Andrade",
    especialidad: "Cardiología",
    registroNacional: "34891-C",
    horarioAtencion: "Lunes a Viernes 09:00 - 13:00",
    disponible: true
  },
  {
    idProfesional: 202,
    rut: "22.222.222-2",
    nombreCompleto: "Dr. Tomás Del Fierro Pardo",
    especialidad: "Traumatología",
    registroNacional: "45092-T",
    horarioAtencion: "Lunes, Miércoles y Viernes 14:00 - 18:00",
    disponible: true
  },
  {
    idProfesional: 203,
    rut: "33.333.333-3",
    nombreCompleto: "Dra. María José Arancibia",
    especialidad: "Oftalmología",
    registroNacional: "52109-O",
    horarioAtencion: "Martes y Jueves 09:00 - 17:00",
    disponible: true
  }
];

export const mockWaitingList: SolicitudListaEspera[] = [
  {
    idSolicitud: 1,
    idPaciente: 103, // Carlos Mendoza (FONASA, elderly)
    fechaSolicitud: "2026-04-10",
    nivelGravedad: 4,
    especialidadRequerida: "Cardiología",
    diagnosticoPreliminar: "Insuficiencia cardíaca congestiva descompensada",
    estado: "PENDIENTE",
    prioridadCalculada: 85, // Custom calculation
    comentariosMedicos: "Paciente prioritario por edad y severidad de síntomas. Requiere control urgente."
  },
  {
    idSolicitud: 2,
    idPaciente: 105, // Julio Plaza
    fechaSolicitud: "2026-05-01",
    nivelGravedad: 3,
    especialidadRequerida: "Traumatología",
    diagnosticoPreliminar: "Sospecha de rotura de menisco en rodilla izquierda",
    estado: "PENDIENTE",
    prioridadCalculada: 55,
    comentariosMedicos: "Dolor persistente. Derivado para evaluación quirúrgica."
  },
  {
    idSolicitud: 3,
    idPaciente: 101, // Alejandra Reyes (Cardiology, low gravity)
    fechaSolicitud: "2026-05-10",
    nivelGravedad: 2,
    especialidadRequerida: "Cardiología",
    diagnosticoPreliminar: "Hipertensión arterial en estudio",
    estado: "PENDIENTE",
    prioridadCalculada: 42,
    comentariosMedicos: "Monitoreo ambulatorio de presión. Control rutinario."
  }
];

export const mockAppointments: Cita[] = [
  {
    idCita: 301,
    idPaciente: 102, // Diego Muñoz
    idProfesional: 201, // Dra. Karen Fuentealba (Cardiología)
    fechaHoraProgramada: "2026-05-25T10:00:00",
    duracionEstimada: 30,
    estadoCita: "PROGRAMADA",
    observaciones: "Electrocardiograma de esfuerzo anual."
  },
  {
    idCita: 302,
    idPaciente: 104, // Valentina Gómez
    idProfesional: 202, // Dr. Tomás Del Fierro (Traumatología)
    fechaHoraProgramada: "2026-05-26T15:30:00",
    duracionEstimada: 30,
    estadoCita: "CONFIRMADA",
    observaciones: "Control post-operatorio de fractura de muñeca."
  },
  {
    idCita: 303,
    idPaciente: 101, // Alejandra Reyes
    idProfesional: 203, // Dra. María José Arancibia (Oftalmología)
    fechaHoraProgramada: "2026-05-28T11:30:00",
    duracionEstimada: 20,
    estadoCita: "PROGRAMADA",
    observaciones: "Fondo de ojo por sospecha de glaucoma."
  }
];

export const mockReassignmentLogs: ReasignacionLog[] = [
  {
    idLog: 1,
    fechaEvento: "2026-05-20T14:22:15",
    citaOriginal: 299,
    citaReasignada: 300,
    nombrePacienteOriginal: "Roberto Pino Lagos",
    nombrePacienteReasignado: "Carlos Mendoza Silva",
    especialidad: "Cardiología",
    motivo: "Cancelación médica por congreso",
    algoritmoUsado: "Priority-Severity Matrix",
    tiempoProcesamiento: 124
  }
];

export const mockMedicalAttentions: AtencionMedica[] = [
  {
    idAtencion: 501,
    idCita: 298, // Completed past appointment
    fechaAtencion: "2026-04-15",
    diagnosticoFinal: "Esguince de tobillo Grado II",
    tratamientoIndicado: "Reposo relativo por 10 días, kinesiología (10 sesiones) y compresión local.",
    recetaMedica: "Ibuprofeno 400mg cada 8 horas por 5 días. Paracetamol 1g en caso de dolor persistente.",
    certificadoEmitido: true
  }
];

import { Subject } from './Subject';
import { mockWaitingList } from '../mockData';
import type { SolicitudListaEspera } from '../mockData';

export class WaitingListSubject extends Subject {
  private requests: SolicitudListaEspera[] = [...mockWaitingList];

  public getRequests(): SolicitudListaEspera[] {
    return this.requests;
  }

  public addRequest(request: SolicitudListaEspera): void {
    this.requests.push(request);
    this.notify({
      type: 'WAITING_LIST_CHANGED',
      payload: [...this.requests]
    });
  }

  public getHighestPriorityRequest(specialty: string): SolicitudListaEspera | null {
    const pendingForSpecialty = this.requests.filter(
      r => r.especialidadRequerida.toLowerCase() === specialty.toLowerCase() && r.estado === 'PENDIENTE'
    );

    if (pendingForSpecialty.length === 0) return null;

    // Sort by priorityCalculada descending, then by fechaSolicitud ascending (FIFO for tiebreaker)
    pendingForSpecialty.sort((a, b) => {
      if (b.prioridadCalculada !== a.prioridadCalculada) {
        return b.prioridadCalculada - a.prioridadCalculada;
      }
      return new Date(a.fechaSolicitud).getTime() - new Date(b.fechaSolicitud).getTime();
    });

    return pendingForSpecialty[0];
  }

  public updateRequestStatus(idSolicitud: number, status: SolicitudListaEspera['estado']): void {
    const index = this.requests.findIndex(r => r.idSolicitud === idSolicitud);
    if (index !== -1) {
      this.requests[index] = {
        ...this.requests[index],
        estado: status
      };
      this.notify({
        type: 'WAITING_LIST_CHANGED',
        payload: [...this.requests]
      });
    }
  }

  // Allow resetting mock data
  public reset(initialData: SolicitudListaEspera[]): void {
    this.requests = [...initialData];
    this.notify({
      type: 'WAITING_LIST_CHANGED',
      payload: [...this.requests]
    });
  }
}

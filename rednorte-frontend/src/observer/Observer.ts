export interface Observer {
  update(event: { type: string; payload: any }): void;
}

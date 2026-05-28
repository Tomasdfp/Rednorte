import type { Observer } from './Observer';

export class Subject {
  private observers: Observer[] = [];

  public subscribe(observer: Observer): void {
    if (!this.observers.includes(observer)) {
      this.observers.push(observer);
    }
  }

  public unsubscribe(observer: Observer): void {
    this.observers = this.observers.filter((obs) => obs !== observer);
  }

  protected notify(event: { type: string; payload: any }): void {
    this.observers.forEach((observer) => {
      try {
        observer.update(event);
      } catch (err) {
        console.error('Error notifying observer:', err);
      }
    });
  }
}

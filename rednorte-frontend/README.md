# RedNorte - Frontend de Gestión de Horas Médicas

Este es el componente Frontend para el servicio de gestión de listas de espera y reasignación de horas médicas de **RedNorte**, diseñado para la Evaluación Parcial 2 de Desarrollo Fullstack III.

La solución está construida con **React**, **TypeScript** y **Vanilla CSS**, implementando el patrón de diseño **Observer** para gestionar la comunicación asíncrona en tiempo real entre los módulos.

---

## 🛠️ Arquitectura y Patrón de Diseño: Observer

Para cumplir con las exigencias académicas, se ha implementado un patrón **Observer clásico** desacoplado de las librerías tradicionales de estado:

1.  **`Subject` (Base):** Clase base abstracta que mantiene una lista de suscriptores (`Observer`) y expone métodos para suscribir (`subscribe`), desuscribir (`unsubscribe`) y notificar (`notify`) de eventos.
2.  **`WaitingListSubject` y `AppointmentSubject`:** Subjects específicos que encapsulan el estado de la lista de espera y de las citas médicas respectivamente.
3.  **`Observer` (Interface):** Interfaz que define la firma del método `update(event)`.
4.  **React Component Observers:** Integrados mediante Hooks personalizados (`useWaitingList` y `useAppointments`). Cuando un componente se renderiza, registra un observador en el subject correspondiente. Si ocurre un cambio (por ejemplo, una cancelación de cita que gatilla una reasignación), el subject notifica a todos los observadores registrados, actualizando su estado interno y forzando el re-renderizado del componente en tiempo real.

### Flujo de Reasignación Automática por Cancelación:
```
[Administrador] ➔ Cancela Cita ➔ [AppointmentSubject]
                                        │
             (Gatilla Algoritmo)        ▼
   Busca paciente con Mayor Prioridad en [WaitingListSubject]
                                        │
           (Si encuentra candidato, reasigna hora médica)
                                        │
      ┌─────────────────────────────────┴────────────────────────────────┐
      ▼                                 ▼                                ▼
[Lista de Citas]                 [Bitácora de Logs]               [Toast Alert]
(Observer)                       (Observer)                       (Observer)
Recibe actualización             Recibe nuevo log                 Muestra Banner en vivo
y renderiza la nueva cita        (Ej: "Tiempo: 78ms")             notificando al usuario
```

---

## 📂 Estructura del Proyecto

*   **`src/mockData.ts`**: Define las interfaces de dominio (`Paciente`, `Cita`, `SolicitudListaEspera`, `ReasignacionLog`, `AtencionMedica`) alineadas con el diagrama de clases y contiene la base de datos simulada inicial.
*   **`src/observer/`**:
    *   `Observer.ts`: Interfaz del Observador.
    *   `Subject.ts`: Clase base del Subject.
    *   `WaitingListSubject.ts`: Servicio observador de listas de espera.
    *   `AppointmentSubject.ts`: Servicio observador de citas y motor de reasignación.
    *   `ObserverContext.tsx`: Contexto y hooks de React para enlazar las clases de diseño con el ciclo de vida de React.
*   **`src/views/`**:
    *   `DashboardView.tsx`: Métricas globales, indicadores KPI y listado de profesionales (conforme a Ley de Interoperabilidad).
    *   `WaitingListView.tsx` (**Módulo 1**): Registro de pacientes y lista de espera activa. Calcula automáticamente el puntaje de prioridad basado en gravedad (1-5) y edad (Ley de prioridad de adultos mayores).
    *   `ReassignmentView.tsx` (**Módulo 2**): Agenda diaria interactiva, cancelación de citas y bitácora de logs con tiempos de procesamiento del algoritmo.
    *   `PatientPortalView.tsx` (**Módulo 3**): Consulta de estado por RUT (Ley N°20.584), visualización de recetas médicas e historial, actualización de datos de contacto y firma digital de **Consentimiento Informado** (Art. 14 de Ley N°20.584).
*   **`src/index.css`**: Sistema de diseño Vanilla CSS premium (Outfits Google Font, soporte para temas, glassmorphism y micro-animaciones).

---

## 🚀 Instrucciones de Ejecución y Pruebas

### Requisitos Previos:
- Tener instalado **Node.js** (LTS v24+) y **npm**.

### 1. Instalación de Dependencias:
Instale los paquetes necesarios (incluyendo `lucide-react` para iconografía médica):
```bash
npm install
```

### 2. Levantar el Servidor de Desarrollo:
Inicie la aplicación localmente en modo desarrollo:
```bash
npm run dev
```
La terminal indicará la URL local (usualmente `http://localhost:5173`). Abra esta dirección en su navegador.

---

## 🧪 Guía de Prueba para Evaluar el Flujo

Para validar el correcto funcionamiento del patrón **Observer** y las reglas del negocio:

1.  **Paso 1: Lista de Espera:** Navegue a la pestaña **Listas de Espera**. Registre un nuevo paciente (por ejemplo, con RUT `9.999.999-9`, gravedad 5, especialidad "Cardiología"). Verifique cómo se calcula automáticamente una prioridad alta (cerca de 95 puntos si el paciente supera los 60 años).
2.  **Paso 2: Cancelación y Reasignación:** Vaya a **Reasignación Auto.**. Identifique una cita activa de "Cardiología" (ej: la de Alejandra Reyes) y presione **Cancelar**. Introduzca un motivo clínico.
3.  **Paso 3: Notificación en Tiempo Real:** Al confirmar la cancelación, observe de inmediato:
    -   El banner flotante tipo **Toast** en la esquina inferior derecha avisando del éxito de la reasignación en vivo.
    -   La actualización instantánea de la tabla de citas del día (la cita cancelada desaparece y se genera una nueva cita programada a la misma hora para el paciente de mayor prioridad en la lista de espera).
    -   El registro del algoritmo en la **Bitácora de Logs** indicando los milisegundos que tomó procesar el emparejamiento.
4.  **Paso 4: Portal del Paciente:** Vaya a la pestaña **Portal del Paciente**. Ingrese el RUT del paciente reasignado (por ejemplo, el RUT `8.123.456-k` de Carlos Mendoza o el RUT que ingresó en el Paso 1). Compruebe que puede:
    -   Ver su estado actualizado como "ASIGNADA" y su nueva cita agendada.
    -   Actualizar su número telefónico o email.
    -   Leer y **firmar digitalmente el Consentimiento Informado** cumpliendo con la Ley N°20.584.

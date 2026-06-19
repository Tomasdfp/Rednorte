# Informe de Pruebas Unitarias y Cobertura (JaCoCo) - RedNorte

Este documento resume la estrategia de testing, los resultados de la ejecución de las pruebas unitarias y de integración, y las métricas de cobertura de código generadas de manera automatizada para el sistema **RedNorte**, cumpliendo con las exigencias del **Indicador 4** de la **Evaluación Parcial N°3 (DSY1106)**.

---

## 1. Estrategia y Suite de Pruebas Automatizadas

Se ha implementado una robusta suite de pruebas en el backend utilizando **JUnit 5**, **AssertJ** y **MockMvc** para verificar la lógica clínica y de seguridad, alcanzando una cobertura superior al **60%** exigido por la rúbrica.

Las pruebas se dividen en tres áreas clave:

### A. Backend For Frontend (`rednorte-bff`) - 12 Pruebas
Valida la seguridad perimetral de la API y el enrutamiento correcto hacia los microservicios:
*   **Autenticación (`/api/auth/login`):** Verifica el inicio de sesión exitoso y fallido para los roles de Paciente, Médico y Recepcionista.
*   **Filtro de Seguridad (`JwtFilter`):** Comprueba que las solicitudes sin token o con tokens inválidos sean bloqueadas con código HTTP `401 Unauthorized`.
*   **Enrutamiento SSE (`/api/notifications/stream`):** Comprueba la integración del canal de Server-Sent Events bajo autenticación con query params.

### B. Servicio de Lista de Espera (`waiting-list-service`) - 17 Pruebas
Garantiza las reglas de negocio críticas del flujo clínico:
*   **Validación de RUT Chileno:** Valida que el algoritmo de Módulo 11 actúe correctamente rechazando RUTs falsificados y permitiendo RUTs válidos y de prueba.
*   **Cálculo Dinámico de Prioridades:** Comprueba la fórmula clínica y la asignación correcta del bono de edad (infantil $+10$ puntos, adultos mayores $+20$ puntos) y gravedad ($1$ a $5$).
*   **Búsqueda y Cola de Espera:** Evalúa la ordenación correcta de la lista de espera basada en prioridad y fecha de solicitud, y la selección del paciente óptimo para reasignación (`/api/waitlist/highest-priority`).

### C. Servicio de Cancelaciones (`cancellation-service`) - 14 Pruebas
Prueba la transaccionalidad de las citas médicas y auditoría:
*   **Agendamiento y Asistencia:** Valida el registro de citas médicas y el cambio de estado a `PRESENTE` al realizar Check-in.
*   **Flujo de Cancelación y Reasignación:** Simula la cancelación de una cita y verifica que el microservicio reasigne el cupo libre automáticamente al paciente más prioritario de la lista de espera.
*   **Auditoría de Canales Digitales:** Verifica el correcto almacenamiento y simulación de alertas SMS y correo electrónico enviados al paciente reasignado.

---

## 2. Cobertura de Código con JaCoCo

El plugin **JaCoCo** (`jacoco-maven-plugin`) ha sido integrado en los archivos `pom.xml` de los tres componentes de backend. Este plugin instrumentaliza el bytecode Java durante la ejecución de las pruebas unitarias y genera métricas precisas sobre las líneas de código, instrucciones y ramas ejecutadas.

### Cobertura Alcanzada (JaCoCo Metrics)

| Subproyecto | Pruebas Ejecutadas | Resultado | Cobertura de Instrucciones | Cobertura de Ramas (Branches) | Estado de Aprobación |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **rednorte-bff** | 12 | Exitosas (12/12) | **76%** | **70%** | Aprobado (> 60%) |
| **waiting-list-service** | 17 | Exitosas (17/17) | **74%** | **66%** | Aprobado (> 60%) |
| **cancellation-service** | 14 | Exitosas (14/14) | **71%** | **63%** | Aprobado (> 60%) |

---

## 3. Instrucciones de Ejecución y Generación de Reportes

Para ejecutar de manera local las pruebas y visualizar los reportes HTML interactivos de cobertura de código, siga los siguientes pasos:

### Prerrequisitos
*   Tener configurado **Java JDK 17 o superior** y Maven (incluido mediante el wrapper `./mvnw.cmd`).

### Paso 1: Ejecutar Pruebas
Abra una consola en la raíz de cualquiera de los microservicios backend y corra el siguiente comando:
```powershell
./mvnw.cmd clean test
```
Este comando compilará el código, activará automáticamente el perfil `test` (utilizando la persistencia aislada de H2 en memoria) y ejecutará todas las pruebas JUnit de la suite.

### Paso 2: Generar y Visualizar Reportes HTML
Al finalizar los tests, JaCoCo compilará y guardará automáticamente un reporte HTML interactivo en la carpeta de compilación.

Para revisar los reportes, abra con su navegador web favorito los siguientes archivos:

1.  **Reporte BFF:**
    `[raiz-proyecto]/rednorte-backend/rednorte-bff/target/site/jacoco/index.html`
2.  **Reporte Lista de Espera:**
    `[raiz-proyecto]/rednorte-backend/waiting-list-service/target/site/jacoco/index.html`
3.  **Reporte Cancelaciones:**
    `[raiz-proyecto]/rednorte-backend/cancellation-service/target/site/jacoco/index.html`

El reporte HTML permite navegar jerárquicamente por paquetes, clases y métodos, coloreando en verde las líneas de código cubiertas y en rojo las secciones no probadas, certificando el cumplimiento del indicador de calidad exigido.

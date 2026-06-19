# Enlaces a Repositorios GitHub - RedNorte

Este documento detalla la jerarquía, estructura de ramas y enlaces a los repositorios de GitHub de la solución de software distribuida para la clínica **RedNorte**, dando cumplimiento a las instrucciones del entregable de la **Evaluación Parcial N°3 (DSY1106)**.

---

## 1. Estructura del Repositorio Principal

Para facilitar la evaluación y centralizar el despliegue del proyecto, los componentes frontend, backend for frontend (BFF) y microservicios se encuentran agrupados y organizados dentro del mismo repositorio de control de versiones bajo un esquema monorrepo:

*   **Enlace al Repositorio Principal:** `https://github.com/tomasdfp/Rednorte.git`
*   **Rama de Trabajo Actual (JWT Security & Persistencia):** `feature/jwt-security`
*   **Rama de Integración Estable:** `develop`
*   **Rama de Producción:** `main`

---

## 2. Propósito y Descripción de Componentes

El repositorio contiene las siguientes carpetas estructuradas de forma independiente:

### 📁 Documentación General (`[raíz]`)
*   **Propósito:** Contiene las guías globales de ejecución e integración.
*   **Archivos Clave:**
    *   [README.md](README.md): Guía de arranque rápido local E2E paso a paso.
    *   [openapi.yaml](openapi.yaml): Especificación Swagger / OpenAPI de los endpoints de la API REST expuestos por el BFF.
    *   [PERSISTENCIA.md](PERSISTENCIA.md): Informe técnico de persistencia con PostgreSQL y aislamiento de pruebas unitarias en H2.
    *   [PRUEBAS.md](PRUEBAS.md): Reporte de cobertura de JaCoCo, casos de prueba y comandos de ejecución.

### 📁 Componente Frontend React (`/rednorte-frontend`)
*   **Propósito:** Aplicación SPA (Single Page Application) responsiva desarrollada en **React (TypeScript) + Vite + Tailwind CSS**.
*   **Características:** Implementa el patrón Observer conectado a Server-Sent Events (SSE) para renderizar alertas clínicas y reasignaciones en tiempo real sin requerir recargas de página.
*   **Formato de Entrega:** Empaquetado bajo el estándar NPM (`package.json`, `tsconfig.json`).

### 📁 Backend For Frontend (BFF) (`/rednorte-backend/rednorte-bff`)
*   **Propósito:** Orquestador de la comunicación del cliente. Implementa la seguridad perimetral de la aplicación mediante Spring Security y la generación de tokens JWT.
*   **Tecnologías:** Java 17+, Spring Boot 3.3.0, Maven.
*   **Formato de Entrega:** Proyecto Maven estándar (`pom.xml`) con plugin JaCoCo de cobertura.

### 📁 Microservicio de Lista de Espera (`/rednorte-backend/waiting-list-service`)
*   **Propósito:** Gestiona el almacenamiento y priorización clínica de pacientes y médicos.
*   **Persistencia:** PostgreSQL (`rednorte_waitlist`) en producción, H2 en memoria durante la ejecución de pruebas unitarias.
*   **Formato de Entrega:** Proyecto Maven estándar (`pom.xml`) y perfil de configuración aislada de test.

### 📁 Microservicio de Cancelaciones (`/rednorte-backend/cancellation-service`)
*   **Propósito:** Gestiona la agenda de citas, check-ins, cancelaciones médicas y activa el proceso automático de asignación de vacantes. Audita alertas digitales de comunicación (SMS/Email).
*   **Persistencia:** PostgreSQL (`rednorte_cancellation`) en producción, H2 en memoria durante la ejecución de pruebas unitarias.
*   **Formato de Entrega:** Proyecto Maven estándar (`pom.xml`) y perfil de configuración aislada de test.

---

## 3. Modelo de Trabajo en Git (GitFlow)

El equipo utiliza la metodología **GitFlow** para asegurar un historial limpio y coordinado de desarrollo:
1.  **`main`:** Contiene la versión de lanzamiento lista para producción.
2.  **`develop`:** Rama de integración continua.
3.  **`feature/`:** Ramas temporales creadas para implementar características específicas (ej: `feature/jwt-security` utilizada para consolidar las bases de datos PostgreSQL, la autenticación y la cobertura de pruebas unitarias).

# RedNorte - Sistema de Gestión de Horas Médicas y Lista de Espera

Este repositorio contiene la solución completa de software para la gestión de agendas clínicas, cancelaciones y reasignación automatizada de horas médicas en base a prioridad para la clínica **RedNorte**.

El proyecto está diseñado bajo una arquitectura distribuida de microservicios que implementa patrones de diseño y arquitectónicos avanzados, garantizando eficiencia, mantenibilidad y escalabilidad.

---

## 1. Arquitectura del Sistema

La solución está dividida en componentes independientes de red:

*   **Frontend (React + Vite + Tailwind CSS):** Interfaz para pacientes, médicos y personal administrativo.
*   **Backend for Frontend (BFF) (Puerto `8080`):** Centraliza la comunicación del frontend, expone el canal de Server-Sent Events (SSE) y gestiona la seguridad perimetral JWT.
*   **Microservicio de Lista de Espera (Puerto `8081`):** Mantiene pacientes, personal de salud, solicitudes y calcula las prioridades clínicas.
*   **Microservicio de Cancelación (Puerto `8082`):** Administra la agenda de citas, procesa check-ins, cancelaciones, ejecuta el algoritmo de reasignación y registra alertas de comunicación.

```mermaid
graph TD
    Client[React Frontend - Puerto 5173]
    BFF[Backend For Frontend - Puerto 8080]
    Waitlist[Waiting List Service - Puerto 8081]
    Cancel[Cancellation Service - Puerto 8082]
    PG_1[(PostgreSQL - rednorte_waitlist)]
    PG_2[(PostgreSQL - rednorte_cancellation)]

    Client -->|API REST & SSE (JWT Auth)| BFF
    BFF -->|REST Calls| Waitlist
    BFF -->|REST Calls| Cancel
    Waitlist --> PG_1
    Cancel --> PG_2
    Cancel -->|Consulta de Prioridades| Waitlist
```

---

## 2. Tecnologías y Patrones de Diseño Implementados

*   **Seguridad JWT:** Spring Security y filtros de autenticación stateless (`JwtFilter`) en el BFF. Las conexiones SSE se autorizan mediante token como parámetro de consulta.
*   **Patrón Observer (Suscripción SSE):** Implementado en el Frontend ([ObserverContext.tsx](rednorte-frontend/src/observer/ObserverContext.tsx)) para reflejar actualizaciones en tiempo real en los paneles.
*   **Patrón BFF / API Proxy:** Centraliza las rutas en [BffController.java](rednorte-backend/rednorte-bff/src/main/java/com/rednorte/bff/controller/BffController.java).
*   **Persistencia JPA / Hibernate:** Mapeo relacional estructurado.
*   **Motores de Base de Datos:** PostgreSQL para persistencia por defecto, y base de datos H2 en memoria aislada para tests automáticos.

---

## 3. Requisitos Previos

Para ejecutar la solución en local de manera integrada, asegúrate de contar con:
*   **Java JDK 17 o superior** (Java 21 recomendado).
*   **Node.js LTS** (v18 o superior).
*   **PostgreSQL instalado y corriendo** en el puerto `5432` con la contraseña de administrador configurada.

---

## 4. Guía de Ejecución Local (Paso a Paso)

### Paso 1: Configurar PostgreSQL
Asegúrate de crear las dos bases de datos requeridas en tu instancia local de PostgreSQL:
1.  `rednorte_waitlist`
2.  `rednorte_cancellation`

*Nota: Por defecto, el sistema intentará conectarse utilizando el usuario `postgres` y la contraseña `214683`. Si deseas modificar estas credenciales, puedes configurar las variables de entorno `DB_USERNAME` y `DB_PASSWORD`.*

### Paso 2: Levantar los Componentes de Backend

Abre terminales independientes para cada componente y ejecuta el orden correspondiente:

#### A. Iniciar el Servicio de Lista de Espera (Puerto `8081`)
```bash
cd rednorte-backend/waiting-list-service
./mvnw.cmd spring-boot:run
```

#### B. Iniciar el Servicio de Cancelación (Puerto `8082`)
```bash
cd rednorte-backend/cancellation-service
./mvnw.cmd spring-boot:run
```

#### C. Iniciar el BFF (Puerto `8080`)
```bash
cd rednorte-backend/rednorte-bff
./mvnw.cmd spring-boot:run
```

### Paso 3: Levantar el Frontend React
```bash
cd rednorte-frontend
npm install
npm run dev
```

Navega a la URL indicada (por defecto, `http://localhost:5173`).

---

## 5. Pruebas Automatizadas y Cobertura (JaCoCo)

Para correr la suite de pruebas unitarias y de integración del backend y verificar la lógica de priorización y reasignación en una base de datos aislada H2 en memoria, ejecute el siguiente comando en la carpeta de cualquier microservicio:
```bash
./mvnw.cmd clean test
```
Este comando generará el reporte de cobertura de código de JaCoCo en formato HTML en:
`[directorio-microservicio]/target/site/jacoco/index.html`

---

## 6. Documentación Adicional del Entregable
Encuentra los detalles exigidos por la rúbrica de la **EP3** en la raíz del proyecto:
*   **[PERSISTENCIA.md](PERSISTENCIA.md):** Explicación del modelo relacional PostgreSQL/H2, diagramas de bases de datos y aislamiento.
*   **[PRUEBAS.md](PRUEBAS.md):** Resumen de la suite de testing, reportes de JaCoCo (>60% de cobertura) y comandos.
*   **[REPOSITORIOS.md](REPOSITORIOS.md):** Enlaces oficiales y flujo de GitFlow.
*   **[openapi.yaml](openapi.yaml):** Especificación Swagger / OpenAPI de los endpoints y payloads expuestos.

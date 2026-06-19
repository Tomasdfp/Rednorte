# Descripción de la Persistencia de Datos - RedNorte

Este documento detalla la estrategia de persistencia implementada en el sistema distribuido de la clínica **RedNorte**, cumpliendo con las exigencias del **Indicador 3** y las instrucciones del entregable de la **Evaluación Parcial N°3 (DSY1106)**.

---

## 1. Diseño y Aislamiento de Persistencia

Siguiendo las mejores prácticas para arquitecturas de microservicios, se ha implementado el patrón **Database per Service** (Base de Datos por Servicio). Cada microservicio posee y gestiona su propia base de datos, garantizando:
*   **Bajo acoplamiento:** Los cambios en el esquema de una base de datos no impactan al otro microservicio.
*   **Autonomía:** Cada microservicio escala y gestiona sus transacciones de forma independiente.
*   **Seguridad:** Un servicio no puede acceder directamente a los datos del otro; toda comunicación se realiza mediante APIs REST autorizadas por el BFF.

### Motores de Persistencia Utilizados
1.  **PostgreSQL (Producción / Local por Defecto):** Motor relacional robusto utilizado para la persistencia real del sistema.
2.  **H2 Database (Entorno de Pruebas):** Base de datos SQL en memoria para la ejecución rápida y autónoma de las pruebas unitarias y de integración, sin dependencias externas.

---

## 2. Modelos de Datos y Mapeo Relacional (JPA/Hibernate)

La persistencia se gestiona mediante **Spring Data JPA** y **Hibernate** como proveedor de ORM. A continuación se detallan las entidades de cada microservicio y sus relaciones:

### A. Microservicio de Lista de Espera (`waiting-list-service`)
Gestiona el registro de pacientes, médicos de la clínica y la cola de espera de priorización.

```
       +------------------+             +--------------------------+
       |     PACIENTE     |             | SOLICITUD_LISTA_ESPERA   |
       +------------------+             +--------------------------+
       | PK: id_paciente  |<-----------o| FK: id_paciente          |
       |     rut (Unique) | (1 a muchos)|     especialidad_req     |
       |     nombre       |             |     prioridad_calculada  |
       |     ...          |             |     estado (PENDIENTE...) |
       +------------------+             +--------------------------+

       +-----------------------+
       |   PROFESIONAL_SALUD   |
       +-----------------------+
       | PK: id_profesional    |
       |     rut (Unique)      |
       |     especialidad      |
       |     disponible (Bool) |
       +-----------------------+
```

#### Detalles de Clases y Anotaciones:
*   **`Paciente`**: Mapeada a la tabla `paciente`. El RUT posee un índice único para acelerar la búsqueda durante el inicio de sesión.
*   **`ProfesionalSalud`**: Mapeada a `profesional_salud`, conteniendo el registro de médicos disponibles y su especialidad.
*   **`SolicitudListaEspera`**: Mapeada a `solicitud_lista_espera`. Se relaciona con `Paciente` mediante una anotación `@ManyToOne` (relación Many-To-One lógica y física). Incluye la propiedad `prioridadCalculada` generada por el algoritmo clínico.

---

### B. Microservicio de Cancelaciones (`cancellation-service`)
Gestiona las citas médicas activas, los logs de reasignaciones automatizadas de cupos libres y la auditoría de notificaciones enviadas a los pacientes.

```
       +----------------------------+
       |            CITA            |
       +----------------------------+
       | PK: id_cita                |
       |     id_paciente (Lógico)   |  ---> Referencia lógica al Paciente
       |     id_profesional (Lógico)|  ---> Referencia lógica al Médico
       |     fecha_hora_programada  |
       |     estado_cita            |
       +----------------------------+

       +----------------------------+             +----------------------------+
       |      REASSIGNMENT_LOG      |             |     NOTIFICATION_AUDIT     |
       +----------------------------+             +----------------------------+
       | PK: id_log                 |             | PK: id_notification        |
       |     fecha_evento           |             |     id_paciente            |
       |     cita_original          |             |     tipo_canal (SMS/EMAIL) |
       |     paciente_reasignado    |             |     destinatario           |
       |     tiempo_procesamiento   |             |     mensaje (Template)     |
       +----------------------------+             +----------------------------+
```

#### Integridad y Relaciones Lógicas entre Microservicios:
*   **`Cita`**: Mapeada a la tabla `cita`. En lugar de tener una relación `@ManyToOne` física con `Paciente` (lo cual violaría el aislamiento al estar en bases de datos separadas), la cita almacena los campos `idPaciente` e `idProfesional` como atributos numéricos simples (`Long`). La consistencia e integridad referencial se garantizan a nivel de aplicación (BFF y peticiones HTTP REST entre servicios).
*   **`ReasignacionLog`**: Mapeada a `reasignacion_log`. Registra cada evento en el que una cita cancelada es reasignada a un paciente de la lista de espera, incluyendo métricas del tiempo de ejecución del proceso.
*   **`NotificationAudit`**: Mapeada a `notification_audit`. Funciona como el registro histórico de notificaciones (SMS y correos electrónicos simulados) enviadas al paciente para informarle sobre la reasignación de su cita médica.

---

## 3. Esquemas DDL SQL de las Bases de Datos

Si se requiere crear o verificar manualmente las tablas en PostgreSQL, se utilizan las siguientes estructuras de base de datos:

### Base de Datos: `rednorte_waitlist`
```sql
CREATE TABLE paciente (
    id_paciente BIGINT PRIMARY KEY,
    rut VARCHAR(20) NOT NULL UNIQUE,
    nombre_completo VARCHAR(255) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    telefono VARCHAR(50),
    email VARCHAR(255),
    direccion VARCHAR(500),
    prevision VARCHAR(50)
);

CREATE INDEX idx_paciente_rut ON paciente(rut);

CREATE TABLE profesional_salud (
    id_profesional BIGINT PRIMARY KEY,
    rut VARCHAR(20) NOT NULL UNIQUE,
    nombre_completo VARCHAR(255) NOT NULL,
    especialidad VARCHAR(100) NOT NULL,
    registro_nacional VARCHAR(50) UNIQUE,
    horario_atencion VARCHAR(255),
    disponible BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_profesional_especialidad ON profesional_salud(especialidad);

CREATE TABLE solicitud_lista_espera (
    id_solicitud SERIAL PRIMARY KEY,
    id_paciente BIGINT NOT NULL,
    fecha_solicitud DATE NOT NULL,
    nivel_gravedad INT NOT NULL CHECK (nivel_gravedad BETWEEN 1 AND 5),
    especialidad_requerida VARCHAR(100) NOT NULL,
    diagnostico_preliminar VARCHAR(1000),
    estado VARCHAR(50) DEFAULT 'PENDIENTE',
    prioridad_calculada INT NOT NULL,
    comentarios_medicos VARCHAR(2000),
    CONSTRAINT fk_solicitud_paciente FOREIGN KEY (id_paciente) REFERENCES paciente(id_paciente) ON DELETE CASCADE
);

CREATE INDEX idx_waitlist_priority ON solicitud_lista_espera(especialidad_requerida, estado, prioridad_calculada DESC, fecha_solicitud ASC);
```

### Base de Datos: `rednorte_cancellation`
```sql
CREATE TABLE cita (
    id_cita BIGINT PRIMARY KEY,
    id_paciente BIGINT NOT NULL,
    id_profesional BIGINT NOT NULL,
    fecha_hora_programada TIMESTAMP NOT NULL,
    duracion_estimada INT DEFAULT 30,
    estado_cita VARCHAR(50) NOT NULL DEFAULT 'PROGRAMADA',
    motivo_cancelacion VARCHAR(255),
    observaciones VARCHAR(1000)
);

CREATE INDEX idx_cita_doctor_fecha ON cita(id_profesional, fecha_hora_programada);
CREATE INDEX idx_cita_paciente ON cita(id_paciente);

CREATE TABLE reasignacion_log (
    id_log SERIAL PRIMARY KEY,
    fecha_evento TIMESTAMP NOT NULL,
    cita_original BIGINT NOT NULL,
    cita_reasignada BIGINT NOT NULL,
    nombre_paciente_original VARCHAR(255) NOT NULL,
    nombre_paciente_reasignado VARCHAR(255) NOT NULL,
    especialidad VARCHAR(100) NOT NULL,
    motivo VARCHAR(255),
    algoritmo_usado VARCHAR(100) NOT NULL,
    tiempo_procesamiento_ms INT NOT NULL
);

CREATE TABLE notification_audit (
    id_notification SERIAL PRIMARY KEY,
    id_paciente BIGINT NOT NULL,
    nombre_paciente VARCHAR(255) NOT NULL,
    tipo_canal VARCHAR(20) NOT NULL, -- SMS, EMAIL
    destinatario VARCHAR(100) NOT NULL,
    mensaje VARCHAR(2000) NOT NULL,
    fecha_envio TIMESTAMP NOT NULL
);

CREATE INDEX idx_notification_paciente ON notification_audit(id_paciente);
```

---

## 4. Aislamiento del Entorno de Pruebas Unitarias

Para asegurar que las pruebas unitarias y de integración se ejecuten de manera rápida, limpia y sin requerir un servidor PostgreSQL activo (lo cual es vital para el desarrollo local y entornos de CI/CD):
1.  **Perfil de Test Activo:** Todas las clases de pruebas JUnit del backend se encuentran anotadas con `@ActiveProfiles("test")`.
2.  **Configuración de Sobreescritura (`application-test.properties`):** En el directorio `src/test/resources/` de cada microservicio, se define una base de datos **H2 en memoria** con su propio dialecto:
    ```properties
    spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1
    spring.datasource.driver-class-name=org.h2.Driver
    spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
    spring.jpa.hibernate.ddl-auto=create-drop
    ```
3.  **Ciclo de Vida Limpio:** Al iniciar la suite de pruebas con `./mvnw.cmd test`, Hibernate crea la estructura de tablas vacía en la base de datos H2 en memoria, ejecuta los tests y los destruye inmediatamente al finalizar, garantizando un entorno reproducible y aislado.

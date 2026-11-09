-- ================================================================
-- Healthcare and EMS Database Management System
-- MySQL schema creation script
-- Team: Kenji Matsumura-Richardson, Yervant Kennivong,
--       and Emmanuel George
-- ================================================================

-- This script is safe to run more than once because it uses
-- CREATE DATABASE/TABLE IF NOT EXISTS and CREATE OR REPLACE VIEW.
-- To completely reset the project during development, uncomment the
-- next line. WARNING: it deletes the database and all of its data.
-- DROP DATABASE IF EXISTS healthcare_ems_db;

CREATE DATABASE IF NOT EXISTS healthcare_ems_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_0900_ai_ci;

USE healthcare_ems_db;

-- ================================================================
-- 1. PATIENT
-- Stores permanent identifying and contact information for patients.
-- ================================================================
CREATE TABLE IF NOT EXISTS patient (
    patient_id              INT UNSIGNED AUTO_INCREMENT,
    first_name              VARCHAR(50) NOT NULL,
    last_name               VARCHAR(50) NOT NULL,
    date_of_birth           DATE NOT NULL,
    sex                     ENUM('Male', 'Female', 'Other', 'Unknown')
                            NOT NULL DEFAULT 'Unknown',
    blood_type              ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-',
                                 'O+', 'O-', 'Unknown')
                            NOT NULL DEFAULT 'Unknown',
    phone                   VARCHAR(20),
    street_address          VARCHAR(120),
    city                    VARCHAR(60),
    state_code              CHAR(2),
    postal_code             VARCHAR(10),
    emergency_contact_name  VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_patient PRIMARY KEY (patient_id),
    INDEX idx_patient_name (last_name, first_name),
    INDEX idx_patient_dob (date_of_birth)
) ENGINE = InnoDB;

-- ================================================================
-- 2. HOSPITAL
-- Stores hospitals that receive patients and manage resources.
-- ================================================================
CREATE TABLE IF NOT EXISTS hospital (
    hospital_id    INT UNSIGNED AUTO_INCREMENT,
    hospital_name  VARCHAR(100) NOT NULL,
    street_address VARCHAR(120) NOT NULL,
    city            VARCHAR(60) NOT NULL,
    state_code      CHAR(2) NOT NULL,
    postal_code     VARCHAR(10) NOT NULL,
    phone           VARCHAR(20),
    latitude        DECIMAL(9,6),
    longitude       DECIMAL(9,6),

    CONSTRAINT pk_hospital PRIMARY KEY (hospital_id),
    CONSTRAINT uq_hospital_name UNIQUE (hospital_name),
    CONSTRAINT chk_hospital_latitude
        CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
    CONSTRAINT chk_hospital_longitude
        CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
) ENGINE = InnoDB;

-- ================================================================
-- 3. DEPARTMENT
-- Stores departments belonging to each hospital.
-- ================================================================
CREATE TABLE IF NOT EXISTS department (
    department_id   INT UNSIGNED AUTO_INCREMENT,
    hospital_id     INT UNSIGNED NOT NULL,
    department_name VARCHAR(80) NOT NULL,
    capacity        INT UNSIGNED NOT NULL DEFAULT 0,

    CONSTRAINT pk_department PRIMARY KEY (department_id),
    CONSTRAINT uq_department_hospital
        UNIQUE (hospital_id, department_name),
    CONSTRAINT fk_department_hospital
        FOREIGN KEY (hospital_id)
        REFERENCES hospital (hospital_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    INDEX idx_department_hospital (hospital_id)
) ENGINE = InnoDB;

-- ================================================================
-- 4. STAFF
-- Stores hospital personnel and the departments where they work.
-- ================================================================
CREATE TABLE IF NOT EXISTS staff (
    staff_id      INT UNSIGNED AUTO_INCREMENT,
    department_id INT UNSIGNED NOT NULL,
    first_name    VARCHAR(50) NOT NULL,
    last_name     VARCHAR(50) NOT NULL,
    date_of_birth DATE NOT NULL,
    staff_role    VARCHAR(50) NOT NULL,
    phone         VARCHAR(20),
    email         VARCHAR(120),
    staff_status  ENUM('Active', 'Off Duty', 'On Leave', 'Inactive')
                  NOT NULL DEFAULT 'Active',

    CONSTRAINT pk_staff PRIMARY KEY (staff_id),
    CONSTRAINT uq_staff_email UNIQUE (email),
    CONSTRAINT fk_staff_department
        FOREIGN KEY (department_id)
        REFERENCES department (department_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    INDEX idx_staff_department (department_id),
    INDEX idx_staff_name (last_name, first_name)
) ENGINE = InnoDB;

-- ================================================================
-- 5. EMS_UNIT
-- Stores ambulances and other first-response vehicles.
-- ================================================================
CREATE TABLE IF NOT EXISTS ems_unit (
    unit_id              INT UNSIGNED AUTO_INCREMENT,
    hospital_id          INT UNSIGNED NOT NULL,
    unit_number          VARCHAR(20) NOT NULL,
    unit_type            ENUM('Ambulance', 'Advanced Life Support',
                              'Basic Life Support', 'First Response', 'Other')
                         NOT NULL DEFAULT 'Ambulance',
    unit_status          ENUM('Available', 'Dispatched', 'En Route',
                              'On Scene', 'Transporting Patient',
                              'At Hospital', 'Out of Service')
                         NOT NULL DEFAULT 'Available',
    current_latitude     DECIMAL(9,6),
    current_longitude    DECIMAL(9,6),
    last_location_update DATETIME,

    CONSTRAINT pk_ems_unit PRIMARY KEY (unit_id),
    CONSTRAINT uq_ems_unit_number UNIQUE (unit_number),
    CONSTRAINT fk_ems_unit_hospital
        FOREIGN KEY (hospital_id)
        REFERENCES hospital (hospital_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT chk_ems_unit_latitude
        CHECK (current_latitude IS NULL OR current_latitude BETWEEN -90 AND 90),
    CONSTRAINT chk_ems_unit_longitude
        CHECK (current_longitude IS NULL OR current_longitude BETWEEN -180 AND 180),
    INDEX idx_ems_unit_hospital (hospital_id),
    INDEX idx_ems_unit_status (unit_status)
) ENGINE = InnoDB;

-- ================================================================
-- 6. EMS_LOCATION
-- Stores the historical locations reported by each EMS unit.
-- ================================================================
CREATE TABLE IF NOT EXISTS ems_location (
    location_id BIGINT UNSIGNED AUTO_INCREMENT,
    unit_id     INT UNSIGNED NOT NULL,
    latitude    DECIMAL(9,6) NOT NULL,
    longitude   DECIMAL(9,6) NOT NULL,
    recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_ems_location PRIMARY KEY (location_id),
    CONSTRAINT fk_ems_location_unit
        FOREIGN KEY (unit_id)
        REFERENCES ems_unit (unit_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT chk_ems_location_latitude
        CHECK (latitude BETWEEN -90 AND 90),
    CONSTRAINT chk_ems_location_longitude
        CHECK (longitude BETWEEN -180 AND 180),
    INDEX idx_ems_location_unit_time (unit_id, recorded_at)
) ENGINE = InnoDB;

-- ================================================================
-- 7. EMERGENCY_INCIDENT
-- Stores emergency calls or events that may require an EMS response.
-- A patient may be unknown when an incident is first reported.
-- ================================================================
CREATE TABLE IF NOT EXISTS emergency_incident (
    incident_id            INT UNSIGNED AUTO_INCREMENT,
    patient_id             INT UNSIGNED,
    destination_hospital_id INT UNSIGNED,
    incident_type          VARCHAR(80) NOT NULL,
    priority_level         ENUM('Low', 'Moderate', 'High', 'Critical')
                           NOT NULL DEFAULT 'Moderate',
    incident_description   TEXT,
    incident_address       VARCHAR(150) NOT NULL,
    latitude               DECIMAL(9,6),
    longitude              DECIMAL(9,6),
    reported_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    incident_status        ENUM('Reported', 'Active', 'Transporting',
                                'Closed', 'Cancelled')
                           NOT NULL DEFAULT 'Reported',

    CONSTRAINT pk_emergency_incident PRIMARY KEY (incident_id),
    CONSTRAINT fk_incident_patient
        FOREIGN KEY (patient_id)
        REFERENCES patient (patient_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_incident_destination_hospital
        FOREIGN KEY (destination_hospital_id)
        REFERENCES hospital (hospital_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT chk_incident_latitude
        CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
    CONSTRAINT chk_incident_longitude
        CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
    INDEX idx_incident_patient (patient_id),
    INDEX idx_incident_destination (destination_hospital_id),
    INDEX idx_incident_status_priority (incident_status, priority_level),
    INDEX idx_incident_reported_at (reported_at)
) ENGINE = InnoDB;

-- ================================================================
-- 8. DISPATCH
-- Resolves the relationship between incidents and responding EMS units.
-- One incident can have several dispatches and one unit can respond to
-- many incidents over time.
-- ================================================================
CREATE TABLE IF NOT EXISTS dispatch (
    dispatch_id          INT UNSIGNED AUTO_INCREMENT,
    incident_id          INT UNSIGNED NOT NULL,
    unit_id              INT UNSIGNED NOT NULL,
    dispatch_status      ENUM('Assigned', 'En Route', 'On Scene',
                              'Transporting', 'Completed', 'Cancelled')
                         NOT NULL DEFAULT 'Assigned',
    dispatch_time        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    arrival_scene_time   DATETIME,
    departure_scene_time DATETIME,
    hospital_arrival_time DATETIME,
    clear_time           DATETIME,

    CONSTRAINT pk_dispatch PRIMARY KEY (dispatch_id),
    CONSTRAINT uq_dispatch_incident_unit UNIQUE (incident_id, unit_id),
    CONSTRAINT fk_dispatch_incident
        FOREIGN KEY (incident_id)
        REFERENCES emergency_incident (incident_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_dispatch_unit
        FOREIGN KEY (unit_id)
        REFERENCES ems_unit (unit_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT chk_dispatch_time_order
        CHECK (
            (arrival_scene_time IS NULL OR arrival_scene_time >= dispatch_time)
            AND (departure_scene_time IS NULL OR arrival_scene_time IS NULL
                 OR departure_scene_time >= arrival_scene_time)
            AND (hospital_arrival_time IS NULL OR departure_scene_time IS NULL
                 OR hospital_arrival_time >= departure_scene_time)
            AND (clear_time IS NULL OR clear_time >= dispatch_time)
        ),
    INDEX idx_dispatch_incident (incident_id),
    INDEX idx_dispatch_unit (unit_id),
    INDEX idx_dispatch_status (dispatch_status)
) ENGINE = InnoDB;

-- ================================================================
-- 9. PATIENT_ENCOUNTER
-- Stores each patient visit or treatment event at a hospital.
-- ================================================================
CREATE TABLE IF NOT EXISTS patient_encounter (
    encounter_id       INT UNSIGNED AUTO_INCREMENT,
    patient_id         INT UNSIGNED NOT NULL,
    hospital_id        INT UNSIGNED NOT NULL,
    department_id      INT UNSIGNED NOT NULL,
    incident_id        INT UNSIGNED,
    attending_staff_id INT UNSIGNED,
    arrival_time       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    triage_level       ENUM('1 - Critical', '2 - Emergent', '3 - Urgent',
                            '4 - Less Urgent', '5 - Non-Urgent'),
    chief_complaint    VARCHAR(255),
    encounter_status   ENUM('Waiting', 'In Treatment', 'Admitted',
                            'Discharged', 'Transferred')
                       NOT NULL DEFAULT 'Waiting',
    discharge_time     DATETIME,

    CONSTRAINT pk_patient_encounter PRIMARY KEY (encounter_id),
    CONSTRAINT fk_encounter_patient
        FOREIGN KEY (patient_id)
        REFERENCES patient (patient_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_encounter_hospital
        FOREIGN KEY (hospital_id)
        REFERENCES hospital (hospital_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_encounter_department
        FOREIGN KEY (department_id)
        REFERENCES department (department_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_encounter_incident
        FOREIGN KEY (incident_id)
        REFERENCES emergency_incident (incident_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_encounter_staff
        FOREIGN KEY (attending_staff_id)
        REFERENCES staff (staff_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT chk_encounter_discharge_time
        CHECK (discharge_time IS NULL OR discharge_time >= arrival_time),
    INDEX idx_encounter_patient_time (patient_id, arrival_time),
    INDEX idx_encounter_hospital (hospital_id),
    INDEX idx_encounter_department (department_id),
    INDEX idx_encounter_incident (incident_id),
    INDEX idx_encounter_staff (attending_staff_id),
    INDEX idx_encounter_status (encounter_status)
) ENGINE = InnoDB;

-- ================================================================
-- 10. RESOURCE
-- Defines the resource types that hospitals can report.
-- Examples: emergency beds, ICU beds, ventilators, or trauma rooms.
-- ================================================================
CREATE TABLE IF NOT EXISTS resource (
    resource_id   INT UNSIGNED AUTO_INCREMENT,
    resource_name VARCHAR(80) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    description   VARCHAR(255),

    CONSTRAINT pk_resource PRIMARY KEY (resource_id),
    CONSTRAINT uq_resource_name UNIQUE (resource_name),
    INDEX idx_resource_type (resource_type)
) ENGINE = InnoDB;

-- ================================================================
-- 11. HOSPITAL_RESOURCE
-- Resolves the many-to-many relationship between hospitals and resources.
-- ================================================================
CREATE TABLE IF NOT EXISTS hospital_resource (
    hospital_id       INT UNSIGNED NOT NULL,
    resource_id       INT UNSIGNED NOT NULL,
    total_quantity    INT UNSIGNED NOT NULL DEFAULT 0,
    available_quantity INT UNSIGNED NOT NULL DEFAULT 0,
    last_updated      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                      ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_hospital_resource
        PRIMARY KEY (hospital_id, resource_id),
    CONSTRAINT fk_hospital_resource_hospital
        FOREIGN KEY (hospital_id)
        REFERENCES hospital (hospital_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_hospital_resource_resource
        FOREIGN KEY (resource_id)
        REFERENCES resource (resource_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT chk_hospital_resource_quantities
        CHECK (available_quantity <= total_quantity),
    INDEX idx_hospital_resource_resource (resource_id),
    INDEX idx_hospital_resource_available (available_quantity)
) ENGINE = InnoDB;

-- ================================================================
-- VIEWS
-- These views support the current-status screens described in the project.
-- ================================================================

CREATE OR REPLACE VIEW current_unit_status AS
SELECT
    u.unit_id,
    u.unit_number,
    u.unit_type,
    u.unit_status,
    u.current_latitude,
    u.current_longitude,
    u.last_location_update,
    h.hospital_id,
    h.hospital_name
FROM ems_unit AS u
JOIN hospital AS h
    ON h.hospital_id = u.hospital_id;

CREATE OR REPLACE VIEW active_incident_dispatch AS
SELECT
    i.incident_id,
    i.incident_type,
    i.priority_level,
    i.incident_status,
    i.incident_address,
    i.reported_at,
    d.dispatch_id,
    d.dispatch_status,
    d.dispatch_time,
    u.unit_id,
    u.unit_number,
    u.unit_status,
    h.hospital_name AS destination_hospital
FROM emergency_incident AS i
LEFT JOIN dispatch AS d
    ON d.incident_id = i.incident_id
LEFT JOIN ems_unit AS u
    ON u.unit_id = d.unit_id
LEFT JOIN hospital AS h
    ON h.hospital_id = i.destination_hospital_id
WHERE i.incident_status IN ('Reported', 'Active', 'Transporting');

CREATE OR REPLACE VIEW available_hospital_resources AS
SELECT
    h.hospital_id,
    h.hospital_name,
    r.resource_id,
    r.resource_name,
    r.resource_type,
    hr.total_quantity,
    hr.available_quantity,
    hr.last_updated
FROM hospital_resource AS hr
JOIN hospital AS h
    ON h.hospital_id = hr.hospital_id
JOIN resource AS r
    ON r.resource_id = hr.resource_id
WHERE hr.available_quantity > 0;

-- ================================================================
-- Verification queries
-- ================================================================

SHOW TABLES;

SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'healthcare_ems_db'
ORDER BY table_type, table_name;


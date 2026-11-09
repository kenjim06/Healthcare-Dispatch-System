-- ============================================================================
-- Healthcare and EMS Database Management System
-- Fictional demonstration data for MySQL
-- Team: Kenji Matsumura-Richardson, Yervant Kennivong, and Emmanuel George
-- ============================================================================
-- All records in this file are fictional and were created solely for
-- testing and demonstration. No real patient information,
-- protected health information (PHI), hospital operational data, or employee
-- information is included.
--
-- Run Healthcare_EMS_Schema.sql first, then run this file once while the
-- healthcare_ems_db schema is selected.
-- ============================================================================

USE healthcare_ems_db;

START TRANSACTION;

-- ============================================================================
-- 1. HOSPITAL
-- ============================================================================
INSERT INTO hospital (
    hospital_id,
    hospital_name,
    street_address,
    city,
    state_code,
    postal_code,
    phone,
    latitude,
    longitude
)
VALUES
    (1, 'Central Valley Medical Center', '100 Wellness Way',
     'Nashville', 'TN', '37201', '615-555-0100', 36.162700, -86.781600),
    (2, 'Riverside Community Hospital', '245 Riverbend Drive',
     'Murfreesboro', 'TN', '37130', '615-555-0200', 35.845600, -86.390300),
    (3, 'Northside Regional Hospital', '780 Northgate Boulevard',
     'Franklin', 'TN', '37064', '615-555-0300', 35.925100, -86.868900);

-- ============================================================================
-- 2. DEPARTMENT
-- ============================================================================
INSERT INTO department (
    department_id,
    hospital_id,
    department_name,
    capacity
)
VALUES
    (1, 1, 'Emergency Department', 30),
    (2, 1, 'Intensive Care Unit', 16),
    (3, 1, 'Cardiology', 20),
    (4, 2, 'Emergency Department', 24),
    (5, 2, 'Pediatrics', 18),
    (6, 2, 'Orthopedics', 14),
    (7, 3, 'Emergency Department', 28),
    (8, 3, 'Intensive Care Unit', 12),
    (9, 3, 'Neurology', 15);

-- ============================================================================
-- 3. STAFF
-- ============================================================================
INSERT INTO staff (
    staff_id,
    department_id,
    first_name,
    last_name,
    date_of_birth,
    staff_role,
    phone,
    email,
    staff_status
)
VALUES
    (1, 1, 'Ava', 'Morgan', '1981-03-14', 'Emergency Physician',
     '615-555-1101', 'ava.morgan@example.com', 'Active'),
    (2, 1, 'Liam', 'Brooks', '1988-07-22', 'Registered Nurse',
     '615-555-1102', 'liam.brooks@example.com', 'Active'),
    (3, 2, 'Sophia', 'Reed', '1979-11-06', 'Critical Care Physician',
     '615-555-1103', 'sophia.reed@example.com', 'Active'),
    (4, 2, 'Noah', 'Carter', '1990-02-18', 'Critical Care Nurse',
     '615-555-1104', 'noah.carter@example.com', 'Off Duty'),
    (5, 3, 'Maya', 'Collins', '1983-09-27', 'Cardiologist',
     '615-555-1105', 'maya.collins@example.com', 'Active'),
    (6, 3, 'Ethan', 'Hayes', '1992-05-11', 'Cardiology Technician',
     '615-555-1106', 'ethan.hayes@example.com', 'Active'),
    (7, 4, 'Olivia', 'Bennett', '1980-01-30', 'Emergency Physician',
     '615-555-1201', 'olivia.bennett@example.com', 'Active'),
    (8, 4, 'Lucas', 'Turner', '1989-08-09', 'Registered Nurse',
     '615-555-1202', 'lucas.turner@example.com', 'Active'),
    (9, 5, 'Emma', 'Foster', '1984-12-15', 'Pediatrician',
     '615-555-1203', 'emma.foster@example.com', 'Active'),
    (10, 5, 'Mason', 'Parker', '1991-04-23', 'Pediatric Nurse',
     '615-555-1204', 'mason.parker@example.com', 'On Leave'),
    (11, 6, 'Chloe', 'Sanders', '1978-06-19', 'Orthopedic Physician',
     '615-555-1205', 'chloe.sanders@example.com', 'Active'),
    (12, 6, 'Elijah', 'Ward', '1993-10-02', 'Physical Therapist',
     '615-555-1206', 'elijah.ward@example.com', 'Active'),
    (13, 7, 'Amelia', 'Price', '1982-02-25', 'Emergency Physician',
     '615-555-1301', 'amelia.price@example.com', 'Active'),
    (14, 7, 'James', 'Cooper', '1987-05-17', 'Registered Nurse',
     '615-555-1302', 'james.cooper@example.com', 'Active'),
    (15, 8, 'Harper', 'Bailey', '1977-07-08', 'Intensivist',
     '615-555-1303', 'harper.bailey@example.com', 'Active'),
    (16, 8, 'Benjamin', 'Ross', '1990-09-12', 'Critical Care Nurse',
     '615-555-1304', 'benjamin.ross@example.com', 'Off Duty'),
    (17, 9, 'Evelyn', 'Hughes', '1985-04-04', 'Neurologist',
     '615-555-1305', 'evelyn.hughes@example.com', 'Active'),
    (18, 9, 'Henry', 'Kelly', '1994-01-21', 'Neurology Technician',
     '615-555-1306', 'henry.kelly@example.com', 'Active');

-- ============================================================================
-- 4. PATIENT
-- ============================================================================
INSERT INTO patient (
    patient_id,
    first_name,
    last_name,
    date_of_birth,
    sex,
    blood_type,
    phone,
    street_address,
    city,
    state_code,
    postal_code,
    emergency_contact_name,
    emergency_contact_phone
)
VALUES
    (1, 'Jordan', 'Carter', '1998-04-12', 'Male', 'O+',
     '615-555-2001', '11 Maple Ridge Lane', 'Nashville', 'TN', '37208',
     'Riley Carter', '615-555-2101'),
    (2, 'Taylor', 'Brooks', '1975-09-23', 'Female', 'A+',
     '615-555-2002', '24 Cedar Grove Court', 'Murfreesboro', 'TN', '37129',
     'Morgan Brooks', '615-555-2102'),
    (3, 'Casey', 'Reed', '2002-01-17', 'Other', 'B-',
     '615-555-2003', '38 Hilltop Avenue', 'Franklin', 'TN', '37064',
     'Alex Reed', '615-555-2103'),
    (4, 'Cameron', 'Price', '1968-06-08', 'Male', 'AB+',
     '615-555-2004', '52 Orchard Street', 'Nashville', 'TN', '37211',
     'Drew Price', '615-555-2104'),
    (5, 'Avery', 'Bennett', '1990-11-30', 'Female', 'O-',
     '615-555-2005', '67 Willow Creek Road', 'Murfreesboro', 'TN', '37130',
     'Parker Bennett', '615-555-2105'),
    (6, 'Morgan', 'Turner', '1959-03-26', 'Female', 'A-',
     '615-555-2006', '73 Meadow Park Drive', 'Franklin', 'TN', '37067',
     'Jamie Turner', '615-555-2106'),
    (7, 'Riley', 'Foster', '1985-08-14', 'Male', 'B+',
     '615-555-2007', '89 Lakeview Terrace', 'Nashville', 'TN', '37214',
     'Quinn Foster', '615-555-2107'),
    (8, 'Peyton', 'Collins', '2017-02-05', 'Female', 'Unknown',
     '615-555-2008', '96 Birchwood Circle', 'Murfreesboro', 'TN', '37128',
     'Sydney Collins', '615-555-2108'),
    (9, 'Dakota', 'Hayes', '1982-12-19', 'Other', 'AB-',
     '615-555-2009', '104 Pinecrest Way', 'Franklin', 'TN', '37069',
     'Reese Hayes', '615-555-2109'),
    (10, 'Sydney', 'Parker', '1996-05-21', 'Female', 'O+',
     '615-555-2010', '118 Valley View Road', 'Nashville', 'TN', '37209',
     'Cameron Parker', '615-555-2110'),
    (11, 'Reese', 'Ward', '1948-10-10', 'Male', 'A+',
     '615-555-2011', '123 Garden Walk', 'Murfreesboro', 'TN', '37127',
     'Emerson Ward', '615-555-2111'),
    (12, 'Quinn', 'Sanders', '1988-07-03', 'Female', 'B+',
     '615-555-2012', '136 Forest Glen Drive', 'Franklin', 'TN', '37064',
     'Rowan Sanders', '615-555-2112'),
    (13, 'Rowan', 'Kelly', '1972-01-29', 'Male', 'O-',
     '615-555-2013', '147 Autumn Trail', 'Nashville', 'TN', '37206',
     'Avery Kelly', '615-555-2113'),
    (14, 'Emerson', 'Ross', '2000-09-16', 'Female', 'A-',
     '615-555-2014', '159 Spring Hollow Lane', 'Murfreesboro', 'TN', '37130',
     'Jordan Ross', '615-555-2114'),
    (15, 'Finley', 'Cooper', '1993-04-07', 'Other', 'AB+',
     '615-555-2015', '164 Creekside Place', 'Franklin', 'TN', '37067',
     'Taylor Cooper', '615-555-2115'),
    (16, 'Sawyer', 'Morgan', '1965-08-31', 'Male', 'B-',
     '615-555-2016', '176 Sycamore Bend', 'Nashville', 'TN', '37215',
     'Casey Morgan', '615-555-2116'),
    (17, 'Hayden', 'Bailey', '2007-06-13', 'Female', 'O+',
     '615-555-2017', '182 Brookstone Road', 'Murfreesboro', 'TN', '37129',
     'Harper Bailey', '615-555-2117'),
    (18, 'Alex', 'Hughes', '1979-02-22', 'Male', 'A+',
     '615-555-2018', '193 Oak Meadow Court', 'Franklin', 'TN', '37064',
     'Evelyn Hughes', '615-555-2118'),
    (19, 'Jamie', 'O''Connor', '1986-11-11', 'Female', 'Unknown',
     '615-555-2019', '207 Ridgefield Avenue', 'Nashville', 'TN', '37212',
     'Kendall O''Connor', '615-555-2119'),
    (20, 'Kendall', 'Gray', '1999-03-02', 'Unknown', 'O+',
     '615-555-2020', '219 Westfield Drive', 'Murfreesboro', 'TN', '37130',
     'Skyler Gray', '615-555-2120');

-- ============================================================================
-- 5. EMS_UNIT
-- ============================================================================
INSERT INTO ems_unit (
    unit_id,
    hospital_id,
    unit_number,
    unit_type,
    unit_status,
    current_latitude,
    current_longitude,
    last_location_update
)
VALUES
    (1, 1, 'MED-101', 'Ambulance', 'On Scene',
     36.174200, -86.792500, '2026-11-09 12:18:00'),
    (2, 1, 'ALS-102', 'Advanced Life Support', 'Transporting Patient',
     36.156400, -86.773100, '2026-11-09 12:20:00'),
    (3, 2, 'MED-201', 'Ambulance', 'Transporting Patient',
     35.853100, -86.401200, '2026-11-09 12:17:00'),
    (4, 2, 'BLS-202', 'Basic Life Support', 'Dispatched',
     35.839500, -86.382400, '2026-11-09 12:16:00'),
    (5, 3, 'MED-301', 'Ambulance', 'On Scene',
     35.932000, -86.875600, '2026-11-09 12:19:00'),
    (6, 3, 'FR-302', 'First Response', 'Out of Service',
     35.925100, -86.868900, '2026-11-09 08:00:00');

-- ============================================================================
-- 6. RESOURCE
-- ============================================================================
INSERT INTO resource (
    resource_id,
    resource_name,
    resource_type,
    description
)
VALUES
    (1, 'Emergency Bed', 'Bed',
     'Bed available for emergency department patients.'),
    (2, 'ICU Bed', 'Bed',
     'Bed equipped for intensive care monitoring.'),
    (3, 'Ventilator', 'Equipment',
     'Mechanical ventilation equipment for respiratory support.'),
    (4, 'Trauma Room', 'Room',
     'Room prepared for major trauma evaluation and stabilization.'),
    (5, 'Cardiac Monitor', 'Equipment',
     'Device used for continuous cardiac monitoring.'),
    (6, 'Pediatric Bed', 'Bed',
     'Bed assigned for pediatric patient care.');

-- ============================================================================
-- 7. HOSPITAL_RESOURCE
-- ============================================================================
INSERT INTO hospital_resource (
    hospital_id,
    resource_id,
    total_quantity,
    available_quantity
)
VALUES
    (1, 1, 30, 11),
    (1, 2, 16, 5),
    (1, 3, 12, 4),
    (1, 4, 4, 2),
    (1, 5, 20, 8),
    (1, 6, 8, 3),
    (2, 1, 24, 7),
    (2, 2, 10, 2),
    (2, 3, 8, 3),
    (2, 4, 3, 1),
    (2, 5, 14, 6),
    (2, 6, 18, 9),
    (3, 1, 28, 10),
    (3, 2, 12, 4),
    (3, 3, 10, 5),
    (3, 4, 5, 2),
    (3, 5, 16, 7),
    (3, 6, 6, 2);

-- ============================================================================
-- 8. EMS_LOCATION
-- Historical locations for each EMS unit.
-- ============================================================================
INSERT INTO ems_location (
    location_id,
    unit_id,
    latitude,
    longitude,
    recorded_at
)
VALUES
    (1, 1, 36.162700, -86.781600, '2026-11-09 11:55:00'),
    (2, 1, 36.168100, -86.786400, '2026-11-09 12:05:00'),
    (3, 1, 36.174200, -86.792500, '2026-11-09 12:18:00'),
    (4, 2, 36.171800, -86.790200, '2026-11-09 12:00:00'),
    (5, 2, 36.164900, -86.781100, '2026-11-09 12:10:00'),
    (6, 2, 36.156400, -86.773100, '2026-11-09 12:20:00'),
    (7, 3, 35.845600, -86.390300, '2026-11-09 11:57:00'),
    (8, 3, 35.849200, -86.395800, '2026-11-09 12:08:00'),
    (9, 3, 35.853100, -86.401200, '2026-11-09 12:17:00'),
    (10, 4, 35.845600, -86.390300, '2026-11-09 11:56:00'),
    (11, 4, 35.842300, -86.386500, '2026-11-09 12:06:00'),
    (12, 4, 35.839500, -86.382400, '2026-11-09 12:16:00'),
    (13, 5, 35.925100, -86.868900, '2026-11-09 11:59:00'),
    (14, 5, 35.928700, -86.872100, '2026-11-09 12:09:00'),
    (15, 5, 35.932000, -86.875600, '2026-11-09 12:19:00'),
    (16, 6, 35.925100, -86.868900, '2026-11-09 07:40:00'),
    (17, 6, 35.925100, -86.868900, '2026-11-09 07:50:00'),
    (18, 6, 35.925100, -86.868900, '2026-11-09 08:00:00');

-- ============================================================================
-- 9. EMERGENCY_INCIDENT
-- ============================================================================
INSERT INTO emergency_incident (
    incident_id,
    patient_id,
    destination_hospital_id,
    incident_type,
    priority_level,
    incident_description,
    incident_address,
    latitude,
    longitude,
    reported_at,
    incident_status
)
VALUES
    (1, 1, 1, 'Chest Pain', 'Critical',
     'Patient reported severe chest pressure and shortness of breath.',
     '410 Fictional Avenue, Nashville, TN', 36.170100, -86.788400,
     '2026-11-07 08:05:00', 'Closed'),
    (2, 2, 2, 'Motor Vehicle Collision', 'High',
     'Two-vehicle collision with one patient reporting neck pain.',
     '825 Example Parkway, Murfreesboro, TN', 35.851200, -86.398500,
     '2026-11-07 09:42:00', 'Closed'),
    (3, 3, 3, 'Breathing Difficulty', 'Critical',
     'Patient experiencing acute breathing difficulty.',
     '232 Sample Street, Franklin, TN', 35.930400, -86.873800,
     '2026-11-07 11:14:00', 'Closed'),
    (4, NULL, 1, 'Fall Injury', 'Moderate',
     'Caller reported an adult who fell on exterior stairs.',
     '518 Training Lane, Nashville, TN', 36.174200, -86.792500,
     '2026-11-09 12:01:00', 'Active'),
    (5, 5, 2, 'Allergic Reaction', 'High',
     'Patient developed swelling and difficulty swallowing after eating.',
     '640 Demonstration Drive, Murfreesboro, TN', 35.853100, -86.401200,
     '2026-11-09 11:50:00', 'Transporting'),
    (6, 6, 3, 'Stroke Symptoms', 'Critical',
     'Patient developed facial drooping and weakness on one side.',
     '713 Practice Road, Franklin, TN', 35.929100, -86.871700,
     '2026-11-08 08:46:00', 'Closed'),
    (7, 7, 1, 'Abdominal Pain', 'Moderate',
     'Patient reported persistent lower abdominal pain.',
     '329 Placeholder Court, Nashville, TN', 36.167800, -86.784200,
     '2026-11-08 10:12:00', 'Closed'),
    (8, 8, 2, 'Pediatric Fever', 'Low',
     'Child with fever and fatigue, and the parent requested evaluation.',
     '901 Learning Circle, Murfreesboro, TN', 35.848200, -86.393700,
     '2026-11-08 14:21:00', 'Closed'),
    (9, NULL, NULL, 'Welfare Check', 'Low',
     'Caller requested a welfare check, and the response was cancelled after contact.',
     '145 Mockingbird Way, Franklin, TN', 35.926500, -86.867200,
     '2026-11-08 18:05:00', 'Cancelled'),
    (10, 10, 3, 'Seizure', 'High',
     'Patient experienced a witnessed seizure lasting approximately two minutes.',
     '278 Scenario Boulevard, Franklin, TN', 35.932000, -86.875600,
     '2026-11-09 11:58:00', 'Active'),
    (11, 11, 1, 'Cardiac Arrest', 'Critical',
     'Bystander CPR in progress when the emergency call was received.',
     '360 Simulation Street, Nashville, TN', 36.156400, -86.773100,
     '2026-11-09 12:03:00', 'Transporting'),
    (12, 12, 2, 'Workplace Injury', 'Moderate',
     'Patient reported an arm injury after lifting equipment.',
     '475 Test Data Drive, Murfreesboro, TN', 35.839500, -86.382400,
     '2026-11-09 12:12:00', 'Reported');

-- ============================================================================
-- 10. DISPATCH
-- ============================================================================
INSERT INTO dispatch (
    dispatch_id,
    incident_id,
    unit_id,
    dispatch_status,
    dispatch_time,
    arrival_scene_time,
    departure_scene_time,
    hospital_arrival_time,
    clear_time
)
VALUES
    (1, 1, 2, 'Completed', '2026-11-07 08:07:00',
     '2026-11-07 08:16:00', '2026-11-07 08:27:00',
     '2026-11-07 08:39:00', '2026-11-07 09:05:00'),
    (2, 2, 3, 'Completed', '2026-11-07 09:44:00',
     '2026-11-07 09:53:00', '2026-11-07 10:08:00',
     '2026-11-07 10:25:00', '2026-11-07 10:54:00'),
    (3, 2, 4, 'Completed', '2026-11-07 09:45:00',
     '2026-11-07 09:55:00', '2026-11-07 10:10:00',
     '2026-11-07 10:28:00', '2026-11-07 10:58:00'),
    (4, 3, 5, 'Completed', '2026-11-07 11:16:00',
     '2026-11-07 11:24:00', '2026-11-07 11:38:00',
     '2026-11-07 11:56:00', '2026-11-07 12:20:00'),
    (5, 4, 1, 'On Scene', '2026-11-09 12:02:00',
     '2026-11-09 12:12:00', NULL, NULL, NULL),
    (6, 5, 3, 'Transporting', '2026-11-09 11:52:00',
     '2026-11-09 12:01:00', '2026-11-09 12:13:00', NULL, NULL),
    (7, 6, 5, 'Completed', '2026-11-08 08:48:00',
     '2026-11-08 08:56:00', '2026-11-08 09:09:00',
     '2026-11-08 09:29:00', '2026-11-08 10:02:00'),
    (8, 7, 1, 'Completed', '2026-11-08 10:14:00',
     '2026-11-08 10:23:00', '2026-11-08 10:41:00',
     '2026-11-08 10:59:00', '2026-11-08 11:25:00'),
    (9, 8, 4, 'Completed', '2026-11-08 14:23:00',
     '2026-11-08 14:34:00', '2026-11-08 14:47:00',
     '2026-11-08 15:08:00', '2026-11-08 15:40:00'),
    (10, 9, 6, 'Cancelled', '2026-11-08 18:07:00',
     NULL, NULL, NULL, '2026-11-08 18:12:00'),
    (11, 10, 5, 'On Scene', '2026-11-09 12:00:00',
     '2026-11-09 12:09:00', NULL, NULL, NULL),
    (12, 11, 2, 'Transporting', '2026-11-09 12:04:00',
     '2026-11-09 12:10:00', '2026-11-09 12:16:00', NULL, NULL),
    (13, 11, 1, 'En Route', '2026-11-09 12:05:00',
     NULL, NULL, NULL, NULL),
    (14, 12, 4, 'Assigned', '2026-11-09 12:14:00',
     NULL, NULL, NULL, NULL);

-- ============================================================================
-- 11. PATIENT_ENCOUNTER
-- ============================================================================
INSERT INTO patient_encounter (
    encounter_id,
    patient_id,
    hospital_id,
    department_id,
    incident_id,
    attending_staff_id,
    arrival_time,
    triage_level,
    chief_complaint,
    encounter_status,
    discharge_time
)
VALUES
    (1, 1, 1, 1, 1, 1, '2026-11-07 08:40:00',
     '1 - Critical', 'Severe chest pressure and shortness of breath',
     'Discharged', '2026-11-07 14:30:00'),
    (2, 2, 2, 4, 2, 7, '2026-11-07 10:27:00',
     '2 - Emergent', 'Neck pain following a motor vehicle collision',
     'Admitted', NULL),
    (3, 3, 3, 7, 3, 13, '2026-11-07 11:58:00',
     '1 - Critical', 'Acute breathing difficulty',
     'Transferred', '2026-11-07 14:10:00'),
    (4, 6, 3, 9, 6, 17, '2026-11-08 09:31:00',
     '1 - Critical', 'Facial drooping and weakness',
     'Admitted', NULL),
    (5, 7, 1, 1, 7, 2, '2026-11-08 11:01:00',
     '3 - Urgent', 'Persistent lower abdominal pain',
     'Discharged', '2026-11-08 13:15:00'),
    (6, 8, 2, 5, 8, 9, '2026-11-08 15:10:00',
     '4 - Less Urgent', 'Fever and fatigue',
     'Discharged', '2026-11-08 17:00:00'),
    (7, 5, 2, 4, 5, 8, '2026-11-09 12:27:00',
     '2 - Emergent', 'Swelling and difficulty swallowing',
     'In Treatment', NULL),
    (8, 4, 1, 3, NULL, 5, '2026-11-06 09:00:00',
     '5 - Non-Urgent', 'Scheduled cardiology follow-up',
     'Discharged', '2026-11-06 10:20:00'),
    (9, 9, 2, 6, NULL, 11, '2026-11-06 13:30:00',
     '4 - Less Urgent', 'Knee pain after exercise',
     'Discharged', '2026-11-06 15:05:00'),
    (10, 13, 3, 9, NULL, 17, '2026-11-09 10:15:00',
     '3 - Urgent', 'Persistent migraine and light sensitivity',
     'In Treatment', NULL),
    (11, 14, 1, 2, NULL, 3, '2026-11-08 16:40:00',
     '2 - Emergent', 'Post-operative monitoring',
     'Admitted', NULL),
    (12, 16, 1, 3, NULL, 5, '2026-11-05 14:00:00',
     '4 - Less Urgent', 'Irregular heartbeat during routine activity',
     'Discharged', '2026-11-05 17:25:00');

COMMIT;

-- ============================================================================
-- Verification queries
-- These queries display the number of inserted records in each table.
-- ============================================================================
SELECT 'hospital' AS table_name, COUNT(*) AS row_count FROM hospital
UNION ALL
SELECT 'department', COUNT(*) FROM department
UNION ALL
SELECT 'staff', COUNT(*) FROM staff
UNION ALL
SELECT 'patient', COUNT(*) FROM patient
UNION ALL
SELECT 'ems_unit', COUNT(*) FROM ems_unit
UNION ALL
SELECT 'resource', COUNT(*) FROM resource
UNION ALL
SELECT 'hospital_resource', COUNT(*) FROM hospital_resource
UNION ALL
SELECT 'ems_location', COUNT(*) FROM ems_location
UNION ALL
SELECT 'emergency_incident', COUNT(*) FROM emergency_incident
UNION ALL
SELECT 'dispatch', COUNT(*) FROM dispatch
UNION ALL
SELECT 'patient_encounter', COUNT(*) FROM patient_encounter;

-- Optional sample outputs from the project views.
SELECT * FROM current_unit_status ORDER BY unit_id;

SELECT *
FROM active_incident_dispatch
ORDER BY priority_level, reported_at;

SELECT *
FROM available_hospital_resources
ORDER BY hospital_name, resource_name;


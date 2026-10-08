// Temporary fake data. Later, replace these with fetch() calls to FastAPI.
export const patients = [
  { id: 1, name: 'John Smith', age: 54, condition: 'Chest pain', status: 'In transit', medicalHistory: 'Hypertension; takes lisinopril.' },
  { id: 2, name: 'Sarah Johnson', age: 31, condition: 'Fracture, left arm', status: 'On scene', medicalHistory: 'No known allergies or chronic conditions.' },
  { id: 3, name: 'Michael Brown', age: 68, condition: 'Breathing difficulty', status: 'Admitted', medicalHistory: 'COPD; uses prescribed inhaler.' },
  { id: 4, name: 'Priya Patel', age: 42, condition: 'Allergic reaction', status: 'Awaiting dispatch', medicalHistory: 'Known severe peanut allergy.' },
  { id: 5, name: 'David Lee', age: 27, condition: 'Minor burns', status: 'Discharged', medicalHistory: 'No known allergies or chronic conditions.' },
]

export const emergencies = [
  { id: 1042, priority: 'High', address: '123 Main Street', vehicle: 'AMB-002', status: 'En route', patient: 'John Smith', patientId: 1, reported: '10:42', assignedParamedicBadge: 'EMS-401', assignmentMessage: 'Transport to Northside General.' },
  { id: 1043, priority: 'Medium', address: '88 Oak Avenue', vehicle: 'AMB-003', status: 'On scene', patient: 'Sarah Johnson', patientId: 2, reported: '10:51', assignedParamedicBadge: null, assignmentMessage: '' },
  { id: 1044, priority: 'High', address: '410 River Road', vehicle: null, status: 'Awaiting dispatch', patient: 'Priya Patel', patientId: 4, reported: '10:58', assignedParamedicBadge: null, assignmentMessage: '' },
]

export const vehicles = [
  { id: 'AMB-001', status: 'Available', location: 'Murfreesboro', crew: 2 },
  { id: 'AMB-002', status: 'En route', location: 'Nashville', crew: 2, badge: 'EMS-401', area: 'Central Tennessee', notes: 'Lead paramedic demo unit.' },
  { id: 'AMB-003', status: 'On scene', location: 'Smyrna', crew: 3 },
  { id: 'AMB-004', status: 'Available', location: 'Franklin', crew: 2 },
  { id: 'AMB-005', status: 'Out of service', location: 'Depot', crew: 0 },
]

export const hospitals = [
  { id: 1, name: 'Northside General', city: 'Nashville', beds: 14, erWait: '25 min', area: 'Central Tennessee' },
  { id: 2, name: 'Riverbend Medical Center', city: 'Murfreesboro', beds: 9, erWait: '40 min', area: 'Central Tennessee' },
  { id: 3, name: "St. Anne's Regional", city: 'Franklin', beds: 18, erWait: '15 min', area: 'Central Tennessee' },
]

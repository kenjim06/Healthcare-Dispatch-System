// Temporary fake data. Later, replace these with fetch() calls to FastAPI.
export const patients = [
  { id: 1, name: 'John Smith', age: 54, condition: 'Chest pain', status: 'In transit' },
  { id: 2, name: 'Sarah Johnson', age: 31, condition: 'Fracture, left arm', status: 'On scene' },
  { id: 3, name: 'Michael Brown', age: 68, condition: 'Breathing difficulty', status: 'Admitted' },
  { id: 4, name: 'Priya Patel', age: 42, condition: 'Allergic reaction', status: 'Awaiting dispatch' },
  { id: 5, name: 'David Lee', age: 27, condition: 'Minor burns', status: 'Discharged' },
]

export const emergencies = [
  { id: 1042, priority: 'High', address: '123 Main Street', vehicle: 'AMB-002', status: 'En route', patient: 'John Smith', reported: '10:42' },
  { id: 1043, priority: 'Medium', address: '88 Oak Avenue', vehicle: 'AMB-003', status: 'On scene', patient: 'Sarah Johnson', reported: '10:51' },
  { id: 1044, priority: 'High', address: '410 River Road', vehicle: null, status: 'Awaiting dispatch', patient: 'Priya Patel', reported: '10:58' },
]

export const vehicles = [
  { id: 'AMB-001', status: 'Available', location: 'Murfreesboro', crew: 2 },
  { id: 'AMB-002', status: 'En route', location: 'Nashville', crew: 2 },
  { id: 'AMB-003', status: 'On scene', location: 'Smyrna', crew: 3 },
  { id: 'AMB-004', status: 'Available', location: 'Franklin', crew: 2 },
  { id: 'AMB-005', status: 'Out of service', location: 'Depot', crew: 0 },
]

export const hospitals = [
  { id: 1, name: 'Northside General', city: 'Nashville', beds: 14, erWait: '25 min' },
  { id: 2, name: 'Riverbend Medical Center', city: 'Murfreesboro', beds: 9, erWait: '40 min' },
  { id: 3, name: "St. Anne's Regional", city: 'Franklin', beds: 18, erWait: '15 min' },
]

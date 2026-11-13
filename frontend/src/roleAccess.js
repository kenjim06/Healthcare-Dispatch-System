export const ROLE_ACCESS = {
  Dispatcher: {
    routes: ['/', '/emergencies', '/vehicles', '/hospitals'],
    canManageEmergencies: true,
    canDeleteEmergencies: true,
    canManageVehicles: true,
    canAssignParamedics: true,
  },
  'Lead Paramedic': {
    routes: ['/', '/emergencies', '/vehicles', '/hospitals'],
    canEditPatients: true,
    canCreateEmergencies: true,
    canEditAssignedEmergencies: true,
    canAssignOwnVehicle: true,
  },
  'Hospital Admin': {
    routes: ['/', '/emergencies', '/vehicles', '/hospitals'],
    canViewAllRecords: true,
  },
}

export function accessForRole(role) {
  return ROLE_ACCESS[role] ?? { routes: ['/'] }
}

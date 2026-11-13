const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

function storedToken() {
  try {
    return localStorage.getItem('ems_token') || sessionStorage.getItem('ems_token')
  } catch {
    return null
  }
}

async function request(path, options = {}) {
  const token = storedToken()
  const response = await fetch(`${API_BASE_URL}/api${path}`, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    if (response.status === 401 && path !== '/auth/login' && path !== '/auth/me') {
      window.dispatchEvent(new Event('ems:unauthorized'))
    }
    let detail = `Request failed (${response.status})`
    try {
      const body = await response.json()
      detail = Array.isArray(body.detail)
        ? body.detail.map((item) => item.msg ?? JSON.stringify(item)).join('; ')
        : body.detail ?? detail
    } catch {
      // Keep the HTTP status message when the server does not return JSON.
    }
    throw new Error(detail)
  }

  return response.status === 204 ? null : response.json()
}

function jsonBody(value) {
  return JSON.stringify(value)
}

export const api = {
  login: (credentials) => request('/auth/login', {
    method: 'POST',
    body: jsonBody(credentials),
  }),
  getCurrentUser: (token) => request('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  }),
  getHealth: () => request('/health'),
  getPatients: () => request('/patients'),
  createPatient: (values) => request('/patients', {
    method: 'POST',
    body: jsonBody(values),
  }),
  updatePatient: (id, updates) => request(`/patients/${id}`, {
    method: 'PUT',
    body: jsonBody(updates),
  }),
  getEmergencies: () => request('/emergencies'),
  getEmergencyHistory: () => request('/emergencies?include_closed=true'),
  createEmergency: (values) => request('/emergencies', {
    method: 'POST',
    body: jsonBody(values),
  }),
  updateEmergency: (id, updates) => request(`/emergencies/${id}`, {
    method: 'PUT',
    body: jsonBody(updates),
  }),
  deleteEmergency: (id) => request(`/emergencies/${id}`, { method: 'DELETE' }),
  getVehicles: () => request('/vehicles'),
  getParamedics: () => request('/paramedics'),
  updateVehicle: (id, updates) => request(`/vehicles/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: jsonBody(updates),
  }),
  getHospitals: () => request('/hospitals'),
}

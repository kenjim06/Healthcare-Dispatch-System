import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import { useAuth } from './AuthContext'

const OperationsContext = createContext(null)

export function OperationsProvider({ children }) {
  const { user } = useAuth()
  const [patients, setPatients] = useState([])
  const [emergencies, setEmergencies] = useState([])
  const [archivedEmergencies, setArchivedEmergencies] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [paramedics, setParamedics] = useState([])
  const [hospitals, setHospitals] = useState([])
  const [loadedUserId, setLoadedUserId] = useState(null)
  const [error, setError] = useState('')
  const hasCurrentUserData = Boolean(user) && loadedUserId === user.id
  const isLoading = Boolean(user) && !hasCurrentUserData

  const refreshData = useCallback(async () => {
    if (!user) return
    const records = [
      api.getPatients(),
      api.getEmergencies(),
      api.getEmergencyHistory(),
      api.getVehicles(),
      api.getHospitals(),
    ]
    if (user.role === 'Dispatcher') records.push(api.getParamedics())
    const [patientRecords, emergencyRecords, historyRecords, vehicleRecords, hospitalRecords, paramedicAccounts = []] = await Promise.all(records)
    setPatients(patientRecords)
    setEmergencies(emergencyRecords)
    setArchivedEmergencies(historyRecords.filter((emergency) => emergency.status === 'Completed'))
    setVehicles(vehicleRecords)
    setParamedics(paramedicAccounts)
    setHospitals(hospitalRecords)
    setLoadedUserId(user.id)
    setError('')
  }, [user])

  useEffect(() => {
    if (!user) return undefined

    let isCurrent = true
    Promise.resolve().then(refreshData).catch((loadError) => {
      if (!isCurrent) return
      setError(`Unable to load operations data: ${loadError.message}`)
    })

    return () => {
      isCurrent = false
    }
  }, [refreshData, user])

  const refreshAfterDispatchWrite = useCallback(async () => {
    try {
      await refreshData()
    } catch (refreshError) {
      setError(
        `Dispatch changes were saved, but the latest operations data could not be loaded: ${refreshError.message}`,
      )
    }
  }, [refreshData])

  const retryDataLoad = useCallback(async () => {
    try {
      await refreshData()
      return true
    } catch (loadError) {
      setError(`Unable to load operations data: ${loadError.message}`)
      return false
    }
  }, [refreshData])

  async function perform(action) {
    setError('')
    try {
      return { ok: true, value: await action() }
    } catch (operationError) {
      setError(operationError instanceof Error ? operationError.message : String(operationError))
      return { ok: false, value: null }
    }
  }

  const value = useMemo(() => ({
    patients: hasCurrentUserData ? patients : [],
    emergencies: hasCurrentUserData ? emergencies : [],
    archivedEmergencies: hasCurrentUserData ? archivedEmergencies : [],
    vehicles: hasCurrentUserData ? vehicles : [],
    paramedics: hasCurrentUserData && user?.role === 'Dispatcher' ? paramedics : [],
    hospitals: hasCurrentUserData ? hospitals : [],
    isLoading,
    error,
    refreshData,
    retryDataLoad,
    clearError: () => setError(''),
    async updatePatient(id, updates) {
      const result = await perform(() => api.updatePatient(id, updates))
      if (!result.ok) return false
      setPatients((current) => current.map((patient) => (
        patient.id === id ? result.value : patient
      )))
      return true
    },
    async createEmergency(values) {
      const result = await perform(() => api.createEmergency(values))
      if (!result.ok) return null
      setEmergencies((current) => [...current, result.value])
      await refreshAfterDispatchWrite()
      return result.value
    },
    async updateEmergency(id, updates) {
      const result = await perform(() => api.updateEmergency(id, updates))
      if (!result.ok) return false
      setEmergencies((current) => result.value.status === 'Completed'
        ? current.filter((emergency) => emergency.id !== id)
        : current.map((emergency) => (
          emergency.id === id ? result.value : emergency
        )))
      if (result.value.status === 'Completed') {
        setArchivedEmergencies((current) => [
          ...current.filter((emergency) => emergency.id !== id),
          result.value,
        ])
      }
      await refreshAfterDispatchWrite()
      return true
    },
    async deleteEmergency(id) {
      const result = await perform(() => api.deleteEmergency(id))
      if (!result.ok) return false
      setEmergencies((current) => current.filter((emergency) => emergency.id !== id))
      await refreshAfterDispatchWrite()
      return true
    },
    async updateVehicle(id, updates) {
      const result = await perform(() => api.updateVehicle(id, updates))
      if (!result.ok) return false
      setVehicles((current) => current.map((vehicle) => (
        vehicle.id === id ? result.value : vehicle
      )))
      return true
    },
  }), [archivedEmergencies, emergencies, error, hasCurrentUserData, hospitals, isLoading, paramedics, patients, refreshAfterDispatchWrite, refreshData, retryDataLoad, user, vehicles])

  return <OperationsContext.Provider value={value}>{children}</OperationsContext.Provider>
}

export function useOperations() {
  const context = useContext(OperationsContext)
  if (!context) throw new Error('useOperations must be used within an OperationsProvider')
  return context
}

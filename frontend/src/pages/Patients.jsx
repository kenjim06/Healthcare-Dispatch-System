import { useState } from 'react'
import { SelectableList } from '../components/LocationWorkspace'
import { useAuth } from '../context/AuthContext'
import { useOperations } from '../context/OperationsContext'
import { accessForRole } from '../roleAccess'

function PatientEditor({ patient, onSave }) {
  const [form, setForm] = useState(patient)
  const [saved, setSaved] = useState(false)

  const update = (event) => {
    setSaved(false)
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    const savedSuccessfully = await onSave({
      name: form.name.trim(),
      age: Number(form.age),
      condition: form.condition.trim(),
      status: form.status,
      allergies: form.allergies.trim(),
      medicalHistory: form.medicalHistory.trim(),
    })
    if (savedSuccessfully) setSaved(true)
  }

  return (
    <form className="detail-form" onSubmit={submit}>
      <label>Name<input className="form-control" name="name" value={form.name} onChange={update} required /></label>
      <label>Age<input className="form-control" name="age" type="number" min="0" max="130" value={form.age} onChange={update} required /></label>
      <label>Condition<input className="form-control" name="condition" value={form.condition} onChange={update} required /></label>
      <label>Status
        <select className="form-control" name="status" value={form.status} onChange={update}>
          {['Awaiting dispatch', 'On scene', 'In transit', 'Admitted', 'Discharged'].map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </label>
      <label>Allergies<input className="form-control" name="allergies" value={form.allergies} onChange={update} /></label>
      <label>Medical history<textarea className="form-control" name="medicalHistory" value={form.medicalHistory} onChange={update} rows="3" /></label>
      <button className="btn-primary" type="submit">Save patient information</button>
      {saved && <span className="save-confirmation" role="status">Patient information saved to MySQL.</span>}
    </form>
  )
}

export default function Patients() {
  const { user } = useAuth()
  const { patients, updatePatient } = useOperations()
  const access = accessForRole(user?.role)
  const [selectedId, setSelectedId] = useState(patients[0]?.id ?? null)
  const selectedPatient = patients.find((patient) => patient.id === selectedId) ?? patients[0]
  const isDispatcher = user?.role === 'Dispatcher'
  const isHospitalAdmin = user?.role === 'Hospital Admin'

  return (
    <>
      <h1>Patients</h1>
      <p className="lead">
        {isDispatcher
          ? 'Dispatch view: patient names and current conditions only.'
          : isHospitalAdmin
            ? 'Read-only patient records, including medical history and allergies.'
            : 'Select a patient to review or update field-care information.'}
      </p>
      <div className="records-layout">
        <SelectableList
          items={patients.map((patient) => ({
            id: patient.id,
            name: patient.name,
            subtitle: isDispatcher ? patient.condition : `${patient.condition} · ${patient.status}`,
          }))}
          selectedId={selectedId ?? selectedPatient?.id ?? null}
          onSelect={setSelectedId}
          getTitle={(item) => item.name}
          getSubtitle={(item) => item.subtitle}
        />
        <section className="panel record-detail" aria-live="polite">
          {!selectedPatient && <p>No patient selected.</p>}
          {selectedPatient && (
            <>
              <h2>{selectedPatient.name}</h2>
              <p className="detail-line"><strong>Condition</strong><span>{selectedPatient.condition}</span></p>
              {!isDispatcher && (
                <>
                  <p className="detail-line"><strong>Age</strong><span>{selectedPatient.age}</span></p>
                  <p className="detail-line"><strong>Status</strong><span>{selectedPatient.status}</span></p>
                  <p className="detail-line"><strong>Allergies</strong><span>{selectedPatient.allergies || 'None recorded'}</span></p>
                  <p className="detail-line"><strong>Medical history</strong><span>{selectedPatient.medicalHistory || 'None recorded'}</span></p>
                </>
              )}
              {access.canEditPatients && (
                <PatientEditor
                  key={selectedPatient.id}
                  patient={selectedPatient}
                  onSave={(updates) => updatePatient(selectedPatient.id, updates)}
                />
              )}
            </>
          )}
        </section>
      </div>
    </>
  )
}

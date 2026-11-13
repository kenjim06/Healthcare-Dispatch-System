import { useEffect, useRef } from 'react'

function ProfilePlaceholder() {
  return (
    <svg className="patient-profile-avatar" viewBox="0 0 96 96" role="img" aria-label="Profile photo unavailable">
      <circle cx="48" cy="48" r="48" fill="#252d38" />
      <circle cx="48" cy="35" r="17" fill="#778392" />
      <path d="M17 84c3-17 15-27 31-27s28 10 31 27" fill="#778392" />
    </svg>
  )
}

function MedicalField({ label, value }) {
  return (
    <div className="patient-profile-field">
      <strong>{label}</strong>
      <span>{value || 'None recorded'}</span>
    </div>
  )
}

export default function PatientProfileDialog({ patient, history, onClose }) {
  const closeButtonRef = useRef(null)

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', closeOnEscape)
    closeButtonRef.current?.focus()
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return (
    <div
      className="patient-profile-overlay"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className="patient-profile-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="patient-profile-title"
      >
        <div className="patient-profile-header">
          <div className="patient-profile-identity">
            <ProfilePlaceholder />
            <div>
              <p className="patient-profile-eyebrow">
                {patient.id == null ? 'Emergency patient · No linked record' : `Patient record · #${patient.id}`}
              </p>
              <h2 id="patient-profile-title">{patient.name || 'Patient name unavailable'}</h2>
              <span>{patient.condition || 'Condition not recorded'}</span>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            className="patient-profile-close"
            type="button"
            onClick={onClose}
            aria-label="Close patient profile"
          >
            ×
          </button>
        </div>
        <div className="patient-profile-body">
          <section className="patient-profile-section" aria-labelledby="patient-medical-heading">
            <h3 id="patient-medical-heading">Medical information</h3>
            <div className="patient-profile-fields">
              <MedicalField label="Age" value={patient.age == null ? '' : `${patient.age}`} />
              <MedicalField label="Current status" value={patient.status} />
              <MedicalField label="Allergies" value={patient.allergies} />
              <MedicalField label="Medical history" value={patient.medicalHistory} />
            </div>
          </section>
          <section className="patient-profile-section" aria-labelledby="patient-history-heading">
            <h3 id="patient-history-heading">Emergency history</h3>
            {history.length ? (
              <ul className="patient-history-list">
                {history.map((emergency) => (
                  <li key={emergency.id}>
                    <div className="patient-history-topline">
                      <strong>Emergency #{emergency.id}</strong>
                      <span>{emergency.status}</span>
                    </div>
                    <p>{emergency.address || 'Address not recorded'}</p>
                    <small>{emergency.priority} priority{emergency.reported ? ` · Reported ${emergency.reported}` : ''}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="patient-profile-empty">No linked emergency history is available.</p>
            )}
          </section>
          <p className="patient-profile-note">
            {patient.id == null
              ? 'This emergency is not linked to a patient record, so saved medical data and prior patient history are unavailable.'
              : 'Profile access is limited to Hospital Admin accounts and linked patient records. This prototype does not yet track hospital-to-patient affiliation.'}
          </p>
        </div>
      </section>
    </div>
  )
}

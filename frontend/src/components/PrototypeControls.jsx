export function PrototypeNotice() {
  return (
    <p className="prototype-notice">
      Prototype controls only — changes are not saved or applied yet.
    </p>
  )
}

export function ActionPlaceholder({ children }) {
  return (
    <button
      type="button"
      className="btn-secondary"
      disabled
      title="This action will be connected in a later implementation."
    >
      {children}
    </button>
  )
}

export function FieldPlaceholder({ label, value = '', multiline = false }) {
  const Input = multiline ? 'textarea' : 'input'
  return (
    <label className="form-group">
      <span>{label}</span>
      <Input className="form-control" value={value} disabled readOnly />
    </label>
  )
}

export function SelectPlaceholder({ label, value, options }) {
  return (
    <label className="form-group">
      <span>{label}</span>
      <select className="form-control" value={value} disabled>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  )
}

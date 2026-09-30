const tone = {
  High: 'red', Medium: 'amber', Low: 'blue',
  Available: 'green', 'En route': 'blue', 'On scene': 'amber', 'Out of service': 'grey',
  'In transit': 'blue', Admitted: 'green', Discharged: 'grey', 'Awaiting dispatch': 'red',
}

export default function Badge({ label }) {
  return <span className={`badge ${tone[label] || 'grey'}`}>{label}</span>
}

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Patients from './pages/Patients'
import Emergencies from './pages/Emergencies'
import Vehicles from './pages/Vehicles'
import Hospitals from './pages/Hospitals'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Sidebar />
        <main className="main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/emergencies" element={<Emergencies />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/hospitals" element={<Hospitals />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

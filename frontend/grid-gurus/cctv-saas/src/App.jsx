import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Tripwires from './pages/Tripwires'

export default function App() {
  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="flex gap-4 p-4 border-b border-white/10">
        <Link to="/">Home</Link>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/profile">Profile</Link>
        <Link to="/tripwires">Tripwires</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/tripwires" element={<Tripwires />} />
      </Routes>
    </div>
  )
}

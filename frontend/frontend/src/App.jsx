import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Tripwires from "./pages/TripWires";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

export default function App() {
  return (
    <div className="min-h-screen bg-black text-white">

      {/* (Optional: you can remove this nav later since you already have Navbar component) */}
      {/* <nav className="flex gap-4 p-4 border-b border-white/10">
        <Link to="/">Home</Link>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/profile">Profile</Link>
        <Link to="/tripwires">Tripwires</Link>
        <Link to="/login">Login</Link>
        <Link to="/signup">Signup</Link>
      </nav> */}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tripwires" element={<Tripwires />} />

        {/* 🔥 ADD THESE */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/me" element={<Profile />} />

      </Routes>
    </div>
  );
}

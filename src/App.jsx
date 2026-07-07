import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import RegisterHospital from './pages/RegisterHospital';
import StaffRegistration from './pages/StaffRegistration';
import VendorLandingPage from './pages/VendorLandingPage';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import GlobalPopup from './components/GlobalPopup';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-surface">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register-hospital" element={<RegisterHospital />} />
          <Route path="/register/employee/:hospitalId" element={<StaffRegistration />} />
          <Route path="/clinic/:hospitalId" element={<VendorLandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
        <GlobalPopup />
      </div>
    </Router>
  );
}

export default App;

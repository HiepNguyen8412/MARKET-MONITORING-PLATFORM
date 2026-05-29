import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import Portfolio from './pages/Portfolio';
import Alerts from './pages/Alerts';
import AssetDetail from './pages/AssetDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="assets" element={<Assets />} />
          <Route path="asset/:id" element={<AssetDetail />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="portfolio" element={<Portfolio />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>
        {/* Fallback for any other route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

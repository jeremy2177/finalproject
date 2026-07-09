import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider, ProtectedRoute } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Positions from './pages/Positions';
import PositionDetail from './pages/PositionDetail';
import AddPosition from './pages/AddPosition';
import EditPosition from './pages/EditPosition';
import AddTrade from './pages/AddTrade';
import Statistics from './pages/Statistics';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="positions" element={<Positions />} />
          <Route path="positions/add" element={<AddPosition />} />
          <Route path="positions/:id" element={<PositionDetail />} />
          <Route path="positions/:id/edit" element={<EditPosition />} />
          <Route path="positions/:id/trades/add" element={<AddTrade />} />
          <Route path="statistics" element={<Statistics />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;

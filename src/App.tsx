import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import AuthGuard from './components/AuthGuard';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Stock from './pages/Stock';
import POS from './pages/POS';
import History from './pages/History';
import Agents from './pages/Agents';
import PurchasePrices from './pages/PurchasePrices';
import Pharmacy from './pages/Pharmacy';
import InventoryHistory from './pages/InventoryHistory';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <AuthGuard>
                <Layout>
                  <Dashboard />
                </Layout>
              </AuthGuard>
            }
          />
          <Route
            path="/stock"
            element={
              <AuthGuard requireAgent requireCashier>
                <Layout>
                  <Stock />
                </Layout>
              </AuthGuard>
            }
          />
          <Route
            path="/pharmacie"
            element={
              <AuthGuard requireAgent requireCashier>
                <Layout>
                  <Pharmacy />
                </Layout>
              </AuthGuard>
            }
          />
          <Route
            path="/inventory-history"
            element={
              <AuthGuard requireAgent requireCashier>
                <Layout>
                  <InventoryHistory />
                </Layout>
              </AuthGuard>
            }
          />
          <Route
            path="/pos"
            element={
              <AuthGuard requireAgent requireCashier>
                <Layout>
                  <POS />
                </Layout>
              </AuthGuard>
            }
          />
          <Route
            path="/history"
            element={
              <AuthGuard requireAgent requireCashier>
                <Layout>
                  <History />
                </Layout>
              </AuthGuard>
            }
          />
          <Route
            path="/purchase-prices"
            element={
              <AuthGuard requireAdmin>
                <Layout>
                  <PurchasePrices />
                </Layout>
              </AuthGuard>
            }
          />
          <Route
            path="/agents"
            element={
              <AuthGuard requireAdmin>
                <Layout>
                  <Agents />
                </Layout>
              </AuthGuard>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

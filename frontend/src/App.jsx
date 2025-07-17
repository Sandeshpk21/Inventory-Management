import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './services/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import PurchaseOrders from './pages/PurchaseOrders';
import Requirements from './pages/Requirements';
import Stock from './pages/Stock';
import ToBeOrdered from './pages/ToBeOrdered';
import Transactions from './pages/Transactions';
import Login from './pages/Login';

const PrivateRoute = ({ children, roles }) => {
  const { user } = React.useContext(AuthContext);
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route
            path="purchase-orders"
            element={
              <PrivateRoute roles={["admin"]}>
                <PurchaseOrders />
              </PrivateRoute>
            }
          />
          <Route
            path="requirements"
            element={
              <PrivateRoute roles={["admin", "employee"]}>
                <Requirements />
              </PrivateRoute>
            }
          />
          <Route
            path="stock"
            element={
              <PrivateRoute roles={["admin", "employee"]}>
                <Stock />
              </PrivateRoute>
            }
          />
          <Route
            path="to-be-ordered"
            element={
              <PrivateRoute roles={["admin"]}>
                <ToBeOrdered />
              </PrivateRoute>
            }
          />
          <Route
            path="transactions"
            element={
              <PrivateRoute roles={["admin"]}>
                <Transactions />
              </PrivateRoute>
            }
          />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App; 
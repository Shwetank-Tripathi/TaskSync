import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Dashboard from "../pages/Dashboard";
import ProtectedRoute from "../components/ProtectedRoute";
import PublicRoute from "../components/PublicRoute";

const AppRoutes = () => {
  return (
    <Routes>
        <Route 
            path="/" 
            element={
                <Navigate to="/rooms" replace />
            } 
        />
        <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
        />
        <Route
            path="/signup"
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            }
        />
        <Route
            path="/rooms"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
        />
        <Route
            path="/rooms/:roomId"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
        />
    </Routes>
  )
}

export default AppRoutes
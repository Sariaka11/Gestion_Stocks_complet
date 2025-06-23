"use client"

import { Routes, Route, Navigate } from "react-router-dom"
import AdminLayout from "./layouts/AdminLayout"
import UserLayout from "./layouts/UserLayout"
import Login from "./pages/auth/Login"
import Register from "./pages/admin/Register/Register"
import AdminSidebar from "./components/admin/Sidebar"
import Stock from "./pages/admin/consommables/Stock"
import Inventaire from "./pages/admin/consommables/Inventaire"
import Dispatche from "./pages/admin/consommables/Dispatche"
import GestionUtilisateurs from "./pages/admin/GestionUtilisateurs/GestionUtilisateurs"
import ImStock from "./pages/admin/immobiliers/ImStock"
import Amortissements from "./pages/admin/immobiliers/Amortissements"
import ImInventaire from "./pages/admin/immobiliers/ImInventaire"
import ImDispatche from "./pages/admin/immobiliers/ImDispatche"
import SuiviStock from "./pages/admin/SuiviStock/SuiviStock"
import UserSidebar from "./components/user/Sidebar"
import UserStock from "./pages/user/consommables/UserStock"
import UserConsommation from "./pages/user/consommables/UserConsommation"
import UserImStock from "./pages/user/Immobiliers/UserImStock"
import UserImConsommation from "./pages/user/Immobiliers/UserImConsommation"
import Profile from "./pages/user/Profil/Profile"
import { RefreshProvider } from "./pages/admin/context/RefreshContext"
import { AuthProvider } from "./Context/AuthContext";
import "./App.css"

function App() {
  // Composant de protection des routes
  // Vérifier si l'utilisateur est connecté
  const isAuthenticated = () => {
    return localStorage.getItem("user") !== null
  }

  // Composant de protection des routes
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated()) {
      return <Navigate to="/auth/login" replace />
    }
    return children
  }

  // Composant Admin Dashboard
  function AdminDashboard() {
    return (
      <RefreshProvider>
        <div className="dashboard-container">
          <AdminSidebar />
          <div className="dashboard-content">
            <Routes>
              <Route path="consommables/stock" element={<Stock />} />
              <Route path="consommables/inventaire" element={<Inventaire />} />
              <Route path="consommables/dispatche" element={<Dispatche />} />
              <Route path="immobiliers/stock" element={<ImStock />} />
              <Route path="immobiliers/inventaire" element={<ImInventaire />} />
              <Route path="immobiliers/dispatche" element={<ImDispatche />} />
              <Route path="immobiliers/Amortissements" element={<Amortissements />} />
              <Route path="GestionUtilisateurs" element={<GestionUtilisateurs />} />
              <Route path="suivi-stock" element={<SuiviStock />} />
              <Route path="register" element={<Register />} />
            </Routes>
          </div>
        </div>
      </RefreshProvider>
    );
  }

  // Composant User Dashboard
  function UserDashboard() {
    return (
      <div className="dashboard-container">
        <UserSidebar />
        <div className="dashboard-content">
          <Routes>
            <Route
              index
              element={<div className="dashboard-welcome">Bienvenue dans le tableau de bord utilisateur</div>}
            />
            <Route path="consommables/stock" element={<UserStock />} />
            <Route path="consommables/consommation" element={<UserConsommation />} />
            <Route path="immobiliers/stock" element={<UserImStock />} />
            <Route path="immobiliers/consommation" element={<UserImConsommation />} />
            <Route path="profil" element={<Profile />} />
          </Routes>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <div className="app">
        <Routes>
          {/* Route par défaut - redirection vers login */}
          <Route path="/" element={<Navigate to="/auth/login" replace />} />

          {/* Route d'authentification - publique */}
          <Route path="/auth/login" element={<Login />} />

          {/* Routes admin - protégées */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Routes utilisateur - protégées */}
          <Route
            path="/user/*"
            element={
              <ProtectedRoute>
                <UserLayout>
                  <UserDashboard />
                </UserLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
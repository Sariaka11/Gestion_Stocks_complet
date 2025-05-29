"use client"

import { Routes, Route, Navigate } from "react-router-dom"
import AdminLayout from "./layouts/AdminLayout"
import UserLayout from "./layouts/UserLayout"
import LoginUser from "./pages/auth/LoginUser"
import LoginAdmin from "./pages/auth/LoginAdmin"

// Import des composants Admin
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
import Register from "./pages/admin/Register/Register"

// Import des composants User
import UserSidebar from "./components/user/Sidebar"
import UserStock from "./pages/user/consommables/UserStock"
import UserConsommation from "./pages/user/consommables/UserConsommation"
import UserDemande from "./pages/user/consommables/UserDemande"
import UserImStock from "./pages/user/Immobiliers/UserImStock"
import UserImConsommation from "./pages/user/Immobiliers/UserImConsommation"
import UserImDemande from "./pages/user/Immobiliers/UserImDemande"
import Profile from "./pages/user/Profil/Profile"
import { MockDataProvider } from "../app/MockDataProvider"
import { RefreshProvider } from './pages/admin/context/RefreshContext'
import "./App.css"

function App() {
  // Fonction pour vérifier si l'utilisateur est connecté
  const isAuthenticated = () => {
    return localStorage.getItem('user') !== null;
  };

  // Fonction de déconnexion
  const handleLogout = () => {
    localStorage.removeItem('user');
    console.log("Déconnexion effectuée");
    // Forcer un rechargement pour rediriger vers login
    window.location.href = '/auth/login-admin';
  }

  // Composant de protection des routes
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated()) {
      return <Navigate to="/auth/login-admin" replace />;
    }
    return children;
  };

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
    )
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
            <Route path="consommables/demande" element={<UserDemande />} />
            <Route path="immobiliers/stock" element={<UserImStock />} />
            <Route path="immobiliers/consommation" element={<UserImConsommation />} />
            <Route path="immobiliers/demande" element={<UserImDemande />} />
            <Route path="profil" element={<Profile />} />
          </Routes>
        </div>
      </div>
    )
  }

  return (
    <MockDataProvider>
      <div className="app">
        <Routes>
          {/* Route par défaut - redirection vers login admin */}
          <Route path="/" element={<LoginAdmin />} />

          {/* Routes d'authentification - publiques */}
          <Route path="/auth/login-user" element={<LoginUser />} />
          <Route path="/auth/login-admin" element={<LoginAdmin />} />

          {/* Routes admin - protégées */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <AdminLayout onLogout={handleLogout}>
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
                <UserLayout onLogout={handleLogout}>
                  <UserDashboard />
                </UserLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </MockDataProvider>
  )
}

export default App
"use client"

import { Routes, Route, Navigate } from "react-router-dom"
import { useState, useEffect } from "react"
import ModernSidebar from "./components/ModernSidebar"
import DashboardHeader from "./components/DashboardHeader"
import Login from "./pages/auth/Login"
import Register from "./pages/admin/Register/Register"
import Stock from "./pages/admin/consommables/Stock"
import Inventaire from "./pages/admin/consommables/Inventaire"
import Dispatche from "./pages/admin/consommables/Dispatche"
import GestionUtilisateurs from "./pages/admin/GestionUtilisateurs/GestionUtilisateurs"
import ImStock from "./pages/admin/immobiliers/ImStock"
import Amortissements from "./pages/admin/immobiliers/Amortissements"
import ImInventaire from "./pages/admin/immobiliers/ImInventaire"
import ImDispatche from "./pages/admin/immobiliers/ImDispatche"
import SuiviStock from "./pages/admin/SuiviStock/SuiviStock"
import UserStock from "./pages/user/consommables/UserStock"
import UserConsommation from "./pages/user/consommables/UserConsommation"
import UserImStock from "./pages/user/Immobiliers/UserImStock"
import UserImConsommation from "./pages/user/Immobiliers/UserImConsommation"
import Profile from "./pages/user/Profil/Profile"
import { RefreshProvider } from "./pages/admin/context/RefreshContext"
import { AuthProvider } from "./Context/AuthContext"
import "./App.css"

function App() {
  // Composant de protection des routes (inchangé)
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

  // Hook pour détecter la taille d'écran
  const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

    useEffect(() => {
      const handleResize = () => {
        setIsMobile(window.innerWidth <= 768)
      }

      window.addEventListener("resize", handleResize)
      return () => window.removeEventListener("resize", handleResize)
    }, [])

    return isMobile
  }

  // Nouveau composant Layout moderne pour Admin
  function ModernAdminLayout({ children, title }) {
    const isMobile = useIsMobile()
    const [sidebarOpen, setSidebarOpen] = useState(!isMobile) // Ouvert par défaut sur desktop

    // Ajuster l'état de la sidebar selon la taille d'écran
    useEffect(() => {
      setSidebarOpen(!isMobile)
    }, [isMobile])

    const toggleSidebar = () => {
      setSidebarOpen(!sidebarOpen)
    }

    return (
      <div className="modern-layout">
        {/* Sidebar moderne */}
        <ModernSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} userType="admin" />

        {/* Contenu principal */}
        <div className="modern-main-content">
          {/* Header moderne */}
          <DashboardHeader onToggleSidebar={toggleSidebar} title={title} sidebarOpen={sidebarOpen} />

          {/* Contenu de la page */}
          <div className="modern-page-content">{children}</div>
        </div>
      </div>
    )
  }

  // Nouveau composant Layout moderne pour User
  function ModernUserLayout({ children, title }) {
    const isMobile = useIsMobile()
    const [sidebarOpen, setSidebarOpen] = useState(!isMobile) // Ouvert par défaut sur desktop

    // Ajuster l'état de la sidebar selon la taille d'écran
    useEffect(() => {
      setSidebarOpen(!isMobile)
    }, [isMobile])

    const toggleSidebar = () => {
      setSidebarOpen(!sidebarOpen)
    }

    return (
      <div className="modern-layout">
        {/* Sidebar moderne */}
        <ModernSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} userType="user" />

        {/* Contenu principal */}
        <div className="modern-main-content">
          {/* Header moderne */}
          <DashboardHeader onToggleSidebar={toggleSidebar} title={title} sidebarOpen={sidebarOpen} userType="user" />

          {/* Contenu de la page */}
          <div className="modern-page-content">{children}</div>
        </div>
      </div>
    )
  }

  // Composant Admin Dashboard (adapté avec les nouveaux layouts)
  function AdminDashboard() {
    return (
      <RefreshProvider>
        <Routes>
          <Route
            path="consommables/stock"
            element={
              <ModernAdminLayout title="Stock Consommables">
                <Stock />
              </ModernAdminLayout>
            }
          />
          <Route
            path="consommables/inventaire"
            element={
              <ModernAdminLayout title="Inventaire Consommables">
                <Inventaire />
              </ModernAdminLayout>
            }
          />
          <Route
            path="consommables/dispatche"
            element={
              <ModernAdminLayout title="Dispatche Consommables">
                <Dispatche />
              </ModernAdminLayout>
            }
          />
          <Route
            path="immobiliers/stock"
            element={
              <ModernAdminLayout title="Stock Immobiliers">
                <ImStock />
              </ModernAdminLayout>
            }
          />
          <Route
            path="immobiliers/inventaire"
            element={
              <ModernAdminLayout title="Inventaire Immobiliers">
                <ImInventaire />
              </ModernAdminLayout>
            }
          />
          <Route
            path="immobiliers/dispatche"
            element={
              <ModernAdminLayout title="Dispatche Immobiliers">
                <ImDispatche />
              </ModernAdminLayout>
            }
          />
          <Route
            path="immobiliers/amortissements"
            element={
              <ModernAdminLayout title="Amortissements">
                <Amortissements />
              </ModernAdminLayout>
            }
          />
          <Route
            path="GestionUtilisateurs"
            element={
              <ModernAdminLayout title="Gestion des Utilisateurs">
                <GestionUtilisateurs />
              </ModernAdminLayout>
            }
          />
          <Route
            path="suivi-stock"
            element={
              <ModernAdminLayout title="Suivi des Stocks">
                <SuiviStock />
              </ModernAdminLayout>
            }
          />
          <Route
            path="register"
            element={
              <ModernAdminLayout title="Inscription">
                <Register />
              </ModernAdminLayout>
            }
          />
          {/* Route par défaut admin - redirection vers suivi-stock */}
          <Route index element={<Navigate to="/admin/suivi-stock" replace />} />
        </Routes>
      </RefreshProvider>
    )
  }

  // Composant User Dashboard (adapté avec les nouveaux layouts)
  function UserDashboard() {
    return (
      <Routes>
        <Route
          path="consommables/stock"
          element={
            <ModernUserLayout title="Stock Consommables">
              <UserStock />
            </ModernUserLayout>
          }
        />
        <Route
          path="consommables/consommation"
          element={
            <ModernUserLayout title="Consommation">
              <UserConsommation />
            </ModernUserLayout>
          }
        />
        <Route
          path="immobiliers/stock"
          element={
            <ModernUserLayout title="Stock Immobiliers">
              <UserImStock />
            </ModernUserLayout>
          }
        />
        <Route
          path="immobiliers/consommation"
          element={
            <ModernUserLayout title="Consommation Immobiliers">
              <UserImConsommation />
            </ModernUserLayout>
          }
        />
        <Route
          path="profil"
          element={
            <ModernUserLayout title="Mon Profil">
              <Profile />
            </ModernUserLayout>
          }
        />
        {/* Route par défaut user - page d'accueil */}
        <Route
          index
          element={
            <ModernUserLayout title="Tableau de bord">
              <div className="dashboard-welcome">
                <h2>Bienvenue dans le tableau de bord utilisateur</h2>
                <p>Sélectionnez une option dans le menu pour commencer.</p>
              </div>
            </ModernUserLayout>
          }
        />
      </Routes>
    )
  }

  return (
    <AuthProvider>
      <div className="app">
        <Routes>
          {/* Route par défaut - redirection vers login (inchangé) */}
          <Route path="/" element={<Navigate to="/auth/login" replace />} />

          {/* Route d'authentification - publique (inchangé) */}
          <Route path="/auth/login" element={<Login />} />

          {/* Routes admin - protégées (structure adaptée) */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Routes utilisateur - protégées (structure adaptée) */}
          <Route
            path="/user/*"
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </AuthProvider>
  )
}

export default App

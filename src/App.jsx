"use client"

import { Routes, Route } from "react-router-dom"
import AdminLayout from "./layouts/AdminLayout"
import UserLayout from "./layouts/UserLayout"
import LoginUser from "./pages/auth/LoginUser"
import LoginAdmin from "./pages/auth/LoginAdmin"
import Register from "./pages/auth/Register"

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

// Import des composants User
import UserSidebar from "./components/user/Sidebar"
import UserStock from "./pages/user/consommables/UserStock"
import UserConsommation from "./pages/user/consommables/UserConsommation"
import UserDemande from "./pages/user/consommables/UserDemande"
import UserImStock from "./pages/user/Immobiliers/UserImStock"
import UserImConsommation from "./pages/user/Immobiliers/UserImConsommation"
import UserImDemande from "./pages/user/Immobiliers/UserImDemande"
import Profile from "./pages/user/Profil/Profile"
import { MockDataProvider} from "../app/MockDataProvider"; // ✅ corrige le chemin si nécessaire

import "./App.css"

function App() {
  // Fonction simple pour la déconnexion (à connecter au backend plus tard)
  const handleLogout = () => {
    console.log("Déconnexion")
    // Ici vous pourriez rediriger vers la page de login si nécessaire
  }

  // Composant Admin Dashboard simplifié
  function AdminDashboard() {
    return (
      <div className="dashboard-container">
        <AdminSidebar />
        <div className="dashboard-content">
          <Routes>
            <Route
              index
              element={<div className="dashboard-welcome">Bienvenue dans le tableau de bord administrateur</div>}
            />
            <Route path="consommables/stock" element={<Stock />} />
            <Route path="consommables/inventaire" element={<Inventaire />} />
            <Route path="consommables/dispatche" element={<Dispatche />} />
            <Route path="immobiliers/stock" element={<ImStock />} />
            <Route path="immobiliers/inventaire" element={<ImInventaire />} />
            <Route path="immobiliers/dispatche" element={<ImDispatche />} />
            <Route path="immobiliers/Amortissements" element={<Amortissements />} />
            <Route path="GestionUtilisateurs" element={<GestionUtilisateurs />} />
            <Route path="suivi-stock" element={<SuiviStock />} />
          </Routes>
        </div>
      </div>
    )
  }

  // Composant User Dashboard simplifié
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
        <Route path="/" element={<LoginUser />} />

        {/* Routes d'authentification */}
        <Route path="/auth/login-user" element={<LoginUser />} />
        <Route path="/auth/login-admin" element={<LoginAdmin />} />
        <Route path="/auth/register" element={<Register />} />

        {/* Routes admin - rendues publiques */}
        <Route
          path="/admin/*"
          element={
            <AdminLayout onLogout={handleLogout}>
              <AdminDashboard />
            </AdminLayout>
          }
        />

        {/* Routes utilisateur - rendues publiques */}
        <Route
          path="/user/*"
          element={
            <UserLayout onLogout={handleLogout}>
              <UserDashboard />
            </UserLayout>
          }
        />
      </Routes>
    </div>
    </MockDataProvider>
  )
}

export default App

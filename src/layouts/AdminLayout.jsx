"use client"

import { useState, useEffect } from "react"
import Sidebar from "../components/admin/Sidebar"
import { Menu, Bell, User, Search, LogOut, UserPlus } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import LoadingOverlay from "../components/LoadingOverlay"
import "./Layout.css"

function AdminLayout({ children, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // Simuler un chargement lors du changement de route
  useEffect(() => {
    const handleRouteChange = () => {
      setLoading(true)
      setTimeout(() => {
        setLoading(false)
      }, 800)
    }

    handleRouteChange()
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleLogout = () => {
    setShowProfile(false)
    navigate("/auth/login-admin")
  }

  const notifications = [
    {
      id: 1,
      title: "Stock critique",
      message: "Cartouches d'encre en stock critique (20 unités)",
      time: "Il y a 2 heures",
      type: "warning",
    },
    {
      id: 2,
      title: "Nouvelle livraison",
      message: "Livraison de papier A4 reçue (150 ramettes)",
      time: "Il y a 5 heures",
      type: "info",
    },
  ]

  return (
    <div className={`admin-layout ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      {loading && <LoadingOverlay />}

      <header className="modern-header">
        <div className="header-left">
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            <Menu size={20} />
          </button>
          <div className="header-brand">
            <h1>Gestion de Stock</h1>
            <span>Système de gestion des stocks des Concommables et des Immobiliers</span>
          </div>
        </div>

        <div className="header-right">
          <div className="header-actions">

            {/* Notifications */}
            <div className="action-item">
              <button
                className="action-btn"
                onClick={() => {
                  setShowNotifications(!showNotifications)
                  setShowProfile(false)
                }}
              >
                <Bell size={18} />
                <span className="badge">2</span>
              </button>

              {showNotifications && (
                <div className="simple-dropdown notifications">
                  <div className="dropdown-header">
                    <h4>Notifications</h4>
                  </div>
                  <div className="dropdown-body">
                    {notifications.map((notif) => (
                      <div key={notif.id} className="notif-item">
                        <div className="notif-content">
                          <h5>{notif.title}</h5>
                          <p>{notif.message}</p>
                          <small>{notif.time}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="dropdown-footer">
                    <Link to="/admin/notifications">Voir tout</Link>
                  </div>
                </div>
              )}
            </div>

            {/* Profil */}
            <div className="action-item">
              <button
                className="action-btn"
                onClick={() => {
                  setShowProfile(!showProfile)
                  setShowNotifications(false)
                }}
              >
                <User size={18} />
              </button>

              {showProfile && (
                <div className="simple-dropdown profile">
                  <div className="dropdown-body">
                    <Link to="/admin/register" className="dropdown-link">
                      <UserPlus size={16} />
                      <span>Inscription</span>
                    </Link>
                    <button className="dropdown-link logout" onClick={handleLogout}>
                      <LogOut size={16} />
                      <Link to="./auth/loginAdmin">
                      <span>Déconnexion</span>
                      </Link>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <Sidebar isOpen={sidebarOpen} />

      {/* Overlay pour mobile */}
      <div className={`sidebar-overlay ${sidebarOpen ? "active" : ""}`} onClick={toggleSidebar}></div>

      <main className="admin-main">{children}</main>

      {/* Overlay pour fermer les dropdowns */}
      {(showNotifications || showProfile) && (
        <div
          className="dropdown-overlay"
          onClick={() => {
            setShowNotifications(false)
            setShowProfile(false)
          }}
        ></div>
      )}
    </div>
  )
}

export default AdminLayout

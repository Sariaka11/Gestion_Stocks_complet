"use client"

import { useState, useEffect } from "react"
import Sidebar from "../components/admin/Sidebar"
import { Bell, User, LogOut, Menu, X, Search } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import LoadingOverlay from "../components/LoadingOverlay"
import "./Layout.css"

function AdminLayout({ children, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const navigate = useNavigate()

  // Simuler un chargement lors du changement de route
  useEffect(() => {
    const handleRouteChange = () => {
      setLoading(true)
      setTimeout(() => {
        setLoading(false)
      }, 800)
    }

    // Appeler une fois au montage
    handleRouteChange()

    // Surveiller les changements de route
    return () => {
      // Nettoyage si nécessaire
    }
  }, [])

  // Notifications fictives
  const notifications = [
    {
      id: 1,
      title: "Stock critique",
      message: "Le niveau de stock de papier A4 est bas",
      time: "Il y a 5 minutes",
      read: false,
    },
    {
      id: 2,
      title: "Nouvelle demande",
      message: "Nouvelle demande de fournitures de l'agence CEM01",
      time: "Il y a 30 minutes",
      read: false,
    },
    {
      id: 3,
      title: "Inventaire terminé",
      message: "L'inventaire mensuel a été complété avec succès",
      time: "Il y a 2 heures",
      read: true,
    },
  ]

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen)
    setProfileOpen(false)
  }

  const toggleProfile = () => {
    setProfileOpen(!profileOpen)
    setNotificationsOpen(false)
  }

  const toggleSearch = () => {
    setSearchOpen(!searchOpen)
    if (searchOpen) {
      setSearchQuery("")
    }
  }

  const handleLogout = () => {
    // Fermer le menu profil
    setProfileOpen(false)
    // Rediriger vers la page de login admin
    navigate("/auth/login-admin")
  }

  return (
    <div className={`admin-layout ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      {loading && <LoadingOverlay />}

      <header className="admin-header">
        <div className="header-left">
          <button className="toggle-sidebar-btn" onClick={toggleSidebar}>
            {sidebarOpen ? <Menu size={20} /> : <Menu size={20} />}
          </button>
          <div className="header-title">
            <h1>Gestion de Stock</h1>
            <div className="header-subtitle">Système de gestion des stocks et immobilisations</div>
          </div>
        </div>

      <div className="header-right-container">
        <div className="header-right">
          <div className={`search-container ${searchOpen ? "search-open" : ""}`}>
            <button className="header-icon-btn search-toggle" onClick={toggleSearch}>
              <Search size={20} />
            </button>
            <input
              type="text"
              className="search-input"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="notification-container">
            <button className="header-icon-btn" onClick={toggleNotifications}>
              <Bell size={20} />
              <span className="notification-badge">2</span>
            </button>

            {notificationsOpen && (
              <div className="dropdown-menu notifications-dropdown">
                <div className="dropdown-header">
                  <h3>Notifications</h3>
                  <button className="mark-all-read">Tout marquer comme lu</button>
                </div>
                <div className="dropdown-content">
                  {notifications.map((notification) => (
                    <div key={notification.id} className={`notification-item ${notification.read ? "read" : "unread"}`}>
                      <div className="notification-icon">
                        <Bell size={16} />
                      </div>
                      <div className="notification-content">
                        <div className="notification-title">{notification.title}</div>
                        <div className="notification-message">{notification.message}</div>
                        <div className="notification-time">{notification.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="dropdown-footer">
                  <Link to="/admin/notifications">Voir toutes les notifications</Link>
                </div>
              </div>
            )}
          </div>

          <div className="profile-container">
            <button className="header-icon-btn profile-btn" onClick={toggleProfile}>
              <User size={20} />
            </button>

            {profileOpen && (
              <div className="dropdown-menu profile-dropdown">
                <div className="dropdown-header">
                  <div className="profile-info">
                    <div className="profile-avatar">A</div>
                    <div className="profile-details">
                      <h3>Admin</h3>
                      <p>admin@example.com</p>
                    </div>
                  </div>
                </div>
                <div className="dropdown-content">
                  <div className="profile-stats">
                    <div className="stat-item">
                      <span className="stat-value">24</span>
                      <span className="stat-label">Agences</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">156</span>
                      <span className="stat-label">Articles</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">42</span>
                      <span className="stat-label">Utilisateurs</span>
                    </div>
                  </div>
                  <Link to="/admin/profile" className="dropdown-item">
                    <User size={16} />
                    <span>Mon profil</span>
                  </Link>
                </div>
                <div className="dropdown-footer">
                  <button className="logout-btn" onClick={handleLogout}>
                    <LogOut size={16} />
                    <span>Déconnexion</span>
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
    </div>
  )
}

export default AdminLayout

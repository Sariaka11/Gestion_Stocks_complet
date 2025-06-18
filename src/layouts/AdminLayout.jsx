"use client"

import { useState, useEffect, useRef } from "react"
import Sidebar from "../components/admin/Sidebar"
import { Menu, Bell, User, UserPlus, LogOut } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import LoadingOverlay from "../components/LoadingOverlay"
import { getNotifications } from "../services/notificationServices"
import { useAuth } from "../Context/AuthContext"
import "./Layout.css"
import stockImage from '../assets/logo.png'

function AdminLayout({ children }) {
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState([])
  const navigate = useNavigate()
  
  // Refs pour détecter les clics à l'extérieur
  const notificationRef = useRef(null)
  const profileRef = useRef(null)

  // Charger les notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      console.log("Début du chargement des notifications pour l'admin")
      try {
        const response = await getNotifications(null, true)
        console.log("Réponse de l'API Notifications:", response.data)
        const data = Array.isArray(response.data) ? response.data : response.data?.["$values"] || []
        setNotifications(data)
        console.log("Notifications chargées:", data)
      } catch (error) {
        console.error("Erreur lors du chargement des notifications:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        })
      }
    }
    fetchNotifications()
  }, [])

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

  // Fermer les dropdowns en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleLogout = (e) => {
    console.log('handleLogout called')
    e.preventDefault()
    e.stopPropagation()
    
    try {
      setShowProfile(false)
      logout()
      console.log('About to navigate')
      navigate("/auth/login")
    } catch (error) {
      console.error('Error in handleLogout:', error)
    }
  }

  const toggleNotifications = (e) => {
    e.stopPropagation()
    setShowNotifications(!showNotifications)
    setShowProfile(false)
    console.log("Toggle notifications:", !showNotifications)
  }

  const toggleProfile = (e) => {
    e.stopPropagation()
    setShowProfile(!showProfile)
    setShowNotifications(false)
    console.log("Toggle profile:", !showProfile)
  }

  // Calculer le temps écoulé
  const getTimeAgo = (date) => {
    const now = new Date()
    const diffMs = now - new Date(date)
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffHours < 1) return "Il y a moins d'une heure"
    return `Il y a ${diffHours} heure${diffHours > 1 ? "s" : ""}`
  }

  return (
    <div className={`admin-layout ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      {loading && <LoadingOverlay />}

      <header className="modern-header">
        <div className="header-left">
          <div className="logo">
            <img src={stockImage} alt="Logo" className="logo-icon" />
          </div>
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            <Menu size={20} />
          </button>
          <span className="logo-text">Gestion des Stocks des consommables et des immobiliers</span>
        </div>

        <div className="header-right">
          <div className="header-actions">
            {/* Notifications */}
            <div className="action-item" ref={notificationRef}>
              <button
                className="action-btn"
                onClick={toggleNotifications}
              >
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="badge">{notifications.length}</span>
                )}
              </button>

              {showNotifications && (
                <div className="simple-dropdown notifications">
                  <div className="dropdown-header">
                    <h4>Notifications</h4>
                  </div>
                  <div className="dropdown-body">
                    {notifications.length === 0 ? (
                      <div className="notif-item">
                        <p>Aucune notification</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div key={notif.id} className="notif-item">
                          <div className="notif-content">
                            <h5>{notif.titre}</h5>
                            <p>{notif.corps}</p>
                            <small>{getTimeAgo(notif.dateDemande)}</small>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {/* <div className="dropdown-footer">
                    <Link to="/admin/notifications">Voir tout</Link>
                  </div> */}
                </div>
              )}
            </div>

            {/* Profil */}
            <div className="action-item" ref={profileRef}>
              <button
                className="action-btn"
                onClick={toggleProfile}
              >
                <User size={20} />
              </button>

              {showProfile && (
                <div className="simple-dropdown profile">
                  <div className="dropdown-body">
                    <Link to="/admin/register" className="dropdown-link">
                      <UserPlus size={16} />
                      <span>Inscription</span>
                    </Link>
                    <button 
                      className="dropdown-link logout" 
                      onClick={handleLogout}
                      type="button"
                    >
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
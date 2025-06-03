"use client"

import { useState, useEffect, useRef } from "react"
import Sidebar from "../components/admin/Sidebar"
import { Menu, Bell, User, Search, LogOut, UserPlus } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import LoadingOverlay from "../components/LoadingOverlay"
import "./Layout.css"
import stockImage from '../assets/logo.png'

function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  
  // Refs pour détecter les clics à l'extérieur
  const notificationRef = useRef(null)
  const profileRef = useRef(null)

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
      localStorage.removeItem('user')
      console.log('About to navigate')
      navigate("/auth/login-admin")
    } catch (error) {
      console.error('Error in handleLogout:', error)
    }
  }

  const toggleNotifications = (e) => {
    e.stopPropagation()
    setShowNotifications(!showNotifications)
    setShowProfile(false)
  }

  const toggleProfile = (e) => {
    e.stopPropagation()
    setShowProfile(!showProfile)
    setShowNotifications(false)
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
            <div className="logo">
            <img src={stockImage} alt="Logo" className="logo-icon" />
          </div>
          <button className="sidebar-toggle" onClick={toggleSidebar} >
            <Menu size={20} />
          </button>
            <span className="logo-text">Gestion des Stocks des consommables et des immobiliers</span>

          {/* <div className="header-brand">
            <h1>Gestion de Stock</h1>
            <span>Système de gestion des stocks des Concommables et des Immobiliers</span>
          </div> */}
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
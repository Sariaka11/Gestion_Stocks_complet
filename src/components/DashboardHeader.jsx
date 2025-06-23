"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, User, Menu, LogOut } from "lucide-react" // Retiré UserPlus car plus nécessaire
import { useAuth } from "../Context/AuthContext"
import { getNotifications } from "../services/notificationServices"
import "./DashboardHeader.css"

function DashboardHeader({ onToggleSidebar, title = "Tableau de bord", userType = "admin" }) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const { logout } = useAuth()

  const notificationRef = useRef(null)
  const profileRef = useRef(null)

  // Charger les notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true)
        const response = await getNotifications(null, true)
        const data = Array.isArray(response.data) ? response.data : response.data?.["$values"] || []
        setNotifications(data)
      } catch (error) {
        console.error("Erreur lors du chargement des notifications:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchNotifications()
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

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleLogout = () => {
    logout()
    window.location.href = "/auth/login"
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

  // Calculer le temps écoulé
  const getTimeAgo = (date) => {
    const now = new Date()
    const diffMs = now - new Date(date)
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffHours < 1) return "Il y a moins d'une heure"
    return `Il y a ${diffHours} heure${diffHours > 1 ? "s" : ""}`
  }
  console.log("userType:", userType);

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <header className="dashboard-header">
      {/* Section gauche */}
      <div className="header-left">
        <button className="sidebar-toggle" onClick={onToggleSidebar}>
          <Menu size={20} />
        </button>
        <div className="header-title">
          <h1>{title}</h1>
          <span className="header-subtitle">Système de gestion des stocks</span>
        </div>
      </div>

      {/* Section centrale - vide maintenant */}
      <div className="header-center">{/* Espace vide au centre */}</div>

      {/* Section droite */}
      <div className="header-right">
        {/* Notifications - Affichées uniquement pour admin, comme dans le sidebar */}
        {userType === "admin" && (
          <div className="header-action" ref={notificationRef}>
            <button className="action-button notification-btn" onClick={toggleNotifications}>
              <Bell size={20} />
              {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>

            {showNotifications && (
              <div className="dropdown notifications-dropdown">
                <div className="dropdown-header">
                  <h4>Notifications</h4>
                  {unreadCount > 0 && <span className="unread-count">{unreadCount} nouvelles</span>}
                </div>
                <div className="dropdown-body">
                  {loading ? (
                    <div className="loading-state">Chargement...</div>
                  ) : notifications.length === 0 ? (
                    <div className="empty-state">Aucune notification</div>
                  ) : (
                    notifications.slice(0, 5).map((notif) => (
                      <div key={notif.id} className={`notification-item ${!notif.isRead ? "unread" : ""}`}>
                        <div className="notification-indicator"></div>
                        <div className="notification-content">
                          <h5 className="notification-title">{notif.titre}</h5>
                          <p className="notification-message">{notif.corps}</p>
                          <small className="notification-time">{getTimeAgo(notif.dateDemande)}</small>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {notifications.length > 5 && (
                  <div className="dropdown-footer">
                    <button className="view-all-btn">Voir toutes les notifications</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Profil - Sans lien Inscription */}
        <div className="header-action" ref={profileRef}>
          <button className="action-button profile-btn" onClick={toggleProfile}>
            <User size={20} />
          </button>

          {showProfile && (
            <div className="dropdown profile-dropdown">
              <div className="dropdown-body">
                {/* Uniquement le bouton de déconnexion */}
                <button className="dropdown-link logout-link" onClick={handleLogout}>
                  <LogOut size={16} />
                  <span>Déconnexion</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default DashboardHeader
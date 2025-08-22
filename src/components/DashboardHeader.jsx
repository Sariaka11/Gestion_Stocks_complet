import { useState, useEffect, useRef } from "react"
import { Bell, User, Menu, LogOut } from "lucide-react"
import { useAuth } from "../Context/AuthContext"
import { getNotifications, markNotificationAsRead } from "../services/notificationServices"
import "./DashboardHeader.css"
import { useNavigate } from "react-router-dom"

function DashboardHeader({ onToggleSidebar, title = "Tableau de bord", userType = "admin" }) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const { logout } = useAuth()
  const navigate = useNavigate()

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
    navigate("/auth/login")
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

  // Gestion du clic sur une notification
  const handleNotificationClick = async (notification) => {
    try {
      // Marquer la notification comme vue
      await markNotificationAsRead(notification.Id)
      // Mettre à jour l'état local
      setNotifications(notifications.map(n =>
        n.id === notification.Id ? { ...n, statut: "Vue" } : n
      ))
      // Rediriger en fonction de bienId ou fournitureId
      if (notification.BienId) {
        navigate("../immobiliers/Dispatche")
      } else if (notification.FournitureId) {
        navigate("../consommables/Dispatche")
      }
    } catch (error) {
      console.error("Erreur lors du marquage de la notification comme vue:", error)
    }
  }

  // Calculer le temps écoulé
  const getTimeAgo = (date) => {
    const now = new Date()
    const past = new Date(date)

    // Décalage manuel si la date est en UTC mais tu veux la lire comme UTC+3
    past.setHours(past.getHours() + 3)

    const diffMs = now - past
    const seconds = Math.floor(diffMs / 1000)
    const minutes = Math.floor(diffMs / 1000 / 60)
    const hours = Math.floor(diffMs / 1000 / 60 / 60)
    const days = Math.floor(diffMs / 1000 / 60 / 60 / 24)

    if (seconds < 60) return "Il y a un instant"
    if (minutes < 60) return `Il y a ${minutes} minute${minutes > 1 ? "s" : ""}`
    if (hours < 24) return `Il y a ${hours} heure${hours > 1 ? "s" : ""}`
    return `Il y a ${days} jour${days > 1 ? "s" : ""}`
  }

  const unreadCount = notifications.filter((n) => n.Statut === "Non vue").length

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
        {/* Notifications - Affichées uniquement pour admin */}
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
                      <div
                        key={notif.Id}
                        className={`notification-item ${notif.statut === "Non vue" ? "unread" : "read"}`}
                        onClick={() => handleNotificationClick(notif)}
                      >
                        <div className="notification-indicator"></div>
                        <div className="notification-content">
                          <h5 className="notification-title">{notif.Titre}</h5>
                          <p className="notification-message">{notif.Corps}</p>
                          <small className="notification-time">{getTimeAgo(notif.DateDemande)}</small>
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
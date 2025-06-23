"use client"

import { useState, useEffect } from "react"
import { getUserById, getUserAgence, getUserFournitures } from "../../../services/userServices"
import "./css/Profile.css"
import { FaUser, FaEnvelope, FaBriefcase, FaMapMarkerAlt, FaCalendarAlt } from "react-icons/fa";


function Profile() {
  const [activeTab, setActiveTab] = useState("info")
  const [user, setUser] = useState(null)
  //const [agence, setAgence] = useState(null)
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Données statiques pour les préférences (en attendant un endpoint API)
  const preferences = {
    notifications: true,
    emailAlerts: true,
    language: "Français",
    theme: "Clair",
  }

  // Récupérer l'utilisateur connecté depuis localStorage
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user"))
        if (!storedUser || !storedUser.id) {
          setError("Utilisateur non connecté")
          setLoading(false)
          return
        }

        // Récupérer les informations de l'utilisateur
        const userResponse = await getUserById(storedUser.id)
        const userData = userResponse.data

        // Récupérer l'agence de l'utilisateur
        const agenceResponse = await getUserAgence(storedUser.id)
        const agenceData = agenceResponse.data

        // Récupérer l'historique des fournitures/activités
        const fournituresResponse = await getUserFournitures(storedUser.id)
        const fournituresData = fournituresResponse.data

        // Mapper les données utilisateur
        setUser({
          nom: `${userData.prenom} ${userData.nom}`,
          email: userData.email,
          fonction: userData.fonction,
          departement: agenceData.departement || "Non spécifié", // Supposons que l'API retourne un département
          agence: agenceData.nom || "Non spécifié", // Supposons que l'API retourne un nom d'agence
          dateInscription: userData.dateInscription
            ? new Date(userData.dateInscription).toLocaleDateString("fr-FR")
            : "Non spécifié",
        })

        // Mapper les données des fournitures pour l'historique des activités
        setActivities(
          fournituresData.map((item, index) => ({
            id: index + 1,
            action: item.typeAction || "Action inconnue", // Ajuster selon la structure de l'API
            item: item.nom || "Article inconnu",
            date: item.dateAction || new Date().toISOString(),
            details: item.details || "Aucun détail",
          }))
        )

        setLoading(false)
      } catch (err) {
        setError("Erreur lors de la récupération des données: " + err.message)
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  
  if (loading) {
    return <div className="profile-page">Chargement...</div>
  }

  if (error) {
    return <div className="profile-page error">{error}</div>
  }

  if (!user) {
    return <div className="profile-page error">Aucune donnée utilisateur disponible</div>
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">
          <div className="avatar-placeholder">
            {user.nom
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
        </div>
        <div className="profile-title">
          <h2>{user.nom}</h2>
          <p>{user.fonction}</p>
        </div>
      </div>

      <div className="profile-tabs">
        <button className={`tab-button ${activeTab === "info" ? "active" : ""}`} onClick={() => setActiveTab("info")}>
          Informations
        </button>
        {/* <button
          className={`tab-button ${activeTab === "activity" ? "active" : ""}`}
          onClick={() => setActiveTab("activity")}
        >
          Activités
        </button>
        <button
          className={`tab-button ${activeTab === "preferences" ? "active" : ""}`}
          onClick={() => setActiveTab("preferences")}
        >
          Préférences
        </button> */}
      </div>

      <div className="profile-content">
        {activeTab === "info" && (
  <div className="profile-info">
    <div className="info-card">
      <div className="info-item">
        <div className="info-icon"><FaUser /></div>
        <div className="info-content">
          <h4>Nom complet</h4>
          <p>{user.nom}</p>
        </div>
      </div>

      <div className="info-item">
        <div className="info-icon"><FaEnvelope /></div>
        <div className="info-content">
          <h4>Email</h4>
          <p>{user.email}</p>
        </div>
      </div>

      <div className="info-item">
        <div className="info-icon"><FaBriefcase /></div>
        <div className="info-content">
          <h4>Fonction</h4>
          <p>{user.fonction}</p>
        </div>
      </div>

      <div className="info-item">
        <div className="info-icon"><FaMapMarkerAlt /></div>
        <div className="info-content">
          <h4>Agence</h4>
          <p>{user.agence}</p>
        </div>
      </div>

      <div className="info-item">
        <div className="info-icon"><FaCalendarAlt /></div>
        <div className="info-content">
          <h4>Date d'inscription</h4>
          <p>{user.dateInscription}</p>
        </div>
      </div>
    </div>
  </div>
)}
       

        {activeTab === "preferences" && (
          <div className="user-preferences">
            <h3>Préférences utilisateur</h3>
            <div className="preferences-list">
              <div className="preference-item">
                <div className="preference-label">Notifications push</div>
                <div className="preference-value">
                  <label className="toggle">
                    <input type="checkbox" defaultChecked={preferences.notifications} />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div className="preference-item">
                <div className="preference-label">Alertes par email</div>
                <div className="preference-value">
                  <label className="toggle">
                    <input type="checkbox" defaultChecked={preferences.emailAlerts} />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div className="preference-item">
                <div className="preference-label">Langue</div>
                <div className="preference-value">
                  <select defaultValue={preferences.language}>
                    <option value="Français">Français</option>
                    <option value="English">English</option>
                  </select>
                </div>
              </div>

              <div className="preference-item">
                <div className="preference-label">Thème</div>
                <div className="preference-value">
                  <select defaultValue={preferences.theme}>
                    <option value="Clair">Clair</option>
                    <option value="Sombre">Sombre</option>
                    <option value="Système">Système</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="preferences-actions">
              <button className="save-button">Enregistrer les modifications</button>
              <button className="reset-button">Réinitialiser</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile
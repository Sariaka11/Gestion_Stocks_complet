
"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../Context/AuthContext"
import { User, Lock } from "lucide-react"
import "./Login.css"
import stockImage from "../../assets/stock.png"

const API_URL = "http://localhost:5000/api"

function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { user, login } = useAuth()
  const hasRedirected = useRef(false)

  // Vérifier si l'utilisateur est connecté et rediriger
  useEffect(() => {
    console.log("useEffect executed, user:", user, "hasRedirected:", hasRedirected.current)
    if (hasRedirected.current || !user) return

    hasRedirected.current = true
    if (user.fonction === "admin") {
      console.log("Redirection vers admin/suivi-stock")
      navigate("/admin/suivi-stock", { replace: true })
    } else if (user.fonction === "utilisateur") {
      console.log("Redirection vers user/consommables/stock")
      navigate("/user/consommables/stock", { replace: true })
    } else {
      console.log("Rôle utilisateur non reconnu :", user.fonction)
    }
  }, [user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email || !password) {
      setError("Veuillez remplir tous les champs")
      console.log("Champs email ou password vides")
      return
    }

    setLoading(true)
    setError("")

    try {
      console.log("Envoi de la requête de connexion avec :", { email })
      const response = await fetch(`${API_URL}/Users/Login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      console.log("Réponse API reçue, statut :", response.status)
      if (!response.ok) {
        const errorData = await response.json()
        console.log("Erreur API :", errorData)
        throw new Error(errorData.message || "Erreur lors de la connexion")
      }

      const userData = await response.json()
      console.log("Données utilisateur reçues :", userData)

      // Utiliser la fonction login du contexte
      login(userData)

      // Rediriger immédiatement
      hasRedirected.current = true
      if (userData.fonction === "admin") {
        console.log("Redirection vers admin/suivi-stock")
        navigate("/admin/suivi-stock", { replace: true })
      } else if (userData.fonction === "utilisateur" ) {
        console.log("Redirection vers user/consommables/stock")
        navigate("/user/consommables/stock", { replace: true })
      } else {
        console.log("Rôle utilisateur non reconnu :", userData.fonction)
        throw new Error("Rôle utilisateur non reconnu")
      }
    } catch (err) {
      console.error("Erreur dans handleSubmit :", err.message)
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Connexion en cours...</p>
        </div>
      )}
      <div className="auth-container">
        <div className="auth-left">
          <div className="auth-left-content">
            <h1>
              Bienvenue sur <br />
              <span className="app-name">StockManager</span>
            </h1>
            <p className="auth-description">Système de gestion de stock et d'inventaire</p>
          </div>
        </div>
        <div className="auth-right">
          <div className="auth-form-container">
            <div className="auth-logo">
              <img src={stockImage || "/placeholder.svg"} alt="CEM Logo" className="logo-large" />
            </div>
            <h2>Connexion</h2>
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <div className="label-with-icon">
                  <User className="label-icon" size={18} />
                  <label htmlFor="email">Adresse Email</label>
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Entrez votre email"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <div className="label-with-icon">
                  <Lock className="label-icon" size={18} />
                  <label htmlFor="password">Mot de Passe</label>
                </div>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Entrez votre mot de passe"
                  className="form-input"
                />
              </div>

              <div className="form-options">
                <label className="checkbox-container">
                  <input type="checkbox" />
                  <span className="checkmark"></span>
                  Se souvenir de moi
                </label>
              </div>

              <button type="submit" className="btn-connect" disabled={loading}>
                Se Connecter
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login

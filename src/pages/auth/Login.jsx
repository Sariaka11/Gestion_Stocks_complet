"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { User, Lock } from "lucide-react"
import "./Login.css"
import stockImage from "../../assets/stock.png"

const API_URL = "http://localhost:5000/api" // Adjust to your backend URL

function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // Check if user is already logged in and redirect based on role
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"))
    if (user) {
      if (user.fonction === "admin") {
        navigate("/admin/suivi-stock", { replace: true })
      } else if (user.fonction === "utilisateur") {
        navigate("/user/consommables/stock", { replace: true })
      }
    }
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Simple validation
    if (!email || !password) {
      setError("Veuillez remplir tous les champs")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch(`${API_URL}/Users/Login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Erreur lors de la connexion")
      }

      const user = await response.json()

      // Store user data in localStorage
      localStorage.setItem("user", JSON.stringify(user))

      // Redirect based on user role
      setTimeout(() => {
        if (user.fonction === "admin") {
          navigate("/admin/suivi-stock", { replace: true })
        } else if (user.fonction === "utilisateur") {
          navigate("/user/consommables/stock", { replace: true })
        } else {
          throw new Error("Rôle utilisateur non reconnu")
        }
      }, 1000)
    } catch (err) {
      setError(err.message)
    } finally {
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
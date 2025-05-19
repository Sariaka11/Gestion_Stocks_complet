"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { User, Lock } from "lucide-react"
import "./Login.css"

function LoginAdmin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validation simple
    if (!email || !password) {
      setError("Veuillez remplir tous les champs")
      return
    }

    // Simuler un chargement
    setLoading(true)

    // Redirection après un délai pour simuler le chargement
    setTimeout(() => {
      navigate("/admin/suivi-stock")
    }, 1500)
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
            <div className="auth-logo">
              <img src="../../../assets/stock.jpg" alt="CEM Logo" className="logo-large" />
            </div>
          </div>
        </div>
        <div className="auth-right">
          <div className="auth-form-container">
            <h2>Connexion Administrateur</h2>
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Adresse Email</label>
                <div className="input-with-icon">
                  <User className="input-icon" size={18} />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Entrez votre email"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Mot de Passe</label>
                <div className="input-with-icon">
                  <Lock className="input-icon" size={18} />
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Entrez votre mot de passe"
                  />
                </div>
              </div>

              <div className="form-options">
                <label className="checkbox-container">
                  <input type="checkbox" />
                  <span className="checkmark"></span>
                  Se souvenir de moi
                </label>
              </div>

              <button type="submit" className="btn-connect">
                Se Connecter
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginAdmin

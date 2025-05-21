"use client";

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Lock } from "lucide-react";
import "./Login.css";
import stockImage from '../../assets/stock.png';

const API_URL = "http://localhost:5000/api"; // Adjust to your backend URL

function LoginAdmin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.fonction === "admin") {
      navigate("/admin/suivi-stock", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Simple validation
    if (!email || !password) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/Users/Login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de la connexion");
      }

      const user = await response.json();
      if (user.fonction !== "admin") {
        throw new Error("Accès réservé aux administrateurs");
      }

      // Store user data in localStorage
      localStorage.setItem("user", JSON.stringify(user));

      // Redirect after successful login
      setTimeout(() => {
        navigate("/admin/suivi-stock", { replace: true });
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
              <img src={stockImage} alt="CEM Logo" className="logo-large" />
            </div>
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

              <button type="submit" className="btn-connect" disabled={loading}>
                Se Connecter
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginAdmin;
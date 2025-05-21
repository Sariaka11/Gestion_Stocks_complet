"use client";

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Building, UserCog, Lock, KeyRound } from "lucide-react";
import "./Register.css";

const API_URL = "http://localhost:5000/api"; // Adjust to your backend URL

function Register() {
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "", // Added prenom to match User.cs model
    email: "",
    agence: "",
    fonction: "utilisateur",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.nom || !formData.prenom || !formData.email || !formData.agence || !formData.password || !formData.confirmPassword) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Step 1: Create user
      const userResponse = await fetch(`${API_URL}/Users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          motDePasse: formData.password,
          fonction: formData.fonction,
        }),
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        throw new Error(errorData.message || "Erreur lors de la création de l'utilisateur");
      }

      const user = await userResponse.json();

      // Step 2: Associate user with agency (assuming agence is the agency ID or name)
      const agenceResponse = await fetch(`${API_URL}/Agences`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const agences = await agenceResponse.json();
      const agence = agences.find(a => a.nom.toLowerCase() === formData.agence.toLowerCase() || a.numero === formData.agence);

      if (!agence) {
        throw new Error("Agence introuvable");
      }

      const userAgenceResponse = await fetch(`${API_URL}/UserAgences`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          agenceId: agence.id,
        }),
      });

      if (!userAgenceResponse.ok) {
        const errorData = await userAgenceResponse.json();
        throw new Error(errorData.message || "Erreur lors de l'association avec l'agence");
      }

      setSuccess("Utilisateur créé avec succès!");
      setTimeout(() => {
        navigate(formData.fonction === "admin" ? "/auth/login-admin" : "/auth/login-user");
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container register-container">
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Création du compte en cours...</p>
        </div>
      )}
      <div className="auth-content">
        <div className="auth-logo">
          <img src="/src/assets/cem-logo.png" alt="CEM Logo" className="logo" />
        </div>
        <div className="auth-header">
          <h1>
            Bienvenue sur <span className="app-name">StockManager</span>
          </h1>
          <p className="auth-description">Système de gestion de stock et d'inventaire</p>
        </div>
        <div className="auth-form-container register-form-container">
          <h2>Inscription Utilisateur</h2>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          <form onSubmit={handleSubmit} className="auth-form register-form">
            <div className="form-columns">
              <div className="form-column">
                <div className="form-group">
                  <label htmlFor="nom">Nom</label>
                  <div className="input-with-icon">
                    <User className="input-icon" size={18} />
                    <input
                      type="text"
                      id="nom"
                      name="nom"
                      value={formData.nom}
                      onChange={handleChange}
                      placeholder="Nom"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="prenom">Prénom</label>
                  <div className="input-with-icon">
                    <User className="input-icon" size={18} />
                    <input
                      type="text"
                      id="prenom"
                      name="prenom"
                      value={formData.prenom}
                      onChange={handleChange}
                      placeholder="Prénom"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <div className="input-with-icon">
                    <Mail className="input-icon" size={18} />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Email"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="agence">Agence</label>
                  <div className="input-with-icon">
                    <Building className="input-icon" size={18} />
                    <input
                      type="text"
                      id="agence"
                      name="agence"
                      value={formData.agence}
                      onChange={handleChange}
                      placeholder="Agence"
                    />
                  </div>
                </div>
              </div>
              <div className="form-column">
                <div className="form-group">
                  <label htmlFor="fonction">Fonction</label>
                  <div className="input-with-icon">
                    <UserCog className="input-icon" size={18} />
                    <select id="fonction" name="fonction" value={formData.fonction} onChange={handleChange}>
                      <option value="utilisateur">Utilisateur</option>
                      <option value="admin">Administrateur</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="password">Mot de passe</label>
                  <div className="input-with-icon">
                    <Lock className="input-icon" size={18} />
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Mot de passe"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
                  <div className="input-with-icon">
                    <KeyRound className="input-icon" size={18} />
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirmer le mot de passe"
                    />
                  </div>
                </div>
              </div>
            </div>
            <button type="submit" className="btn-register" disabled={loading}>
              Inscrire
            </button>
          </form>
          <div className="auth-footer">
            <p>
              Déjà inscrit? <Link to="/auth/login-admin">Connexion</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
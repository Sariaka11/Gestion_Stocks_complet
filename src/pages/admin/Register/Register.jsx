"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { User, Mail, Building, UserCog, Lock, KeyRound } from "lucide-react"
import { Link } from "react-router-dom"
import "./Register.css"

const API_URL = "http://localhost:5000/api"

function Register() {
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    agence: "",
    fonction: "utilisateur",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSelectChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (
      !formData.nom ||
      !formData.prenom ||
      !formData.email ||
      !formData.agence ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Veuillez remplir tous les champs")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

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
      })

      if (!userResponse.ok) {
        const errorData = await userResponse.json()
        throw new Error(errorData.message || "Erreur lors de la création de l'utilisateur")
      }

      const user = await userResponse.json()

      // Step 2: Associate user with agency
      const agenceResponse = await fetch(`${API_URL}/Agences`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })

      const agences = await agenceResponse.json()
      const agence = agences.find(
        (a) => a.nom.toLowerCase() === formData.agence.toLowerCase() || a.numero === formData.agence,
      )

      if (!agence) {
        throw new Error("Agence introuvable")
      }

      const userAgenceResponse = await fetch(`${API_URL}/UserAgences`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          agenceId: agence.id,
        }),
      })

      if (!userAgenceResponse.ok) {
        const errorData = await userAgenceResponse.json()
        throw new Error(errorData.message || "Erreur lors de l'association avec l'agence")
      }

      setSuccess("Utilisateur créé avec succès!")
      setTimeout(() => {
        navigate("/auth/login")
      }, 1000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoBack = () => {
    navigate(-1)
  }

  return (
    <div className="register-container">
      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="spinner"></div>
            <p>Création du compte en cours...</p>
          </div>
        </div>
      )}

      <div className="register-wrapper">
        <div className="register-header">
          <h1 className="register-title">Inscription Utilisateur</h1>
          <p className="register-description">Créez un nouveau compte pour accéder au système</p>
        </div>

        <div className="register-card">
          <div className="card-header">
            <h2 className="card-title">
              <User className="title-icon" />
              Nouveau Compte
            </h2>
            <p className="card-description">
              Remplissez les informations ci-dessous pour créer un nouveau compte pour une Agence
            </p>
          </div>

          <div className="card-content">
            {error && (
              <div className="alert alert-error">
                <p>{error}</p>
              </div>
            )}
            {success && (
              <div className="alert alert-success">
                <p>{success}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="register-form">
              <div className="form-columns">
                {/* Colonne gauche */}
                <div className="form-column">
                  <div className="form-group">
                    <label htmlFor="nom" className="form-label">
                      Nom *
                    </label>
                    <div className="input-wrapper">
                      <User className="input-icon" />
                      <input
                        id="nom"
                        name="nom"
                        type="text"
                        placeholder="Entrez le nom"
                        value={formData.nom}
                        onChange={handleInputChange}
                        className="form-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="prenom" className="form-label">
                      Prénom *
                    </label>
                    <div className="input-wrapper">
                      <User className="input-icon" />
                      <input
                        id="prenom"
                        name="prenom"
                        type="text"
                        placeholder="Entrez le prénom"
                        value={formData.prenom}
                        onChange={handleInputChange}
                        className="form-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="email" className="form-label">
                      Email *
                    </label>
                    <div className="input-wrapper">
                      <Mail className="input-icon" />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="exemple@email.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="form-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="agence" className="form-label">
                      Agence *
                    </label>
                    <div className="input-wrapper">
                      <Building className="input-icon" />
                      <input
                        id="agence"
                        name="agence"
                        type="text"
                        placeholder="Nom ou numéro de l'agence"
                        value={formData.agence}
                        onChange={handleInputChange}
                        className="form-input"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Colonne droite */}
                <div className="form-column">
                  <div className="form-group">
                    <label htmlFor="fonction" className="form-label">
                      Fonction *
                    </label>
                    <div className="select-wrapper">
                      <UserCog className="select-icon" />
                      <select
                        id="fonction"
                        name="fonction"
                        value={formData.fonction}
                        onChange={handleSelectChange}
                        className="form-select"
                        required
                      >
                        <option value="utilisateur">Utilisateur</option>
                        <option value="admin">Administrateur</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="password" className="form-label">
                      Mot de passe *
                    </label>
                    <div className="input-wrapper">
                      <Lock className="input-icon" />
                      <input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Minimum 6 caractères"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="form-input"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword" className="form-label">
                      Confirmer le mot de passe *
                    </label>
                    <div className="input-wrapper">
                      <KeyRound className="input-icon" />
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="Répétez le mot de passe"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="form-input"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="btn-spinner"></div>
                      Inscription en cours...
                    </>
                  ) : (
                    "Créer le compte"
                  )}
                </button>
                <button type="button" onClick={handleGoBack} className="btn-cancel">
                  Annuler
                </button>
              </div>
            </form>

           
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register

"use client"

import { useState, useEffect } from "react"
import { Search, Plus, Trash, Save, AlertCircle, RefreshCw, X, CheckCircle, AlertTriangle } from "lucide-react"
import "./css/ImDispatche.css"
import { getImmobiliers } from "../../../services/immobilierServices"
import { getAgences } from "../../../services/agenceServices"
import { getBienAgences, createBienAgence, deleteBienAgence } from "../../../services/bienAgenceServices"
import { useMockData } from "../../../../app/MockDataProvider"

function ImDispatche() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [immobiliers, setImmobiliers] = useState([])
  const [agences, setAgences] = useState([])
  const [affectations, setAffectations] = useState([])

  const [filtreImmobilier, setFiltreImmobilier] = useState("")
  const [filtreAgence, setFiltreAgence] = useState("")

  const [modalOuvert, setModalOuvert] = useState(false)
  const [nouvelleAffectation, setNouvelleAffectation] = useState({
    idBien: "",
    idAgence: "",
    dateAffectation: new Date().toISOString().split("T")[0],
  })

  // État pour gérer les toasts
  const [toasts, setToasts] = useState([])

  const { useMockData: useMock, mockData, apiStatus, toggleMockData } = useMockData()

  useEffect(() => {
    chargerDonnees()
  }, [])

  const chargerDonnees = async () => {
    setLoading(true)
    setError(null)

    if (useMock) {
      console.log("Utilisation des données mockées pour ImDispatche")
      setImmobiliers(mockData.immobiliers)
      setAgences(mockData.agences)
      setAffectations(mockData.affectations)
      setLoading(false)
      return
    }

    try {
      const immobiliersRes = await getImmobiliers()
      let immobiliersData = immobiliersRes.data

      if (immobiliersRes.data && typeof immobiliersRes.data === "object" && "$values" in immobiliersRes.data) {
        immobiliersData = immobiliersRes.data.$values
      }

      if (!Array.isArray(immobiliersData)) {
        console.warn("Les données immobiliers reçues ne sont pas un tableau:", immobiliersData)
        immobiliersData = []
      }

      setImmobiliers(immobiliersData)

      const agencesRes = await getAgences()
      let agencesData = agencesRes.data

      if (agencesRes.data && typeof agencesRes.data === "object" && "$values" in agencesRes.data) {
        agencesData = agencesRes.data.$values
      }

      if (!Array.isArray(agencesData)) {
        console.warn("Les données agences reçues ne sont pas un tableau:", agencesData)
        agencesData = []
      }

      setAgences(agencesData)

      const affectationsRes = await getBienAgences()
      let affectationsData = affectationsRes.data

      if (affectationsRes.data && typeof affectationsRes.data === "object" && "$values" in affectationsRes.data) {
        affectationsData = affectationsRes.data.$values
      }

      if (!Array.isArray(affectationsData)) {
        console.warn("Les données affectations reçues ne sont pas un tableau:", affectationsData)
        affectationsData = []
      }

      setAffectations(affectationsData)
    } catch (err) {
      console.error("Erreur lors du chargement des données:", err)
      setError(`Impossible de charger les données: ${err.message}`)

      if (!useMock) {
        console.log("Basculement vers les données mockées après échec de l'API")
        setImmobiliers(mockData.immobiliers)
        setAgences(mockData.agences)
        setAffectations(mockData.affectations)
      }
    } finally {
      setLoading(false)
    }
  }

  // Fonction pour afficher un toast
  const afficherToast = (message, type) => {
    const id = Date.now()
    const nouveauToast = {
      id,
      message,
      type,
    }

    setToasts((prev) => [...prev, nouveauToast])

    // Supprimer le toast après 5 secondes
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 5000)
  }

  // Fonction pour afficher une boîte de dialogue de confirmation moderne
  const afficherConfirmation = (message, onConfirm) => {
    const confirmationId = Date.now()
    const confirmation = {
      id: confirmationId,
      message,
      onConfirm,
      onCancel: () => {
        setToasts((prev) => prev.filter((t) => t.id !== confirmationId))
      },
    }

    setToasts((prev) => [...prev, { ...confirmation, type: "confirmation" }])
  }

  // Supprimer un toast spécifique
  const supprimerToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const ouvrirModal = () => {
    setNouvelleAffectation({
      idBien: "",
      idAgence: "",
      dateAffectation: new Date().toISOString().split("T")[0],
    })
    setModalOuvert(true)
  }

  const fermerModal = () => {
    setModalOuvert(false)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNouvelleAffectation({
      ...nouvelleAffectation,
      [name]: value,
    })
  }

  const sauvegarderAffectation = async () => {
    if (!nouvelleAffectation.idBien || !nouvelleAffectation.idAgence) {
      afficherToast("Veuillez sélectionner un bien et une agence", "erreur")
      return
    }

    setLoading(true)
    try {
      if (useMock) {
        const nouvelleAff = {
          idBien: Number.parseInt(nouvelleAffectation.idBien, 10),
          idAgence: Number.parseInt(nouvelleAffectation.idAgence, 10),
          dateAffectation: nouvelleAffectation.dateAffectation,
        }

        setAffectations((prev) => [...prev, nouvelleAff])
        afficherToast("Affectation créée avec succès (mode démo)!", "succes")
        fermerModal()
      } else {
        await createBienAgence({
          idBien: Number.parseInt(nouvelleAffectation.idBien, 10),
          idAgence: Number.parseInt(nouvelleAffectation.idAgence, 10),
          dateAffectation: nouvelleAffectation.dateAffectation,
        })

        afficherToast("Affectation créée avec succès!", "succes")
        fermerModal()
        chargerDonnees()
      }
    } catch (err) {
      console.error("Erreur lors de la création de l'affectation:", err)
      afficherToast("Erreur lors de la création de l'affectation", "erreur")
    } finally {
      setLoading(false)
    }
  }

  const supprimerAffectation = (idBien, idAgence, dateAffectation) => {
    afficherConfirmation("Êtes-vous sûr de vouloir supprimer cette affectation ?", async () => {
      setLoading(true)
      try {
        if (useMock) {
          setAffectations((prev) =>
            prev.filter(
              (aff) => !(aff.idBien === idBien && aff.idAgence === idAgence && aff.dateAffectation === dateAffectation),
            ),
          )
          afficherToast("Affectation supprimée avec succès (mode démo)!", "succes")
        } else {
          await deleteBienAgence(idBien, idAgence, new Date(dateAffectation))
          afficherToast("Affectation supprimée avec succès!", "succes")
          chargerDonnees()
        }
      } catch (err) {
        console.error("Erreur lors de la suppression de l'affectation:", err)
        afficherToast("Erreur lors de la suppression de l'affectation", "erreur")
      } finally {
        setLoading(false)
      }
    })
  }

  const getNomBien = (idBien) => {
    const bien = immobiliers.find((b) => b.idBien === idBien)
    return bien ? bien.nomBien : `Bien #${idBien}`
  }

  const getNomAgence = (idAgence) => {
    const agence = agences.find((a) => a.id === idAgence)
    return agence ? agence.nom : `Agence #${idAgence}`
  }

  const affectationsFiltrees = affectations.filter((aff) => {
    const bienNom = getNomBien(aff.idBien).toLowerCase()
    const agenceNom = getNomAgence(aff.idAgence).toLowerCase()

    return bienNom.includes(filtreImmobilier.toLowerCase()) && agenceNom.includes(filtreAgence.toLowerCase())
  })

  return (
    <div className="page-dispatche animation-dispatche">
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Chargement en cours...</p>
        </div>
      )}

      <h1 className="titre-page">Gestion des Affectations d'Immobiliers</h1>

      {apiStatus !== "available" && (
        <div className="api-status-warning">
          <AlertCircle size={20} />
          <span>
            {apiStatus === "checking"
              ? "Vérification de la connexion à l'API..."
              : "Mode hors ligne: utilisation de données de démonstration. L'API n'est pas accessible."}
          </span>
          <button onClick={toggleMockData}>{useMock ? "Essayer l'API" : "Utiliser les données de démo"}</button>
        </div>
      )}

      {error && (
        <div className="error-message">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={chargerDonnees}>
            <RefreshCw size={16} /> Réessayer
          </button>
        </div>
      )}

      {/* Section Affectations */}
      <div className="section-dispatche">
        <div className="entete-section">
          <h2>Liste des Affectations</h2>
          <div className="actions-entete">
            <div className="champ-recherche-wrapper">
              <Search size={18} className="icone-recherche" />
              <input
                type="text"
                placeholder="Filtrer par bien..."
                value={filtreImmobilier}
                onChange={(e) => setFiltreImmobilier(e.target.value)}
                className="champ-filtre"
              />
            </div>
            <div className="champ-recherche-wrapper">
              <Search size={18} className="icone-recherche" />
              <input
                type="text"
                placeholder="Filtrer par agence..."
                value={filtreAgence}
                onChange={(e) => setFiltreAgence(e.target.value)}
                className="champ-filtre"
              />
            </div>
            <button className="bouton-ajouter" onClick={ouvrirModal}>
              <Plus size={16} /> Ajouter une affectation
            </button>
          </div>
        </div>

        <div className="tableau-dispatche-wrapper">
          <div className="tableau-dispatche">
            <table>
              <thead>
                <tr>
                  <th>Bien</th>
                  <th>Agence</th>
                  <th>Date d'affectation</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {affectationsFiltrees.length > 0 ? (
                  affectationsFiltrees.map((aff, index) => (
                    <tr key={`${aff.idBien}-${aff.idAgence}-${aff.dateAffectation}`}>
                      <td>{getNomBien(aff.idBien)}</td>
                      0<td>{getNomAgence(aff.idAgence)}</td>
                      <td>{new Date(aff.dateAffectation).toLocaleDateString()}</td>
                      <td className="actions-cellule">
                        <button
                          className="bouton-supprimer"
                          onClick={() => supprimerAffectation(aff.idBien, aff.idAgence, aff.dateAffectation)}
                        >
                          <Trash size={14} /> Supprimer
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="no-data">
                      {loading
                        ? "Chargement..."
                        : 'Aucune affectation trouvée. Utilisez le bouton "Ajouter" pour en créer une.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal pour ajouter une affectation */}
      {modalOuvert && (
        <div className="modal-overlay">
          <div className="modal-contenu">
            <h2>Ajouter une affectation</h2>

            <div className="formulaire-modal">
              <div className="groupe-champ">
                <label htmlFor="idBien">Bien immobilier</label>
                <select
                  id="idBien"
                  name="idBien"
                  value={nouvelleAffectation.idBien}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">-- Sélectionner un bien --</option>
                  {immobiliers.map((bien) => (
                    <option key={bien.idBien} value={bien.idBien}>
                      {bien.nomBien || `Bien #${bien.idBien}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="groupe-champ">
                <label htmlFor="idAgence">Agence</label>
                <select
                  id="idAgence"
                  name="idAgence"
                  value={nouvelleAffectation.idAgence}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">-- Sélectionner une agence --</option>
                  {agences.map((agence) => (
                    <option key={agence.id} value={agence.id}>
                      {agence.nom || `Agence #${agence.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="groupe-champ">
                <label htmlFor="dateAffectation">Date d'affectation</label>
                <input
                  id="dateAffectation"
                  name="dateAffectation"
                  type="date"
                  value={nouvelleAffectation.dateAffectation}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="actions-modal">
                <button className="bouton-annuler" onClick={fermerModal}>
                  Annuler
                </button>
                <button
                  className="bouton-sauvegarder"
                  onClick={sauvegarderAffectation}
                  disabled={!nouvelleAffectation.idBien || !nouvelleAffectation.idAgence}
                >
                  <Save size={16} /> Sauvegarder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Système de toast notifications */}
      <div className="toast-container">
        {toasts.map((toast) =>
          toast.type === "confirmation" ? (
            <div key={toast.id} className="toast toast-confirmation">
              <div className="toast-icon">
                <AlertTriangle size={20} />
              </div>
              <div className="toast-content">
                <p>{toast.message}</p>
                <div className="toast-actions">
                  <button
                    onClick={() => {
                      toast.onConfirm()
                      supprimerToast(toast.id)
                    }}
                    className="toast-btn confirm"
                  >
                    Confirmer
                  </button>
                  <button
                    onClick={() => {
                      toast.onCancel()
                      supprimerToast(toast.id)
                    }}
                    className="toast-btn cancel"
                  >
                    Annuler
                  </button>
                </div>
              </div>
              <button onClick={() => supprimerToast(toast.id)} className="toast-close">
                <X size={16} />
              </button>
            </div>
          ) : (
            <div key={toast.id} className={`toast toast-${toast.type}`}>
              <div className="toast-icon">
                {toast.type === "succes" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              </div>
              <div className="toast-content">
                <p>{toast.message}</p>
              </div>
              <button onClick={() => supprimerToast(toast.id)} className="toast-close">
                <X size={16} />
              </button>
            </div>
          ),
        )}
      </div>
    </div>
  )
}

export default ImDispatche

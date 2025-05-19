"use client"

import { useState, useEffect } from "react"
import { Search, Plus, Trash, Save, AlertCircle, RefreshCw } from "lucide-react"
import "./css/ImDispatche.css"
import { getImmobiliers } from "../../../services/immobilierServices"
import { getAgences } from "../../../services/agenceServices"
import { getBienAgences, createBienAgence, deleteBienAgence } from "../../../services/bienAgenceServices"
import { useMockData } from "../../../../app/MockDataProvider"

function ImDispatche() {
  // État pour le chargement et les erreurs
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // État pour les données
  const [immobiliers, setImmobiliers] = useState([])
  const [agences, setAgences] = useState([])
  const [affectations, setAffectations] = useState([])

  // État pour les filtres
  const [filtreImmobilier, setFiltreImmobilier] = useState("")
  const [filtreAgence, setFiltreAgence] = useState("")

  // État pour le modal
  const [modalOuvert, setModalOuvert] = useState(false)
  const [nouvelleAffectation, setNouvelleAffectation] = useState({
    idBien: "",
    idAgence: "",
    dateAffectation: new Date().toISOString().split("T")[0],
  })

  // Récupérer le contexte des données mockées
  const { useMockData: useMock, mockData, apiStatus, toggleMockData } = useMockData()

  // Charger les données au démarrage
  useEffect(() => {
    chargerDonnees()
  }, [])

  // Fonction pour charger toutes les données
  const chargerDonnees = async () => {
    setLoading(true)
    setError(null)

    // Si nous utilisons des données mockées, utilisez-les directement
    if (useMock) {
      console.log("Utilisation des données mockées pour ImDispatche")
      setImmobiliers(mockData.immobiliers)
      setAgences(mockData.agences)
      setAffectations(mockData.affectations)
      setLoading(false)
      return
    }

    try {
      // Charger les immobiliers
      try {
        const immobiliersRes = await getImmobiliers()
        console.log("Données immobiliers brutes:", immobiliersRes.data)

        // Déterminer le format des données
        let immobiliersData = immobiliersRes.data

        // Vérifier si les données sont dans un format spécifique (comme $values)
        if (immobiliersRes.data && typeof immobiliersRes.data === "object" && "$values" in immobiliersRes.data) {
          immobiliersData = immobiliersRes.data.$values
        }

        // S'assurer que immobiliersData est un tableau
        if (!Array.isArray(immobiliersData)) {
          console.warn("Les données immobiliers reçues ne sont pas un tableau:", immobiliersData)
          immobiliersData = []
        }

        setImmobiliers(immobiliersData)
      } catch (error) {
        console.error("Erreur lors du chargement des immobiliers:", error)
        throw new Error(`Erreur lors du chargement des immobiliers: ${error.message}`)
      }

      // Charger les agences
      try {
        const agencesRes = await getAgences()
        console.log("Données agences brutes:", agencesRes.data)

        // Déterminer le format des données
        let agencesData = agencesRes.data

        // Vérifier si les données sont dans un format spécifique (comme $values)
        if (agencesRes.data && typeof agencesRes.data === "object" && "$values" in agencesRes.data) {
          agencesData = agencesRes.data.$values
        }

        // S'assurer que agencesData est un tableau
        if (!Array.isArray(agencesData)) {
          console.warn("Les données agences reçues ne sont pas un tableau:", agencesData)
          agencesData = []
        }

        setAgences(agencesData)
      } catch (error) {
        console.error("Erreur lors du chargement des agences:", error)
        throw new Error(`Erreur lors du chargement des agences: ${error.message}`)
      }

      // Charger les affectations
      try {
        const affectationsRes = await getBienAgences()
        console.log("Données affectations brutes:", affectationsRes.data)

        // Déterminer le format des données
        let affectationsData = affectationsRes.data

        // Vérifier si les données sont dans un format spécifique (comme $values)
        if (affectationsRes.data && typeof affectationsRes.data === "object" && "$values" in affectationsRes.data) {
          affectationsData = affectationsRes.data.$values
        }

        // S'assurer que affectationsData est un tableau
        if (!Array.isArray(affectationsData)) {
          console.warn("Les données affectations reçues ne sont pas un tableau:", affectationsData)
          affectationsData = []
        }

        setAffectations(affectationsData)
      } catch (error) {
        console.error("Erreur lors du chargement des affectations:", error)
        throw new Error(`Erreur lors du chargement des affectations: ${error.message}`)
      }
    } catch (err) {
      console.error("Erreur lors du chargement des données:", err)
      setError(`Impossible de charger les données: ${err.message}`)

      // Si l'API échoue, basculez vers les données mockées
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

  // Fonction pour afficher un message
  const afficherMessage = (texte, type) => {
    const messageElement = document.createElement("div")
    messageElement.className = `alerte-flottante alerte-${type}`
    messageElement.innerHTML = `
      <div class="icone-alerte">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      </div>
      <div class="texte-alerte">${texte}</div>
      <button class="fermer-alerte">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `

    document.body.appendChild(messageElement)

    // Ajouter l'animation d'entrée
    setTimeout(() => {
      messageElement.classList.add("visible")
    }, 10)

    // Ajouter l'événement pour fermer l'alerte
    const boutonFermer = messageElement.querySelector(".fermer-alerte")
    if (boutonFermer) {
      boutonFermer.addEventListener("click", () => {
        messageElement.classList.remove("visible")
        messageElement.classList.add("disparition")
        setTimeout(() => {
          if (messageElement.parentNode) {
            messageElement.parentNode.removeChild(messageElement)
          }
        }, 300)
      })
    }

    // Supprimer l'alerte après 5 secondes
    setTimeout(() => {
      if (messageElement.parentNode) {
        messageElement.classList.remove("visible")
        messageElement.classList.add("disparition")
        setTimeout(() => {
          if (messageElement.parentNode) {
            messageElement.parentNode.removeChild(messageElement)
          }
        }, 300)
      }
    }, 5000)
  }

  // Ouvrir le modal pour ajouter une nouvelle affectation
  const ouvrirModal = () => {
    setNouvelleAffectation({
      idBien: "",
      idAgence: "",
      dateAffectation: new Date().toISOString().split("T")[0],
    })
    setModalOuvert(true)
  }

  // Fermer le modal
  const fermerModal = () => {
    setModalOuvert(false)
  }

  // Mettre à jour les champs du formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNouvelleAffectation({
      ...nouvelleAffectation,
      [name]: value,
    })
  }

  // Ajouter une nouvelle affectation
  const sauvegarderAffectation = async () => {
    if (!nouvelleAffectation.idBien || !nouvelleAffectation.idAgence) {
      afficherMessage("Veuillez sélectionner un bien et une agence", "erreur")
      return
    }

    setLoading(true)
    try {
      if (useMock) {
        // Simuler l'ajout d'une affectation en mode mock
        const nouvelleAff = {
          idBien: Number.parseInt(nouvelleAffectation.idBien, 10),
          idAgence: Number.parseInt(nouvelleAffectation.idAgence, 10),
          dateAffectation: nouvelleAffectation.dateAffectation,
        }

        setAffectations((prev) => [...prev, nouvelleAff])
        afficherMessage("Affectation créée avec succès (mode démo)!", "succes")
        fermerModal()
      } else {
        await createBienAgence({
          idBien: Number.parseInt(nouvelleAffectation.idBien, 10),
          idAgence: Number.parseInt(nouvelleAffectation.idAgence, 10),
          dateAffectation: nouvelleAffectation.dateAffectation,
        })

        afficherMessage("Affectation créée avec succès!", "succes")
        fermerModal()
        chargerDonnees()
      }
    } catch (err) {
      console.error("Erreur lors de la création de l'affectation:", err)
      afficherMessage("Erreur lors de la création de l'affectation", "erreur")
    } finally {
      setLoading(false)
    }
  }

  // Supprimer une affectation
  const supprimerAffectation = async (idBien, idAgence, dateAffectation) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette affectation ?")) return

    setLoading(true)
    try {
      if (useMock) {
        // Simuler la suppression d'une affectation en mode mock
        setAffectations((prev) =>
          prev.filter(
            (aff) => !(aff.idBien === idBien && aff.idAgence === idAgence && aff.dateAffectation === dateAffectation),
          ),
        )
        afficherMessage("Affectation supprimée avec succès (mode démo)!", "succes")
      } else {
        await deleteBienAgence(idBien, idAgence, new Date(dateAffectation))
        afficherMessage("Affectation supprimée avec succès!", "succes")
        chargerDonnees()
      }
    } catch (err) {
      console.error("Erreur lors de la suppression de l'affectation:", err)
      afficherMessage("Erreur lors de la suppression de l'affectation", "erreur")
    } finally {
      setLoading(false)
    }
  }

  // Obtenir le nom d'un bien par son ID
  const getNomBien = (idBien) => {
    const bien = immobiliers.find((b) => b.idBien === idBien)
    return bien ? bien.nomBien : `Bien #${idBien}`
  }

  // Obtenir le nom d'une agence par son ID
  const getNomAgence = (idAgence) => {
    const agence = agences.find((a) => a.id === idAgence)
    return agence ? agence.nom : `Agence #${idAgence}`
  }

  // Filtrer les affectations
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
                      <td>{getNomAgence(aff.idAgence)}</td>
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
    </div>
  )
}

export default ImDispatche

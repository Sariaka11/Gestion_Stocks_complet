"use client"

import { useState, useEffect } from "react"
import { Search, FileDown, RefreshCw, AlertCircle, Edit, Trash2, X, CheckCircle, AlertTriangle } from "lucide-react"
import "./css/ImInventaire.css"
import { getImmobiliers } from "../../../services/immobilierServices"
import { getAmortissements } from "../../../services/amortissementServices"
import { getBienAgences } from "../../../services/bienAgenceServices"
import { useMockData } from "../../../../app/MockDataProvider"

function ImInventaire() {
  const [filtreDesignation, setFiltreDesignation] = useState("")
  const [filtreMois, setFiltreMois] = useState("")
  const [filtreAnnee, setFiltreAnnee] = useState("")
  const [filtreStatut, setFiltreStatut] = useState("")
  const [showHistorique, setShowHistorique] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [inventaireData, setInventaireData] = useState([])

  // État pour gérer les toasts
  const [toasts, setToasts] = useState([])

  // Récupérer le contexte des données mockées
  const { useMockData: useMock, mockData, apiStatus, toggleMockData } = useMockData()

  // Générer les options pour les années
  const genererOptionsAnnees = () => {
    const anneeActuelle = new Date().getFullYear()
    const annees = []
    for (let i = anneeActuelle - 5; i <= anneeActuelle; i++) {
      annees.push(i)
    }
    return annees.reverse()
  }

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
      console.log("Utilisation des données mockées pour ImInventaire")

      // Transformer les données mockées pour l'inventaire
      const inventaireItems = mockData.immobiliers.map((item) => {
        // Trouver les amortissements associés à cet immobilier
        const amortissementsBien = mockData.amortissements.filter((a) => a.idBien === item.idBien)

        // Trouver les affectations associées à cet immobilier
        const affectationsBien = mockData.affectations.filter((a) => a.idBien === item.idBien)

        // Déterminer le statut d'amortissement
        const estAmorti = amortissementsBien.some((a) => a.valeurResiduelle === 0)

        return {
          id: item.idBien,
          codeArticle: `IMM-${String(item.idBien).padStart(3, "0")}`,
          designation: item.nomBien || "",
          codeBarre: item.codeBarre || "0000000000000",
          prixAchat: item.valeurAcquisition || 0,
          typeImmobilier:
            item.categorie?.nomCategorie ||
            mockData.categories.find((c) => c.idCategorie === item.idCategorie)?.nomCategorie ||
            "Non catégorisé",
          dateAcquisition: item.dateAcquisition?.split("T")[0] || "",
          quantite: item.quantite || 1,
          statut: estAmorti ? "amorti" : item.statut || "actif",
          affectations: affectationsBien,
        }
      })

      setInventaireData(inventaireItems)
      setLoading(false)
      return
    }

    try {
      // Charger les immobiliers
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

      // Charger les amortissements
      const amortissementsRes = await getAmortissements()
      console.log("Données amortissements brutes:", amortissementsRes.data)

      // Déterminer le format des données
      let amortissementsData = amortissementsRes.data

      // Vérifier si les données sont dans un format spécifique (comme $values)
      if (amortissementsRes.data && typeof amortissementsRes.data === "object" && "$values" in amortissementsRes.data) {
        amortissementsData = amortissementsRes.data.$values
      }

      // S'assurer que amortissementsData est un tableau
      if (!Array.isArray(amortissementsData)) {
        console.warn("Les données amortissements reçues ne sont pas un tableau:", amortissementsData)
        amortissementsData = []
      }

      // Charger les affectations
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

      // Transformer les données pour l'inventaire
      const inventaireItems = immobiliersData.map((item) => {
        // Trouver les amortissements associés à cet immobilier
        const amortissementsBien = amortissementsData.filter((a) => a.idBien === item.idBien)

        // Trouver les affectations associées à cet immobilier
        const affectationsBien = affectationsData.filter((a) => a.idBien === item.idBien)

        // Déterminer le statut d'amortissement
        const estAmorti = amortissementsBien.some((a) => a.valeurResiduelle === 0)

        return {
          id: item.idBien,
          codeArticle: `IMM-${String(item.idBien).padStart(3, "0")}`,
          designation: item.nomBien || "",
          codeBarre: item.codeBarre || "0000000000000",
          prixAchat: item.valeurAcquisition || 0,
          typeImmobilier: item.categorie?.nomCategorie || "Non catégorisé",
          dateAcquisition: item.dateAcquisition?.split("T")[0] || "",
          quantite: item.quantite || 1,
          statut: estAmorti ? "amorti" : item.statut || "actif",
          affectations: affectationsBien,
        }
      })

      setInventaireData(inventaireItems)
    } catch (err) {
      console.error("Erreur lors du chargement des données:", err)
      setError("Impossible de charger les données. Veuillez réessayer plus tard.")

      // Si l'API échoue, basculez vers les données mockées
      if (!useMock) {
        console.log("Basculement vers les données mockées après échec de l'API")

        // Transformer les données mockées pour l'inventaire
        const inventaireItems = mockData.immobiliers.map((item) => {
          // Trouver les amortissements associés à cet immobilier
          const amortissementsBien = mockData.amortissements.filter((a) => a.idBien === item.idBien)

          // Trouver les affectations associées à cet immobilier
          const affectationsBien = mockData.affectations.filter((a) => a.idBien === item.idBien)

          // Déterminer le statut d'amortissement
          const estAmorti = amortissementsBien.some((a) => a.valeurResiduelle === 0)

          return {
            id: item.idBien,
            codeArticle: `IMM-${String(item.idBien).padStart(3, "0")}`,
            designation: item.nomBien || "",
            codeBarre: item.codeBarre || "0000000000000",
            prixAchat: item.valeurAcquisition || 0,
            typeImmobilier:
              item.categorie?.nomCategorie ||
              mockData.categories.find((c) => c.idCategorie === item.idCategorie)?.nomCategorie ||
              "Non catégorisé",
            dateAcquisition: item.dateAcquisition?.split("T")[0] || "",
            quantite: item.quantite || 1,
            statut: estAmorti ? "amorti" : item.statut || "actif",
            affectations: affectationsBien,
          }
        })

        setInventaireData(inventaireItems)
      }
    } finally {
      setLoading(false)
    }
  }

  // Fonction pour exporter en Excel
  const exporterEnExcel = () => {
    afficherToast("Exportation en Excel initiée. Cette fonctionnalité sera implémentée ultérieurement.", "info")
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

  // Filtrer les données d'inventaire
  const filteredInventaire = inventaireData.filter((item) => {
    const matchDesignation = (item.designation || "").toLowerCase().includes(filtreDesignation.toLowerCase())
    const matchStatut = filtreStatut === "" || item.statut === filtreStatut

    // Filtrer par mois si spécifié
    let matchMois = true
    if (filtreMois !== "") {
      const moisAcquisition = new Date(item.dateAcquisition).getMonth() + 1
      matchMois = moisAcquisition.toString() === filtreMois
    }

    // Filtrer par année si spécifiée
    let matchAnnee = true
    if (filtreAnnee !== "") {
      const anneeAcquisition = new Date(item.dateAcquisition).getFullYear().toString()
      matchAnnee = anneeAcquisition === filtreAnnee
    }

    return matchDesignation && matchStatut && matchMois && matchAnnee
  })

  return (
    <div className="inventaire-container">
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Chargement en cours...</p>
        </div>
      )}

      <div className="inventaire-header">
        <h2>Inventaire des immobiliers</h2>
        <div className="inventaire-actions">
          <button className="btn-hist" onClick={() => setShowHistorique(!showHistorique)}>
            {showHistorique ? "Masquer l'historique" : "Historique"}
          </button>
          <button className="btn-exp" onClick={exporterEnExcel}>
            <FileDown size={16} /> Exporter
          </button>
        </div>
      </div>

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

      {showHistorique ? (
        <div className="historique-inventaires">
          <h3>Historique des inventaires</h3>
          <table className="table-historique">
            <thead>
              <tr>
                <th>Date</th>
                <th>Précision</th>
                <th>Écarts détectés</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="4" className="no-data">
                  Aucun historique disponible
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <div className="filtres-section">
            <div className="filtre-groupe">
              <div className="champ-recherche-wrapper">
                <Search size={18} className="icone-recherche" />
                <input
                  type="text"
                  placeholder="Rechercher par désignation..."
                  value={filtreDesignation}
                  onChange={(e) => setFiltreDesignation(e.target.value)}
                  className="champ-filtre"
                />
              </div>
            </div>

            <div className="filtre-groupe">
              <div className="select-wrapper">
                <label htmlFor="filtreStatut">Statut:</label>
                <select
                  id="filtreStatut"
                  value={filtreStatut}
                  onChange={(e) => setFiltreStatut(e.target.value)}
                  className="select-filtre"
                >
                  <option value="">Tous</option>
                  <option value="actif">Actif</option>
                  <option value="amorti">Amorti</option>
                </select>
              </div>
            </div>

            <div className="filtre-groupe">
              <div className="select-wrapper">
                <label htmlFor="filtreMois">Mois:</label>
                <select
                  id="filtreMois"
                  value={filtreMois}
                  onChange={(e) => setFiltreMois(e.target.value)}
                  className="select-filtre"
                >
                  <option value="">Tous</option>
                  <option value="1">Janvier</option>
                  <option value="2">Février</option>
                  <option value="3">Mars</option>
                  <option value="4">Avril</option>
                  <option value="5">Mai</option>
                  <option value="6">Juin</option>
                  <option value="7">Juillet</option>
                  <option value="8">Août</option>
                  <option value="9">Septembre</option>
                  <option value="10">Octobre</option>
                  <option value="11">Novembre</option>
                  <option value="12">Décembre</option>
                </select>
              </div>
            </div>

            <div className="filtre-groupe">
              <div className="select-wrapper">
                <label htmlFor="filtreAnnee">Année:</label>
                <select
                  id="filtreAnnee"
                  value={filtreAnnee}
                  onChange={(e) => setFiltreAnnee(e.target.value)}
                  className="select-filtre"
                >
                  <option value="">Toutes</option>
                  {genererOptionsAnnees().map((annee) => (
                    <option key={annee} value={annee.toString()}>
                      {annee}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="tableau-container">
            <table className="tableau-inventaire">
              <thead>
                <tr>
                  <th>Code Article</th>
                  <th>Désignation</th>
                  <th>Code Barre</th>
                  <th>Prix d'achat</th>
                  <th>Type d'immobilier</th>
                  <th>Date d'acquisition</th>
                  <th>Quantité</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventaire.length > 0 ? (
                  filteredInventaire.map((item) => (
                    <tr key={item.id}>
                      <td>{item.codeArticle}</td>
                      <td>{item.designation}</td>
                      <td>{item.codeBarre}</td>
                      <td>{item.prixAchat.toLocaleString()} Ar</td>
                      <td>{item.typeImmobilier}</td>
                      <td>{item.dateAcquisition}</td>
                      <td>{item.quantite}</td>
                      <td>
                        <span className={`statut-badge ${item.statut}`}>
                          {item.statut === "actif" ? "Actif" : "Amorti"}
                        </span>
                      </td>
                      <td>
                        <div className="actions-cell">
                          <button className="btn-action btn-edit" title="Modifier">
                            <Edit size={16} />
                          </button>
                          <button className="btn-action btn-delete" title="Supprimer">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="no-data">
                      {loading
                        ? "Chargement..."
                        : 'Aucun article trouvé. Utilisez la page "Stock" pour ajouter des articles.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
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
                {toast.type === "succes" ? (
                  <CheckCircle size={20} />
                ) : toast.type === "info" ? (
                  <AlertCircle size={20} className="info-icon" />
                ) : (
                  <AlertCircle size={20} />
                )}
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

export default ImInventaire

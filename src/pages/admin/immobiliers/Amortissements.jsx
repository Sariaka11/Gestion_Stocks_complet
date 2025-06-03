"use client"

import { useState, useEffect } from "react"
import { Search, Filter, FileDown, Calculator, RefreshCw, AlertCircle } from "lucide-react"
import "./css/Amortissements.css"
import { getImmobiliers } from "../../../services/immobilierServices"
import { getAmortissements, calculerTableauAmortissement } from "../../../services/amortissementServices"
import { useMockData } from "../../../../app/MockDataProvider"

function Amortissements() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filtreDesignation, setFiltreDesignation] = useState("")
  const [filtreType, setFiltreType] = useState("")
  const [modalOuvert, setModalOuvert] = useState(false)
  const [immobilierSelectionne, setImmobilierSelectionne] = useState(null)
  const [immobiliers, setImmobiliers] = useState([])
  const [amortissements, setAmortissements] = useState([])

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
        
        // Transformer les données pour l'affichage
        const immobiliersTransformes = immobiliersData.map((item) => ({
          id: item.idBien,
          codeArticle: `IMM-${String(item.idBien).padStart(3, "0")}`,
          designation: item.nomBien || "",
          typeImmobilier: item.categorie?.nomCategorie || "Non catégorisé",
          dateAcquisition: item.dateAcquisition?.split("T")[0] || "",
          prixAchat: item.valeurAcquisition || 0,
          dureeAmortissement: item.categorie?.dureeAmortissement || Math.ceil(100 / (item.tauxAmortissement || 1)),
          tauxAmortissement: item.tauxAmortissement || 0,
          statut: item.statut || "actif",
          valeurNetteComptable: item.valeurNetteComptable || 0,
          amortissementCumule: item.amortissementCumule || 0,
          // Utiliser les amortissements déjà présents dans la réponse API
          amortissements: item.amortissements ? item.amortissements.map(amort => ({
            annee: amort.annee,
            baseAmortissable: item.valeurAcquisition,
            dotation: amort.montant,
            valeurNetteComptable: amort.valeurResiduelle,
          })) : [],
        }))

        console.log("Données immobiliers transformées:", immobiliersTransformes)

        // Pour chaque immobilier, si pas d'amortissements dans l'API, calculer le tableau théorique
        const immobiliersAvecAmortissements = immobiliersTransformes.map((immobilier) => {
          if (immobilier.amortissements.length === 0) {
            // Calculer un tableau d'amortissement théorique
            const tableauAmortissement = calculerTableauAmortissement(immobilier)
            return {
              ...immobilier,
              amortissements: tableauAmortissement,
            }
          }
          return immobilier
        })

        setImmobiliers(immobiliersAvecAmortissements)

      } catch (error) {
        console.error("Erreur lors du chargement des immobiliers:", error)
        throw new Error(`Erreur lors du chargement des immobiliers: ${error.message}`)
      }

      // Charger les amortissements supplémentaires si nécessaire
      try {
        const amortissementsRes = await getAmortissements()
        
        // Déterminer le format des données
        let amortissementsData = amortissementsRes.data

        // Vérifier si les données sont dans un format spécifique (comme $values)
        if (
          amortissementsRes.data &&
          typeof amortissementsRes.data === "object" &&
          "$values" in amortissementsRes.data
        ) {
          amortissementsData = amortissementsRes.data.$values
        }

        // S'assurer que amortissementsData est un tableau
        if (!Array.isArray(amortissementsData)) {
          console.warn("Les données amortissements reçues ne sont pas un tableau:", amortissementsData)
          amortissementsData = []
        }

        setAmortissements(amortissementsData)
      } catch (error) {
        console.error("Erreur lors du chargement des amortissements:", error)
        // Ne pas faire échouer tout le processus si seuls les amortissements échouent
        console.warn("Utilisation des amortissements déjà chargés avec les immobiliers")
      }

    } catch (err) {
      console.error("Erreur lors du chargement des données:", err)
      setError("Impossible de charger les données. Veuillez réessayer plus tard.")

      // Si l'API échoue, basculez vers les données mockées
      if (!useMock) {
        console.log("Basculement vers les données mockées après échec de l'API")

        // Transformer les données mockées pour l'affichage
        const immobiliersTransformes = mockData.immobiliers.map((item) => ({
          id: item.idBien,
          codeArticle: `IMM-${String(item.idBien).padStart(3, "0")}`,
          designation: item.nomBien || "",
          typeImmobilier:
            item.categorie?.nomCategorie ||
            mockData.categories.find((c) => c.idCategorie === item.idCategorie)?.nomCategorie ||
            "Non catégorisé",
          dateAcquisition: item.dateAcquisition?.split("T")[0] || "",
          prixAchat: item.valeurAcquisition || 0,
          dureeAmortissement:
            item.categorie?.dureeAmortissement ||
            mockData.categories.find((c) => c.idCategorie === item.idCategorie)?.dureeAmortissement ||
            Math.ceil(100 / (item.tauxAmortissement || 1)),
          tauxAmortissement: item.tauxAmortissement || 0,
          statut: item.statut || "actif",
          amortissements: [], // Sera rempli plus tard
        }))

        // Associer les amortissements aux immobiliers
        const immobiliersAvecAmortissements = immobiliersTransformes.map((immobilier) => {
          const amortissementsBien = mockData.amortissements.filter((a) => a.idBien === immobilier.id)

          // Si aucun amortissement n'existe, calculer un tableau d'amortissement théorique
          const tableauAmortissement =
            amortissementsBien.length > 0
              ? amortissementsBien.map((a) => ({
                  annee: a.annee,
                  baseAmortissable: immobilier.prixAchat,
                  dotation: a.montant,
                  valeurNetteComptable: a.valeurResiduelle,
                }))
              : calculerTableauAmortissement(immobilier)

          return {
            ...immobilier,
            amortissements: tableauAmortissement,
          }
        })

        setImmobiliers(immobiliersAvecAmortissements)
      }
    } finally {
      setLoading(false)
    }
  }

  // Ouvrir le modal de détail d'amortissement
  const ouvrirModalDetail = (immobilier) => {
    setImmobilierSelectionne(immobilier)
    setModalOuvert(true)
  }

  // Fermer le modal
  const fermerModal = () => {
    setModalOuvert(false)
    setImmobilierSelectionne(null)
  }

  // Formater le prix
  const formaterPrix = (prix) => {
    return prix.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")
  }

  // Exporter les données
  const exporterDonnees = () => {
    alert("Exportation des données initiée. Le fichier sera téléchargé dans quelques instants.")
  }

  // Filtrer les immobiliers
  const immobiliersFiltres = immobiliers.filter((item) => {
    const matchDesignation =
      (item.designation || "").toLowerCase().includes(filtreDesignation.toLowerCase()) ||
      (item.codeArticle || "").toLowerCase().includes(filtreDesignation.toLowerCase())
    const matchType = filtreType === "" || (item.typeImmobilier || "").toLowerCase() === filtreType.toLowerCase()
    return matchDesignation && matchType
  })

  return (
    <div className="amortissements-container">
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Chargement en cours...</p>
        </div>
      )}

      <h2 className="page-title">Amortissements des immobilisations</h2>

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

      <div className="amortissements-filters">
        <div className="filter-group">
          <label>
            <Search size={16} /> Recherche:
          </label>
          <input
            type="text"
            placeholder="Rechercher par désignation ou code..."
            value={filtreDesignation}
            onChange={(e) => setFiltreDesignation(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>
            <Filter size={16} /> Type:
          </label>
          <select value={filtreType} onChange={(e) => setFiltreType(e.target.value)}>
            <option value="">Tous les types</option>
            <option value="Matériel informatique">Matériel informatique</option>
            <option value="Mobilier">Mobilier</option>
            <option value="Véhicule">Véhicule</option>
            <option value="Bâtiment">Bâtiment</option>
            <option value="Équipement">Équipement</option>
          </select>
        </div>

        <button className="btn-export" onClick={exporterDonnees}>
          <FileDown size={16} /> Exporter
        </button>
      </div>

      <div className="amortissements-table-container">
        <table className="amortissements-table">
          <thead>
            <tr>
              <th>Code Article</th>
              <th>Désignation</th>
              <th>Type</th>
              <th>Date d'acquisition</th>
              <th>État d'amortissement</th>
              <th>Durée (années)</th>
              <th>Taux (%)</th>
              <th>VNC actuelle</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {immobiliersFiltres.length > 0 ? (
              immobiliersFiltres.map((item) => {
                // Utiliser la VNC directement depuis l'API ou calculer
                const vncActuelle = item.valeurNetteComptable || 0

                return (
                  <tr key={item.id}>
                    <td>{item.codeArticle}</td>
                    <td>{item.designation}</td>
                    <td>{item.typeImmobilier}</td>
                    <td>{item.dateAcquisition}</td>
                    <td>
                      <span className={`etat-amortissement ${vncActuelle === 0 ? "amorti" : "actif"}`}>
                        {vncActuelle === 0 ? "Amorti" : "Actif"}
                      </span>
                    </td>
                    <td>{item.dureeAmortissement} ans</td>
                    <td>{item.tauxAmortissement.toFixed(2)}%</td>
                    <td>{formaterPrix(vncActuelle)} Ar</td>
                    <td className="actions-cell">
                      <button className="btn-detail" onClick={() => ouvrirModalDetail(item)}>
                        <Calculator size={16} /> Détails
                      </button>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan="9" className="no-data">
                  {loading ? "Chargement..." : "Aucun immobilier trouvé pour les critères sélectionnés."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de détail d'amortissement */}
      {modalOuvert && immobilierSelectionne && (
        <div className="modal-overlay">
          <div className="modal-contenu modal-large">
            <h2>Tableau d'amortissement - {immobilierSelectionne.designation}</h2>

            <div className="amortissement-info">
              <div className="info-group">
                <span className="info-label">Code Article:</span>
                <span className="info-value">{immobilierSelectionne.codeArticle}</span>
              </div>
              <div className="info-group">
                <span className="info-label">Type:</span>
                <span className="info-value">{immobilierSelectionne.typeImmobilier}</span>
              </div>
              <div className="info-group">
                <span className="info-label">Date d'acquisition:</span>
                <span className="info-value">{immobilierSelectionne.dateAcquisition}</span>
              </div>
              <div className="info-group">
                <span className="info-label">Prix d'achat:</span>
                <span className="info-value">{formaterPrix(immobilierSelectionne.prixAchat)} Ar</span>
              </div>
              <div className="info-group">
                <span className="info-label">Durée d'amortissement:</span>
                <span className="info-value">{immobilierSelectionne.dureeAmortissement} ans</span>
              </div>
              <div className="info-group">
                <span className="info-label">Taux d'amortissement:</span>
                <span className="info-value">{immobilierSelectionne.tauxAmortissement.toFixed(2)}%</span>
              </div>
            </div>

            <div className="tableau-amortissement-container">
              <table className="tableau-amortissement">
                <thead>
                  <tr>
                    <th>Année</th>
                    <th>Base amortissable</th>
                    <th>Dotation annuelle</th>
                    <th>Valeur nette comptable</th>
                  </tr>
                </thead>
                <tbody>
                  {immobilierSelectionne.amortissements.map((amort, index) => (
                    <tr key={index}>
                      <td>{amort.annee}</td>
                      <td>{formaterPrix(amort.baseAmortissable)} Ar</td>
                      <td>{formaterPrix(amort.dotation)} Ar</td>
                      <td>{formaterPrix(amort.valeurNetteComptable)} Ar</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="actions-modal">
              <button className="bouton-fermer" onClick={fermerModal}>
                Fermer
              </button>
              {/* <button className="bouton-exporter">
                <FileDown size={16} /> Exporter
              </button> */}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Amortissements
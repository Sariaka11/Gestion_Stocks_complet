"use client"

import { useState, useEffect } from "react"
import { Search, Filter, FileDown, Calculator, RefreshCw, AlertCircle } from "lucide-react"
import "./css/Amortissements.css"
import { getImmobiliers } from "../../../services/immobilierServices"
import { getAmortissements, calculerTableauAmortissement } from "../../../services/amortissementServices"
import { useMockData } from "../../../../app/MockDataProvider"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

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
          dateFinAmortissement: item.dateFinAmortissement?.split("T")[0] || "",
          prixAchat: item.valeurAcquisition || 0,
          dureeAmortissement: item.categorie?.dureeAmortissement || 5, // Valeur par défaut si non défini
          statut: item.statut || "actif",
          valeurNetteComptable: item.valeurNetteComptable || 0,
          amortissementCumule: item.amortissementCumule || 0,
          // Utiliser les amortissements déjà présents dans la réponse API
          amortissements: item.amortissements ? item.amortissements.map(amort => ({
            annee: amort.annee,
            baseAmortissable: item.valeurAcquisition,
            dotation: amort.montant,
            valeurNetteComptable: amort.valeurResiduelle,
            amortissementCumule: item.amortissements.slice(0, item.amortissements.findIndex(a => a.annee === amort.annee) + 1)
              .reduce((sum, a) => sum + a.montant, 0),
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
              amortissements: tableauAmortissement.map(amort => ({
                ...amort,
                amortissementCumule: tableauAmortissement.slice(0, tableauAmortissement.findIndex(a => a.annee === amort.annee) + 1)
                  .reduce((sum, a) => sum + a.dotation, 0),
              })),
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
          dateFinAmortissement: item.dateFinAmortissement?.split("T")[0] || "",
          prixAchat: item.valeurAcquisition || 0,
          dureeAmortissement:
            item.categorie?.dureeAmortissement ||
            mockData.categories.find((c) => c.idCategorie === item.idCategorie)?.dureeAmortissement ||
            5, // Valeur par défaut
          statut: item.statut || "actif",
          valeurNetteComptable: item.valeurNetteComptable || 0,
          amortissementCumule: item.amortissementCumule || 0,
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
                  amortissementCumule: amortissementsBien.slice(0, amortissementsBien.findIndex(am => am.annee === a.annee) + 1)
                    .reduce((sum, am) => sum + am.montant, 0),
                }))
              : calculerTableauAmortissement(immobilier).map((a) => ({
                  ...a,
                  amortissementCumule: calculerTableauAmortissement(immobilier)
                    .slice(0, calculerTableauAmortissement(immobilier).findIndex(am => am.annee === a.annee) + 1)
                    .reduce((sum, am) => sum + am.dotation, 0),
                }))

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

  // Ouvrir le modal de détails d’amortissement
  const ouvrirModal = (immobilier) => {
    setImmobilierSelectionne(immobilier)
    setModalOuvert(true)
  }

  // Fermer le modal
  const fermerModalOuvert = () => {
    setModalOuvert(false)
    setImmobilierSelectionne(null)
  }

  // Formater le prix
  const formaterPrix = (valeur) => {
    return valeur.toLocaleString("fr-FR", { style: "currency", currency: "MGA" }).replace("MGA", "Ar")
  }

  // Exporter les données globales en PDF
  const exporterDonnees = () => {
    try {
      const doc = new jsPDF()
      
      // Ajouter un titre
      doc.setFontSize(16)
      doc.text("Amortissements des immobilisations", 14, 20)
      
      // Ajouter la date
      const today = new Date().toLocaleDateString("fr-FR")
      doc.setFontSize(12)
      doc.text(`Date d'exportation: ${today}`, 14, 30)

      // Préparer les données pour le tableau
      const tableData = immobiliersFiltres.map(item => [
        item.codeArticle,
        item.designation,
        item.typeImmobilier,
        item.dateAcquisition,
        `${item.dureeAmortissement} ans`,
        formaterPrix(item.amortissementCumule),
        formaterPrix(item.valeurNetteComptable),
        item.valeurNetteComptable === 0 ? "Amorti" : "Actif",
      ])

      // Créer le tableau avec AutoTable
      autoTable(doc,{
        startY: 40,
        head: [["Code Article", "Désignation", "Type", "Date d'acquisition", "Durée d'amortissement", "Amortissement cumulé", "Valeur nette comptable", "État"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 10 },
        bodyStyles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 40 },
          2: { cellWidth: 30 },
          3: { cellWidth: 20 },
          4: { cellWidth: 20 },
          5: { cellWidth: 25 },
          6: { cellWidth: 25 },
          7: { cellWidth: 15 },
        },
      })

      // Enregistrer le PDF
      doc.save(`amortissements_${today.replace(/\//g, "-")}.pdf`)
    } catch (error) {
      console.error("Erreur lors de l'exportation en PDF:", error)
      alert("Une erreur s'est produite lors de l'exportation. Veuillez réessayer.")
    }
  }

  // Exporter les détails de l'immobilisation sélectionnée en PDF
  const exporterDetails = () => {
    if (!immobilierSelectionne) return

    try {
      const doc = new jsPDF()

      // Ajouter un titre
      doc.setFontSize(16)
      doc.text(`Tableau d'amortissement - ${immobilierSelectionne.designation}`, 14, 20)

      // Ajouter les informations générales
      doc.setFontSize(12)
      let y = 30
      doc.text("Informations générales", 14, y)
      y += 10

      const infoData = [
        ["Code Article", immobilierSelectionne.codeArticle],
        ["Type", immobilierSelectionne.typeImmobilier],
        ["Date d'acquisition", immobilierSelectionne.dateAcquisition],
        ["Prix d'achat", formaterPrix(immobilierSelectionne.prixAchat)],
        ["Durée d'amortissement", `${immobilierSelectionne.dureeAmortissement} ans`],
        ["Date de fin d'amortissement", immobilierSelectionne.dateFinAmortissement || "Non calculée"],
        ["Taux annuel", `${(100 / immobilierSelectionne.dureeAmortissement).toFixed(2)}%`],
        ["Statut actuel", immobilierSelectionne.valeurNetteComptable === 0 ? "Amorti" : "Actif"],
      ]

      autoTable(doc, {
        startY: y,
        body: infoData,
        theme: "plain",
        styles: { fontSize: 10, cellPadding: 2 },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 }, 1: { cellWidth: 100 } },
      })

      // Ajouter le tableau d'amortissement
      y = doc.lastAutoTable.finalY + 10
      doc.setFontSize(12)
      doc.text("Tableau d'amortissement", 14, y)
      y += 10

      const tableData = immobilierSelectionne.amortissements.map(amort => [
        amort.annee,
        formaterPrix(amort.baseAmortissable),
        formaterPrix(amort.dotation),
        formaterPrix(amort.amortissementCumule),
        formaterPrix(amort.valeurNetteComptable),
      ])

      // Ajouter la ligne de total
      tableData.push([
        "Total",
        "-",
        formaterPrix(immobilierSelectionne.amortissements.reduce((sum, a) => sum + a.dotation, 0)),
        formaterPrix(immobilierSelectionne.amortissementCumule),
        formaterPrix(immobilierSelectionne.valeurNetteComptable),
      ])

      doc.autoTable({
        startY: y,
        head: [["Année", "Base amortissable", "Dotation annuelle", "Amortissement cumulé", "Valeur nette comptable"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 10 },
        bodyStyles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 35 },
          2: { cellWidth: 35 },
          3: { cellWidth: 35 },
          4: { cellWidth: 35 },
        },
      })

      // Enregistrer le PDF
      const fileName = `amortissement_${immobilierSelectionne.codeArticle}_${new Date().toLocaleDateString("fr-FR").replace(/\//g, "-")}.pdf`
      doc.save(fileName)
    } catch (error) {
      console.error("Erreur lors de l'exportation des détails en PDF:", error)
      alert("Une erreur s'est produite lors de l'exportation des détails. Veuillez réessayer.")
    }
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
  <th>Durée d'amortissement</th>
  <th>Amortissement cumulé</th>
  <th>Valeur nette comptable</th>
  <th>État</th>
  <th>Actions</th>
</tr>
          </thead>
          <tbody>
            {immobiliersFiltres.length > 0 ? (
              immobiliersFiltres.map((item) => (
                <tr key={item.id}>
                  <td>{item.codeArticle}</td>
                  <td>{item.designation}</td>
                  <td>{item.typeImmobilier}</td>
                  <td>{item.dateAcquisition}</td>
                  <td>{item.dureeAmortissement} ans</td>
                  <td>{formaterPrix(item.amortissementCumule)} Ar</td>
                  <td>{formaterPrix(item.valeurNetteComptable)} Ar</td>
                  <td>
                    <span className={`etat-amortissement ${item.valeurNetteComptable === 0 ? "amorti" : "actif"}`}>
                      {item.valeurNetteComptable === 0 ? "Amorti" : "Actif"}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button className="btn-detail" onClick={() => ouvrirModal(item)}>
                      <Calculator size={16} /> Détails
                    </button>
                  </td>
                </tr>
              ))
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
                <span className="info-label">Date de fin d'amortissement:</span>
                <span className="info-value">{immobilierSelectionne.dateFinAmortissement || "Non calculée"}</span>
              </div>
            </div>

            <div className="amortissement-details">
              <h3>Informations sur l'amortissement</h3>
              <ul>
                <li><strong>Méthode :</strong> Amortissement linéaire basé sur la durée d'amortissement.</li>
                <li><strong>Taux annuel :</strong> {(100 / immobilierSelectionne.dureeAmortissement).toFixed(2)}% (calculé comme 100 / durée).</li>
                <li><strong>Statut actuel :</strong> {immobilierSelectionne.valeurNetteComptable === 0 ? "Amorti" : "Actif"}.</li>
                <li><strong>Date de fin :</strong> L'immobilisation sera totalement amortie le {immobilierSelectionne.dateFinAmortissement || "non défini"}.</li>
              </ul>
            </div>

            <div className="tableau-amortissement-container">
              <table className="tableau-amortissement">
                <thead>
                  <tr>
                    <th>Année</th>
                    <th>Base amortissable</th>
                    <th>Dotation annuelle</th>
                    <th>Amortissement cumulé</th>
                    <th>Valeur nette comptable</th>
                  </tr>
                </thead>
                <tbody>
                  {immobilierSelectionne.amortissements.map((amort, index) => (
                    <tr key={index}>
                      <td>{amort.annee}</td>
                      <td>{formaterPrix(amort.baseAmortissable)} Ar</td>
                      <td>{formaterPrix(amort.dotation)} Ar</td>
                      <td>{formaterPrix(amort.amortissementCumule)} Ar</td>
                      <td>{formaterPrix(amort.valeurNetteComptable)} Ar</td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td><strong>Total</strong></td>
                    <td>-</td>
                    <td><strong>{formaterPrix(immobilierSelectionne.amortissements.reduce((sum, a) => sum + a.dotation, 0))} Ar</strong></td>
                    <td><strong>{formaterPrix(immobilierSelectionne.amortissementCumule)} Ar</strong></td>
                    <td><strong>{formaterPrix(immobilierSelectionne.valeurNetteComptable)} Ar</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="actions-modal">
              <button className="bouton-fermer" onClick={fermerModal}>
                Fermer
              </button>
              <button className="bouton-exporter" onClick={exporterDetails}>
                <FileDown size={16} /> Exporter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Amortissements
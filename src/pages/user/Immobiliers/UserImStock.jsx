import "./css/Stock.css"
import { useEffect, useState } from "react"
import { useAuth } from "../../../Context/AuthContext"
import { FileDown, Info, Loader2 } from "lucide-react"
import { getBienByAgence } from "../../../services/bienAgenceServices"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

function UserStock() {
  const { userAgenceId } = useAuth()
  const [bienAgences, setBienAgences] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState("Toutes") // Initialisé à "Toutes"

  useEffect(() => {
    const fetchBienAgences = async () => {
      setLoading(true)
      setError(null)
      try {
        console.log("userAgenceId dans useEffect:", userAgenceId, typeof userAgenceId)
        if (!userAgenceId) {
          throw new Error("Aucun ID d'agence trouvé pour l'utilisateur")
        }
        const response = await getBienByAgence(userAgenceId)
        console.log("Réponse brute de BienByAgence:", response.data)
        const data = Array.isArray(response.data) ? response.data : [response.data]
        console.log("Données normalisées:", data)
        if (!data || data.length === 0) {
          setBienAgences([])
        } else {
          setBienAgences(data)
        }
      } catch (err) {
        setError("Erreur lors du chargement des données : " + err.message)
        console.error("Erreur fetch BienByAgence:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchBienAgences()
  }, [userAgenceId])

  // Extrait les catégories uniques
  const getUniqueCategories = () => {
    const categories = bienAgences
      .map((item) => item.immobilisation?.categorie?.nomCategorie)
      .filter((category) => category && category !== "N/A")
    return ["Toutes", ...new Set(categories)]
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    const tableColumn = ["ID", "Nom", "Référence", "Catégorie", "Quantité", "Date Affectation"]
    const tableRows = bienAgences.map((item) => [
      item.idBien,
      item.immobilisation?.nomBien || "N/A",
      item.immobilisation?.codeBarre || "N/A",
      item.immobilisation?.categorie?.nomCategorie || "N/A",
      item.quantite || "N/A",
      new Date(item.dateAffectation).toLocaleDateString(),
    ])

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { cellPadding: 2, fontSize: 10 },
      headStyles: { fillColor: [22, 160, 133], textColor: [255, 255, 255] },
    })
    doc.text("Stock des Biens par Agence", 14, 15)
    doc.save("stock_biens.pdf")
  }

  const handleDetailsClick = (item) => {
    setSelectedItem(item)
  }

  const closeDetails = () => {
    setSelectedItem(null)
  }

  const calculateAmortissement = (item) => {
    const immobilisation = item.immobilisation
    if (!immobilisation?.categorie?.dureeAmortissement || !immobilisation?.valeurAcquisition) return "N/A"
    const duree = immobilisation.categorie.dureeAmortissement
    const valeurAcquisition = immobilisation.valeurAcquisition
    return (valeurAcquisition / duree).toFixed(2)
  }

  // Filtre les biens selon la catégorie sélectionnée
  const filteredBienAgences = selectedCategory === "Toutes"
    ? bienAgences
    : bienAgences.filter((item) =>
        item.immobilisation?.categorie?.nomCategorie === selectedCategory
      )

  if (loading) {
    return (
      <div className="user-imstock-container">
        <div className="loading-overlay">
          <Loader2 size={50} className="spinner" />
          <p>Chargement en cours...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="user-imstock-container">
        <div className="error-message">{error}</div>
      </div>
    )
  }

  return (
    <div className="user-imstock-container">
      <div className="user-imstock-header">
        <h2>Stock des biens disponibles</h2>
        <div className="user-imstock-actions">
          <div className="category-filter">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-select"
            >
              {getUniqueCategories().map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <button className="btn-export" onClick={exportToPDF} disabled={bienAgences.length === 0}>
            <FileDown size={18} /> Exporter PDF
          </button>
        </div>
      </div>
      <div className="user-imstock-table-container">
        <table className="user-imstock-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom</th>
              <th>Référence</th>
              <th>Catégorie</th>
              <th>Quantité</th>
              <th>Date Affectation</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBienAgences.length > 0 ? (
              filteredBienAgences.map((item) => (
                <tr key={item.idBien}>
                  <td>{item.idBien}</td>
                  <td>{item.immobilisation?.nomBien || "N/A"}</td>
                  <td>{item.immobilisation?.codeBarre || "N/A"}</td>
                  <td>{item.immobilisation?.categorie?.nomCategorie || "N/A"}</td>
                  <td>{item.quantite || "N/A"}</td>
                  <td>{new Date(item.dateAffectation).toLocaleDateString()}</td>
                  <td className="actions-cell">
                    <button className="btn-details" onClick={() => handleDetailsClick(item)}>
                      <Info size={16} /> Détails
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-data">Aucune donnée disponible</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedItem && (
        <div className="details-panel">
          <div className="details-content">
            <h3>Détails de l'élément</h3>
            <button className="btn-close" onClick={closeDetails}>X</button>
            <table className="details-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Quantité</th>
                  <th>Date Affectation</th>
                  <th>Amortissement (annuel)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{selectedItem.immobilisation?.nomBien || "N/A"}</td>
                  <td>{selectedItem.quantite || "N/A"}</td>
                  <td>{new Date(selectedItem.dateAffectation).toLocaleDateString()}</td>
                  <td>{calculateAmortissement(selectedItem)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserStock
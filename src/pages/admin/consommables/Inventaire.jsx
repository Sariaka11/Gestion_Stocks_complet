"use client"

import { useEffect, useState } from "react"
import { FileDown, Package, Truck, Calendar, Loader2, FileText, X } from "lucide-react"
import { getFournitures } from "../../../services/fournituresServices"
import { getAgenceFournitures } from "../../../services/agenceFournituresServices"
import { getAgences } from "../../../services/agenceServices"
import "./css/Inventaire.css"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

function Inventaire() {
  const [fournitures, setFournitures] = useState([])
  const [agenceFournitures, setAgenceFournitures] = useState([])
  const [agences, setAgences] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtreDate, setFiltreDate] = useState("")
  const [filtreCategorie, setFiltreCategorie] = useState("")
  const [toasts, setToasts] = useState([])

  const categoriesStock = [
    { id: 1, nom: "Fournitures de Bureau" },
    { id: 2, nom: "Matériel Informatique" },
    { id: 3, nom: "Fournitures d'Entretien" },
    { id: 4, nom: "Matériels Informatiques" },
    { id: 5, nom: "Livret" },
  ]

  const exporterPDF = () => {
    try {
      const doc = new jsPDF()
      doc.setFontSize(16)
      doc.setTextColor(150, 0, 0)
      doc.text(" Stock Enregistrés", 14, 15)

      const stockData = fournitures
        .filter((f) => (!filtreDate || f.date?.startsWith(filtreDate)) && (!filtreCategorie || f.categorie === filtreCategorie))
        .map((f) => [
          f.nom,
          f.categorie,
          f.quantite,
          f.quantiteRestante,
          f.prixUnitaire?.toFixed(2),
          f.montant?.toFixed(2),
          f.date?.split("T")[0],
        ])

      autoTable(doc, {
        head: [["Désignation", "Catégorie", "Qtt Ajoutée", "Qtt Restante", "PU", "Montant", "Date"]],
        body: stockData,
        startY: 20,
      })

      const yAfterStock = doc.lastAutoTable.finalY + 10
      doc.setFontSize(16)
      doc.text(" Répartition vers les Agences", 14, yAfterStock)

      const dispatchData = agenceFournitures
        .filter((af) => !filtreDate || af.dateAssociation?.startsWith(filtreDate))
        .map((af) => {
          const fourniture = fournitures.find((f) => f.id === af.fournitureId)
          const agence = agences.find((a) => a.id === af.agenceId)
          return [
            fourniture?.nom || "-",
            agence?.nom || "-",
            af.quantite,
            af.dateAssociation?.split("T")[0] || "-",
          ]
        })

      autoTable(doc, {
        head: [["Fourniture", "Agence", "Quantité", "Date"]],
        body: dispatchData,
        startY: yAfterStock + 5,
      })

      doc.save("inventaire.pdf")
      afficherToast("Export PDF réalisé avec succès", "succes")
    } catch (error) {
      console.error("Erreur génération PDF :", error)
      afficherToast("Une erreur est survenue lors de l'export", "erreur")
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

  // Supprimer un toast spécifique
  const supprimerToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  useEffect(() => {
    setLoading(true)

    Promise.all([getFournitures(), getAgenceFournitures(), getAgences()])
      .then(([resF, resAF, resAgences]) => {
        const rawFournitures = Array.isArray(resF.data) ? resF.data : resF.data?.["$values"] || []
        const rawAgenceFournitures = Array.isArray(resAF.data) ? resAF.data : resAF.data?.["$values"] || []
        const rawAgences = Array.isArray(resAgences.data) ? resAgences.data : resAgences.data?.["$values"] || []

        setFournitures(rawFournitures)
        setAgenceFournitures(rawAgenceFournitures)
        setAgences(rawAgences)
      })
      .catch((err) => {
        console.error("Erreur chargement:", err)
        afficherToast("Erreur lors du chargement des données", "erreur")
      })
      .finally(() => setLoading(false))
  }, [])

  // Calcul du total des montants pour les fournitures filtrées
  const totalMontant = fournitures
    .filter((f) => (!filtreDate || f.date?.startsWith(filtreDate)) && (!filtreCategorie || f.categorie === filtreCategorie))
    .reduce((sum, f) => sum + (f.montant || 0), 0)
    .toFixed(2)

  return (
    <div className="page-inventaire">
      {loading ? (
        <div className="loading-overlay">
          <Loader2 size={50} className="spinner" />
          <p>Chargement en cours...</p>
        </div>
      ) : (
        <div className="content-wrapper">
          <div className="page-header">
            <h1 className="page-title">Résumé des Opérations</h1>
            <div className="header-actions">
              <button className="btn-exporter" onClick={exporterPDF}>
                <FileDown size={18} />
                Exporter
              </button>
            </div>
          </div>

          <div className="filters-container">
            <div className="date-filter">
              <label>Filtrer par date :</label>
              <div className="date-input-wrapper">
                <Calendar size={18} className="calendar-icon" />
                <input
                  type="date"
                  value={filtreDate}
                  onChange={(e) => setFiltreDate(e.target.value)}
                  className="date-input"
                />
              </div>
            </div>
            <div className="categorie-filter">
              <label>Filtrer par catégorie :</label>
              <div className="categorie-input-wrapper">
                <Package size={18} className="categorie-icon" />
                <select
                  value={filtreCategorie}
                  onChange={(e) => setFiltreCategorie(e.target.value)}
                  className="categorie-input"
                >
                  <option value="">Toutes les catégories</option>
                  {categoriesStock.map((cat) => (
                    <option key={cat.id} value={cat.nom}>
                      {cat.nom}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <section className="stock-section">
            <div className="section-title">
              <Package size={20} />
              <h2>Stock enregistrés</h2>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Désignation</th>
                    <th>Catégorie</th>
                    <th>Quantité Ajoutée</th>
                    <th>Quantité Restante</th>
                    <th>Prix Unitaire</th>
                    <th>Montant</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {fournitures
                    .filter((f) => (!filtreDate || f.date?.startsWith(filtreDate)) && (!filtreCategorie || f.categorie === filtreCategorie))
                    .length > 0 ? (
                    fournitures
                      .filter((f) => (!filtreDate || f.date?.startsWith(filtreDate)) && (!filtreCategorie || f.categorie === filtreCategorie))
                      .map((f) => (
                        <tr key={f.id}>
                          <td>{f.nom}</td>
                          <td>{f.categorie}</td>
                          <td>{f.quantite}</td>
                          <td>{f.quantiteRestante}</td>
                          <td>{f.prixUnitaire?.toFixed(2)}</td>
                          <td>{f.montant?.toFixed(2)}</td>
                          <td>{f.date?.split("T")[0]}</td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="no-data">
                        Aucune donnée disponible
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="5" className="total-label">
                      Total Montant :
                    </td>
                    <td>{totalMontant}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          <section className="dispatch-section">
            <div className="section-title">
              <Truck size={20} />
              <h2>Répartition vers les Agences</h2>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fourniture</th>
                    <th>Agence</th>
                    <th>Quantité Envoyée</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {agenceFournitures.filter((af) => !filtreDate || af.dateAssociation?.startsWith(filtreDate)).length >
                  0 ? (
                    agenceFournitures
                      .filter((af) => !filtreDate || af.dateAssociation?.startsWith(filtreDate))
                      .map((af, index) => {
                        const fourniture = fournitures.find((f) => f.id === af.fournitureId)
                        const agence = agences.find((a) => a.id === af.agenceId)
                        return (
                          <tr key={index}>
                            <td>{fourniture?.nom || "-"}</td>
                            <td>{agence?.nom || "-"}</td>
                            <td>{af.quantite ?? "-"}</td>
                            <td>{af.dateAssociation?.split("T")[0] ?? "-"}</td>
                          </tr>
                        )
                      })
                  ) : (
                    <tr>
                      <td colSpan="4" className="no-data">
                        Aucune donnée disponible
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <div className="toast-icon">
              {toast.type === "succes" ? <FileText size={20} /> : <FileText size={20} />}
            </div>
            <div className="toast-content">
              <p>{toast.message}</p>
            </div>
            <button onClick={() => supprimerToast(toast.id)} className="toast-close">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Inventaire
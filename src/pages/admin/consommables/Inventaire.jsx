"use client"

import { useEffect, useState } from "react"
import { FileDown, Package, Truck, Calendar, Loader2, FileText, X, Search, Edit, Trash2 } from "lucide-react"
import { getFournitures } from "../../../services/fournituresServices"
import { getAgenceFournitures } from "../../../services/agenceFournituresServices"
import "./css/Inventaire.css"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

function Inventaire() {
  const [fournitures, setFournitures] = useState([])
  const [agenceFournitures, setAgenceFournitures] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtreDate, setFiltreDate] = useState("")
  const [toasts, setToasts] = useState([])
  const [searchTerm, setSearchTerm] = useState("")

  const exporterPDF = () => {
    try {
      const doc = new jsPDF()
      doc.setFontSize(16)
      doc.setTextColor(192, 0, 0)
      doc.text(" Stock Enregistrés", 14, 15)

      const stockData = fournitures
        .filter((f) => !filtreDate || f.date?.startsWith(filtreDate))
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
        headStyles: { fillColor: [192, 0, 0] },
      })

      const yAfterStock = doc.lastAutoTable.finalY + 10
      doc.setFontSize(16)
      doc.text(" Répartition vers les Agences", 14, yAfterStock)

      const dispatchData = agenceFournitures
        .filter((af) => !filtreDate || af.dateAssociation?.startsWith(filtreDate))
        .map((af) => [af.fourniture?.nom || "-", af.agence?.nom || "-", af.quantite, af.dateAssociation?.split("T")[0]])

      autoTable(doc, {
        head: [["Fourniture", "Agence", "Quantité", "Date"]],
        body: dispatchData,
        startY: yAfterStock + 5,
        headStyles: { fillColor: [192, 0, 0] },
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

    Promise.all([getFournitures(), getAgenceFournitures()])
      .then(([resF, resAF]) => {
        const rawFournitures = Array.isArray(resF.data) ? resF.data : resF.data?.["$values"] || []

        const rawAgenceFournitures = Array.isArray(resAF.data) ? resAF.data : resAF.data?.["$values"] || []

        setFournitures(rawFournitures)
        setAgenceFournitures(rawAgenceFournitures)
      })
      .catch((err) => {
        console.error("Erreur chargement:", err)
        afficherToast("Erreur lors du chargement des données", "erreur")
      })
      .finally(() => setLoading(false))
  }, [])

  // Filtrer les fournitures par terme de recherche et date
  const filteredFournitures = fournitures.filter(
    (f) =>
      (!filtreDate || f.date?.startsWith(filtreDate)) &&
      (!searchTerm ||
        (f.nom && f.nom.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (f.categorie && f.categorie.toLowerCase().includes(searchTerm.toLowerCase()))),
  )

  // Filtrer les affectations par date
  const filteredAgenceFournitures = agenceFournitures.filter(
    (af) => !filtreDate || af.dateAssociation?.startsWith(filtreDate),
  )

  return (
    <div className="page-inventaire">
      {loading ? (
        <div className="loading-overlay">
          <Loader2 size={50} className="spinner" />
          <p>Chargement en cours...</p>
        </div>
      ) : (
        <>
          <div className="header-container">
            <h1 className="titre-page">Résumé des Opérations</h1>
          </div>

          <div className="content-container">
            <div className="actions-bar">
              <div className="search-container">
                <div className="search-input-wrapper">
                  <Search size={18} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>

                <div className="date-filter-wrapper">
                  <Calendar size={18} className="calendar-icon" />
                  <input
                    type="date"
                    value={filtreDate}
                    onChange={(e) => setFiltreDate(e.target.value)}
                    className="date-input"
                  />
                </div>
              </div>

              <button onClick={exporterPDF} className="export-btn">
                <FileDown size={18} />
                <span>Exporter en PDF</span>
              </button>
            </div>

            <section className="stock-section">
              <div className="section-title">
                <Package size={20} />
                <h2>Stock enregistrés</h2>
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Désignation</th>
                      <th>Catégorie</th>
                      <th colSpan="3">Stock Restant</th>
                      <th colSpan="3">Stock Actuel</th>
                      <th>Actions</th>
                    </tr>
                    <tr className="sub-header">
                      <th></th>
                      <th></th>
                      <th>Quantité</th>
                      <th>Montant</th>
                      <th>Date</th>
                      <th>Quantité</th>
                      <th>Prix Unitaire</th>
                      <th>Montant</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFournitures.length > 0 ? (
                      filteredFournitures.map((f, index) => (
                        <tr key={f.id || index} className={index % 2 === 0 ? "row-even" : "row-odd"}>
                          <td>{f.nom}</td>
                          <td>{f.categorie}</td>
                          <td>{f.quantiteRestante}</td>
                          <td>{(f.prixUnitaire * f.quantiteRestante)?.toFixed(2)}</td>
                          <td>{f.date?.split("T")[0]}</td>
                          <td>{f.quantite}</td>
                          <td>{f.prixUnitaire?.toFixed(2)}</td>
                          <td>{f.montant?.toFixed(2)}</td>
                          <td className="actions-cell">
                            <button className="action-btn edit-btn">
                              <Edit size={16} />
                              <span>Modifier</span>
                            </button>
                            <button className="action-btn delete-btn">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="9" className="no-data">
                          Aucune donnée disponible
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="dispatch-section">
              <div className="section-title">
                <Truck size={20} />
                <h2>Répartition vers les Agences</h2>
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Fourniture</th>
                      <th>Agence</th>
                      <th>Quantité Envoyée</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAgenceFournitures.length > 0 ? (
                      filteredAgenceFournitures.map((af, index) => (
                        <tr key={index} className={index % 2 === 0 ? "row-even" : "row-odd"}>
                          <td>{af.fourniture?.nom || "-"}</td>
                          <td>{af.agence?.nom || "-"}</td>
                          <td>{af.quantite ?? "-"}</td>
                          <td>{af.dateAssociation?.split("T")[0] ?? "-"}</td>
                          <td className="actions-cell">
                            <button className="action-btn edit-btn">
                              <Edit size={16} />
                              <span>Modifier</span>
                            </button>
                            <button className="action-btn delete-btn">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="no-data">
                          Aucune donnée disponible
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </>
      )}

      {/* Système de toast notifications */}
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

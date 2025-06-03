"use client"

import { useEffect, useState } from "react"
import { FileDown, Package, Calendar, Loader2, FileText, X } from "lucide-react"
import { getFournitures, getAgenceFournitures, getAgences } from "../../../services/fournituresServices"
import * as XLSX from "xlsx"
import "./css/Inventaire.css"

function Inventaire() {
  const [fournitures, setFournitures] = useState([])
  const [agenceFournitures, setAgenceFournitures] = useState([])
  const [agences, setAgences] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtreMoisStock, setFiltreMoisStock] = useState("")
  const [filtreAnneeStock, setFiltreAnneeStock] = useState("")
  const [filtreMoisEntree, setFiltreMoisEntree] = useState("")
  const [filtreAnneeEntree, setFiltreAnneeEntree] = useState("")
  const [toasts, setToasts] = useState([])

  const moisOptions = [
    "", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ]

  useEffect(() => {
    setLoading(true)
    Promise.all([getFournitures(), getAgenceFournitures(), getAgences()])
      .then(([resF, resAF, resAgences]) => {
        const rawFournitures = Array.isArray(resF.data) ? resF.data : resF.data?.["$values"] || []
        const rawAgenceFournitures = Array.isArray(resAF.data) ? resAF.data : resAF.data?.["$values"] || []
        const rawAgences = Array.isArray(resAgences.data) ? resAgences.data : resAgences.data?.["$values"] || []

        console.log("Raw Fournitures:", rawFournitures)
        console.log("Raw AgenceFournitures:", rawAgenceFournitures)
        console.log("Raw Agences:", rawAgences)

        const mappedFournitures = rawFournitures.map((f, index) => {
          // Calculer le CMUP
          const entrees = f.entreesFournitures || [];
          const totalMontant = entrees.reduce((sum, e) => sum + (e.quantiteEntree * e.prixUnitaire), 0);
          const totalQuantite = entrees.reduce((sum, e) => sum + e.quantiteEntree, 0);
          const cmup = totalQuantite > 0 ? totalMontant / totalQuantite : 0;

          return {
            id: f.id || `fourniture-${index}`,
            nom: f.nom ? f.nom.trim().toLowerCase() : `fourniture-${index}`,
            categorie: f.categorie,
            quantite: f.quantiteRestante || 0,
            prixUnitaire: f.prixUnitaire || 0,
            prixTotal: f.prixTotal || 0,
            cmup: cmup || f.cmup || 0, // Utiliser le CMUP calculé ou celui des données
            date: f.dateEntree || null,
            entreesFournitures: f.entreesFournitures || [],
          };
        });

        const mappedAgenceFournitures = rawAgenceFournitures.map((af) => ({
          ...af,
          fournitureNom: af.fournitureNom ? af.fournitureNom.trim().toLowerCase() : "",
          agenceNom: af.agenceNom ? af.agenceNom.trim() : "",
          quantite: af.quantite || 0,
          prixUnitaire: af.prixUnitaire || 0,
          montant: (af.quantite || 0) * (af.prixUnitaire || 0),
        }));

        // Extraire les agences uniques à partir de agenceFournitures
        const uniqueAgences = [...new Set(rawAgenceFournitures.map(af => af.agenceNom))].map(nom => ({ nom }));

        setFournitures(mappedFournitures);
        setAgenceFournitures(mappedAgenceFournitures);
        setAgences(uniqueAgences);
      })
      .catch((err) => {
        console.error("Erreur chargement:", err)
        afficherToast("Erreur lors du chargement des données", "erreur")
      })
      .finally(() => setLoading(false))
  }, [])

  const afficherToast = (message, type) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((toast) => toast.id !== id)), 5000)
  }

  const supprimerToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const exporterExcel = () => {
    try {
      const header1 = [
        "DÉSIGNATIONS",
        "STOCKS AU " + (filtreMoisStock && filtreAnneeStock ? `${filtreMoisStock} ${filtreAnneeStock}` : ""),
        "",
        "",
        "ENTRÉE " + (filtreMoisEntree && filtreAnneeEntree ? `${filtreMoisEntree} ${filtreAnneeEntree}` : ""),
        "",
        "",
        "QUANTITÉ RESTANTE",
        ...agences.map((agence) => agence.nom)
      ]

      const header2 = [
        "",
        "Quantité",
        "CMUP",
        "Montant",
        "Quantité",
        "PU",
        "Montant",
        "",
        ...agences.map(() => "")
      ]

      const tableData = fournitures
        .filter((f) => {
          if (!filtreMoisStock || !filtreAnneeStock) return true;
          const moisIndex = moisOptions.indexOf(filtreMoisStock);
          const dateFinFiltre = new Date(filtreAnneeStock, moisIndex, 0); // Dernier jour du mois filtré
          return f.entreesFournitures.some((e) => {
            const dateEntree = new Date(e.dateEntree);
            return dateEntree <= dateFinFiltre;
          });
        })
        .map((f) => {
          const entree = f.entreesFournitures.find((e) => 
            !filtreMoisEntree || !filtreAnneeEntree || e.dateEntree.startsWith(`${filtreAnneeEntree}-${String(moisOptions.indexOf(filtreMoisEntree)).padStart(2, "0")}`)
          ) || {}
          console.log("Matching entree for", f.nom, ":", entree)
          const row = [
            f.nom,
            f.quantite || 0,
            f.cmup?.toFixed(2) || 0, // Utiliser CMUP au lieu de prixUnitaire
            f.prixTotal?.toFixed(2) || 0,
            entree.quantiteEntree || 0,
            entree.prixUnitaire?.toFixed(2) || 0,
            entree.montant?.toFixed(2) || 0,
            (f.quantite || 0) + (entree.quantiteEntree || 0),
          ]

          agences.forEach((agence) => {
            const af = agenceFournitures.find(
              (af) => af.fournitureNom === f.nom && af.agenceNom === agence.nom && 
              (!filtreMoisEntree || !filtreAnneeEntree || af.dateAssociation.startsWith(`${filtreAnneeEntree}-${String(moisOptions.indexOf(filtreMoisEntree)).padStart(2, "0")}`))
            )
            console.log("Matching af for", f.nom, "and", agence.nom, ":", af)
            row.push(af ? af.quantite : 0)
          })
          return row
        })

      const ws = XLSX.utils.aoa_to_sheet([
        header1,
        header2,
        ...tableData.map(row => row)
      ])

      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },
        { s: { r: 0, c: 1 }, e: { r: 0, c: 3 } },
        { s: { r: 0, c: 4 }, e: { r: 0, c: 6 } },
        { s: { r: 0, c: 7 }, e: { r: 1, c: 7 } },
      ]

      ws['!cols'] = [
        { wch: 30 },
        { wch: 10 },
        { wch: 10 },
        { wch: 12 },
        { wch: 10 },
        { wch: 10 },
        { wch: 12 },
        { wch: 15 },
        ...agences.map(() => ({ wch: 10 }))
      ]

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Inventaire")
      XLSX.writeFile(wb, "inventaire.xlsx")
      afficherToast("Export Excel réalisé avec succès", "succes")
    } catch (error) {
      console.error("Erreur génération Excel :", error)
      afficherToast("Une erreur est survenue lors de l'export", "erreur")
    }
  }

  const getTotalByMonth = (field, data, mois, annee) => {
    let total = 0;
    data.forEach((fourniture) => {
      const entrees = fourniture.entreesFournitures || [];
      const filteredEntrees = entrees.filter((e) => 
        !mois || !annee || e.dateEntree.startsWith(`${annee}-${String(moisOptions.indexOf(mois)).padStart(2, "0")}`)
      );
      total += filteredEntrees.reduce((sum, e) => sum + (e[field] || 0), 0);
    });
    return total;
  }

  const totalQuantiteStock = fournitures.reduce((sum, f) => sum + (f.quantite || 0), 0);
  const totalMontantStock = fournitures
    .filter((f) => {
      if (!filtreMoisStock || !filtreAnneeStock) return true;
      const moisIndex = moisOptions.indexOf(filtreMoisStock);
      const dateFinFiltre = new Date(filtreAnneeStock, moisIndex, 0);
      return f.entreesFournitures.some((e) => {
        const dateEntree = new Date(e.dateEntree);
        return dateEntree <= dateFinFiltre;
      });
    })
    .reduce((sum, f) => sum + (f.prixTotal || 0), 0)
    .toFixed(2);

  const totalQuantiteEntree = getTotalByMonth("quantiteEntree", fournitures, filtreMoisEntree, filtreAnneeEntree);
  const totalMontantEntree = getTotalByMonth("montant", fournitures, filtreMoisEntree, filtreAnneeEntree).toFixed(2);

  const totalDisponible = totalQuantiteStock + totalQuantiteEntree;

  const getTotalByAgence = (agenceNom) => {
    return agenceFournitures
      .filter((af) => af.agenceNom === agenceNom && (!filtreMoisEntree || !filtreAnneeEntree || af.dateAssociation.startsWith(`${filtreAnneeEntree}-${String(moisOptions.indexOf(filtreMoisEntree)).padStart(2, "0")}`)))
      .reduce((sum, af) => sum + (af.quantite || 0), 0)
  }

  return (
    <div className="page-inventaire">
      {loading ? (
        <div className="loading-overlay">
          <Loader2 size={50} className="spinner" />
          <p>Chargement en cours...</p>
        </div>
      ) : agenceFournitures.length === 0 ? (
        <div className="no-data">Aucune donnée disponible</div>
      ) : (
        <div className="content-wrapper">
          <div className="page-header">
            <h1 className="page-title">Résumé des Opérations</h1>
            <div className="header-actions">
              <button className="btn-exporter" onClick={exporterExcel}>
                <FileDown size={18} />
                Exporter Excel
              </button>
            </div>
          </div>

          <div className="filters-container">
            <div className="date-filter">
              <label htmlFor="filtreMoisStock">Filtrer Stock :</label>
              <div className="filter-group">
                <div className="select-wrapper">
                  <select
                    id="filtreMoisStock"
                    value={filtreMoisStock}
                    onChange={(e) => setFiltreMoisStock(e.target.value)}
                    className="select-input"
                  >
                    {moisOptions.map((mois, index) => (
                      <option key={index} value={mois}>{mois}</option>
                    ))}
                  </select>
                </div>
                <input
                  type="number"
                  id="filtreAnneeStock"
                  value={filtreAnneeStock}
                  onChange={(e) => setFiltreAnneeStock(e.target.value)}
                  placeholder="Année"
                  className="year-input"
                />
              </div>
            </div>
            <div className="date-filter">
              <label htmlFor="filtreMoisEntree">Filtrer Entrée :</label>
              <div className="filter-group">
                <div className="select-wrapper">
                  <select
                    id="filtreMoisEntree"
                    value={filtreMoisEntree}
                    onChange={(e) => setFiltreMoisEntree(e.target.value)}
                    className="select-input"
                  >
                    {moisOptions.map((mois, index) => (
                      <option key={index} value={mois}>{mois}</option>
                    ))}
                  </select>
                </div>
                <input
                  type="number"
                  id="filtreAnneeEntree"
                  value={filtreAnneeEntree}
                  onChange={(e) => setFiltreAnneeEntree(e.target.value)}
                  placeholder="Année"
                  className="year-input"
                />
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
                    <th rowSpan="2">Désignation</th>
                    <th colSpan="3">Stock avant {filtreMoisStock && filtreAnneeStock ? `${filtreMoisStock} ${filtreAnneeStock}` : ""}</th>
                    <th colSpan="3">Entrée {filtreMoisEntree && filtreAnneeEntree ? `${filtreMoisEntree} ${filtreAnneeEntree}` : ""}</th>
                    <th rowSpan="2">Quantité Restante</th>
                    <th colSpan={agences.length}>Consommation des Agences</th>
                  </tr>
                  <tr>
                    <th>Quantité</th>
                    <th>CMUP</th>
                    <th>Montant</th>
                    <th>Quantité</th>
                    <th>Prix</th>
                    <th>Montant</th>
                    {agences.map((agence) => (
                      <th key={agence.nom}>{agence.nom}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fournitures
                    .filter((f) => {
                      if (!filtreMoisStock || !filtreAnneeStock) return true;
                      const moisIndex = moisOptions.indexOf(filtreMoisStock);
                      const dateFinFiltre = new Date(filtreAnneeStock, moisIndex, 0);
                      return f.entreesFournitures.some((e) => {
                        const dateEntree = new Date(e.dateEntree);
                        return dateEntree <= dateFinFiltre;
                      });
                    })
                    .map((f, index) => {
                      const entree = f.entreesFournitures.find((e) => 
                        !filtreMoisEntree || !filtreAnneeEntree || e.dateEntree.startsWith(`${filtreAnneeEntree}-${String(moisOptions.indexOf(filtreMoisEntree)).padStart(2, "0")}`)
                      ) || {}
                      return (
                        <tr key={`row-${f.id}-${index}`}>
                          <td>{f.nom}</td>
                          <td>{f.quantite}</td>
                          <td>{f.cmup?.toFixed(2)}</td>
                          <td>{f.prixTotal?.toFixed(2)}</td>
                          <td>{entree.quantiteEntree || 0}</td>
                          <td>{entree.prixUnitaire?.toFixed(2) || 0}</td>
                          <td>{entree.montant?.toFixed(2) || 0}</td>
                          <td>{(f.quantite || 0) + (entree.quantiteEntree || 0)}</td>
                          {agences.map((agence, agenceIndex) => {
                            const af = agenceFournitures.find(
                              (af) => af.fournitureNom === f.nom && af.agenceNom === agence.nom && 
                              (!filtreMoisEntree || !filtreAnneeEntree || af.dateAssociation.startsWith(`${filtreAnneeEntree}-${String(moisOptions.indexOf(filtreMoisEntree)).padStart(2, "0")}`))
                            )
                            return <td key={`cell-${agence.nom}-${index}-${agenceIndex}`}>{af ? af.quantite : 0}</td>
                          })}
                        </tr>
                      )
                    })}
                </tbody>
                <tfoot>
                  <tr>
                    <td>Total</td>
                    <td>{totalQuantiteStock}</td>
                    <td></td>
                    <td>{totalMontantStock}</td>
                    <td>{totalQuantiteEntree}</td>
                    <td></td>
                    <td>{totalMontantEntree}</td>
                    <td>{totalDisponible}</td>
                    {agences.map((agence) => (
                      <td key={agence.nom}>{getTotalByAgence(agence.nom)}</td>
                    ))}
                  </tr>
                </tfoot>
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
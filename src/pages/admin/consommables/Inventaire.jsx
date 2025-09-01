"use client"

import { useEffect, useState } from "react"
import { FileDown, Package, Calendar, Loader2, FileText, X } from "lucide-react"
import { getFournitures, getAgenceFourniture, getAgences } from "../../../services/fournituresServices"
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
  const [filtreMoisConsommation, setFiltreMoisConsommation] = useState("")
  const [filtreAnneeConsommation, setFiltreAnneeConsommation] = useState("")
  const [toasts, setToasts] = useState([])

  const moisOptions = [
    "", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ]

  useEffect(() => {
    setLoading(true)
    Promise.all([getFournitures(), getAgenceFourniture(), getAgences()])
      .then(([resF, resAF, resAgences]) => {
        const rawFournitures = Array.isArray(resF.data) ? resF.data : resF.data?.["$values"] || []
        const rawAgenceFournitures = Array.isArray(resAF.data) ? resAF.data : resAF.data?.["$values"] || []
        const rawAgences = Array.isArray(resAgences.data) ? resAgences.data : resAgences.data?.["$values"] || []

        console.log("Raw Fournitures:", rawFournitures)
        console.log("Raw AgenceFournitures:", rawAgenceFournitures)
        console.log("Raw Agences:", rawAgences)

        const mappedFournitures = rawFournitures.map((f, index) => {
          const entrees = f.EntreesFournitures || [];
          const totalMontant = entrees.reduce((sum, e) => sum + (e.QuantiteEntree * e.PrixUnitaire), 0);
          const totalQuantite = entrees.reduce((sum, e) => sum + e.QuantiteEntree, 0);
          const cmup = totalQuantite > 0 ? totalMontant / totalQuantite : 0;

          return {
            id: f.Id || `fourniture-${index}`,
            nom: f.Nom ? f.Nom.trim().toLowerCase() : `fourniture-${index}`,
            Nom: f.Nom || `fourniture-${index}`,
            categorie: f.Categorie || "Non catégorisé",
            quantite: f.QuantiteRestante || 0,
            prixUnitaire: f.PrixUnitaire || 0,
            prixTotal: f.PrixTotal || 0,
            cmup: cmup || f.CMUP || 0,
            date: f.DateEntree || null,
            entreesFournitures: f.EntreesFournitures || [],
          };
        });

        const mappedAgenceFournitures = rawAgenceFournitures.map((af) => ({
          ...af,
          fournitureNom: af.FournitureNom ? af.FournitureNom.trim().toLowerCase() : "",
          FournitureNom: af.FournitureNom || "",
          agenceNom: af.AgenceNom ? af.AgenceNom.trim() : "",
          quantite: af.Quantite || 0,
          Quantite: af.Quantite || 0,
          prixUnitaire: af.PrixUnitaire || 0,
          montant: (af.Quantite || 0) * (af.PrixUnitaire || 0),
          dateAssociation: af.DateAssociation || null,
          DateAssociation: af.DateAssociation || null,
        }));

        const uniqueAgences = [...new Set(rawAgenceFournitures.map(af => af.AgenceNom))].map(nom => ({ nom }));

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
          const dateFinFiltre = new Date(filtreAnneeStock, moisIndex, 0);
          return f.entreesFournitures.some((e) => {
            const dateEntree = new Date(e.DateEntree);
            return dateEntree <= dateFinFiltre;
          });
        })
        .map((f) => {
          const entreesFiltrees = f.entreesFournitures.filter((e) => 
            !filtreMoisEntree || !filtreAnneeEntree || e.DateEntree.startsWith(`${filtreAnneeEntree}-${String(moisOptions.indexOf(filtreMoisEntree)).padStart(2, "0")}`)
          );
          const totalQuantiteEntree = entreesFiltrees.reduce((sum, e) => sum + (e.QuantiteEntree || 0), 0);
          const totalMontantEntree = entreesFiltrees.reduce((sum, e) => sum + ((e.QuantiteEntree || 0) * (e.PrixUnitaire || 0)), 0);
          const puMoyenEntree = totalQuantiteEntree > 0 ? totalMontantEntree / totalQuantiteEntree : 0;

          const row = [
            f.Nom,
            f.quantite || 0,
            f.cmup?.toFixed(2) || 0,
            f.prixTotal?.toFixed(2) || 0,
            totalQuantiteEntree,
            puMoyenEntree?.toFixed(2) || 0,
            totalMontantEntree?.toFixed(2) || 0,
            (f.quantite || 0) + totalQuantiteEntree,
          ]

          agences.forEach((agence) => {
            const af = agenceFournitures.find(
              (af) => af.FournitureNom === f.Nom && af.AgenceNom === agence.nom && 
              (!filtreMoisEntree || !filtreAnneeEntree || af.DateAssociation.startsWith(`${filtreAnneeEntree}-${String(moisOptions.indexOf(filtreMoisEntree)).padStart(2, "0")}`))
            )
            row.push(af ? af.Quantite : 0)
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

  const exporterExcelConsommation = () => {
    try {
      console.log("Filtres Consommation:", { filtreMoisConsommation, filtreAnneeConsommation });

      const allCategories = [...new Set(fournitures.map(f => f.categorie))];
      const categories = allCategories.length > 0 ? allCategories : [
        "Fournitures de Bureau",
        "Fournitures d'Entretien",
        "Livret",
        "Matériel Informatique"
      ];

      let excelData = [];
      let currentRow = 0;
      let merges = [];

      categories.forEach((category) => {
        const categoryFournitures = fournitures.filter(f => f.categorie === category);
        excelData.push([category]);
        currentRow++;

        const moisIndex = moisOptions.indexOf(filtreMoisConsommation);
        const dateFinMois = filtreMoisConsommation && filtreAnneeConsommation && moisIndex !== -1
          ? `30/${String(moisIndex).padStart(2, "0")}/${filtreAnneeConsommation}`
          : "TOUT";

        const periode = filtreMoisConsommation && filtreAnneeConsommation
          ? `${filtreMoisConsommation} ${filtreAnneeConsommation}`
          : "TOUT";

        const header1 = [
          "DÉSIGNATIONS",
          `TOTAL CONSOMMATION ${periode}`, "", "",
          `STOCKS AU ${dateFinMois}`, "", ""
        ];

        const header2 = [
          "", // DÉSIGNATIONS
          "Quantité", "CMUP", "Montant", 
          "Quantité", "CMUP", "Montant"
        ];

        excelData.push(header1);
        excelData.push(header2);
        currentRow += 2;

        const tableData = categoryFournitures.map((f) => {
          const consommation = agenceFournitures
            .filter((af) => {
              if (!af.FournitureNom || !af.DateAssociation) return false;
              if (!filtreMoisConsommation || !filtreAnneeConsommation) return true;
              const moisIndex = moisOptions.indexOf(filtreMoisConsommation);
              if (moisIndex === -1) return false;
              return af.FournitureNom === f.Nom && af.DateAssociation.startsWith(`${filtreAnneeConsommation}-${String(moisIndex).padStart(2, "0")}`);
            })
            .reduce((sum, af) => sum + (af.Quantite || 0), 0);

          const cmupConsommation = f.cmup || 0;
          const montantConsommation = consommation * cmupConsommation;
          const stockAu = (f.quantite || 0);

          return [
            f.Nom,
            consommation,
            cmupConsommation.toFixed(2),
            montantConsommation.toFixed(2),
            stockAu,
            (f.cmup || 0).toFixed(2),
            (stockAu * (f.cmup || 0)).toFixed(2),
          ];
        });

        console.log(`Table Data for ${category}:`, tableData);

        if (tableData.length === 0) {
          excelData.push(["Aucune donnée pour cette catégorie avec les filtres sélectionnés"]);
          currentRow++;
        } else {
          excelData.push(...tableData);
          currentRow += tableData.length;

          const totalQuantiteConsommation = tableData.reduce((sum, row) => sum + row[1], 0);
          const totalMontantConsommation = tableData.reduce((sum, row) => sum + parseFloat(row[3]), 0);
          const totalStockAu = tableData.reduce((sum, row) => sum + row[4], 0);
          const totalMontantStockAu = tableData.reduce((sum, row) => sum + parseFloat(row[6]), 0);

          excelData.push([
            "Total",
            totalQuantiteConsommation,
            "",
            totalMontantConsommation.toFixed(2),
            totalStockAu,
            "",
            totalMontantStockAu.toFixed(2)
          ]);
          currentRow++;
        }

        // Fusions des en-têtes
        const hasData = tableData.length > 0;
        if (hasData) {
          const baseRow = currentRow - tableData.length - 4;

          // Fusion du titre de catégorie sur toute la largeur
          merges.push({
            s: { r: baseRow, c: 0 },
            e: { r: baseRow, c: 6 }
          });

          // Fusions des en-têtes
          merges.push(
            { s: { r: baseRow + 1, c: 0 }, e: { r: baseRow + 2, c: 0 } },
            { s: { r: baseRow + 1, c: 1 }, e: { r: baseRow + 1, c: 3 } },
            { s: { r: baseRow + 1, c: 4 }, e: { r: baseRow + 1, c: 6 } }
          );
        }

        excelData.push([]);
        currentRow++;
      });

      if (excelData.length <= 1) {
        excelData = [["Aucune donnée disponible pour les filtres sélectionnés"]];
      }

      const ws = XLSX.utils.aoa_to_sheet(excelData);
      ws['!merges'] = merges;

      ws['!cols'] = [
        { wch: 30 },
        { wch: 10 },
        { wch: 10 },
        { wch: 12 },
        { wch: 10 },
        { wch: 10 },
        { wch: 12 }
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Consommation");
      XLSX.writeFile(wb, "consommation.xlsx");
      afficherToast("Export Excel réalisé avec succès", "succes");
    } catch (error) {
      console.error("Erreur génération Excel :", error);
      afficherToast("Une erreur est survenue lors de l'export", "erreur");
    }
  }

  const getTotalByMonth = (field, data, mois, annee) => {
    let total = 0;
    data.forEach((fourniture) => {
      const entrees = fourniture.entreesFournitures || [];
      const filteredEntrees = entrees.filter((e) => 
        !mois || !annee || e.DateEntree.startsWith(`${annee}-${String(moisOptions.indexOf(mois)).padStart(2, "0")}`)
      );
      if (field === "quantiteEntree") {
        total += filteredEntrees.reduce((sum, e) => sum + (e.QuantiteEntree || 0), 0);
      } else if (field === "montant") {
        total += filteredEntrees.reduce((sum, e) => sum + ((e.QuantiteEntree || 0) * (e.PrixUnitaire || 0)), 0);
      }
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
        const dateEntree = new Date(e.DateEntree);
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
      .filter((af) => af.AgenceNom === agenceNom && (!filtreMoisEntree || !filtreAnneeEntree || af.DateAssociation.startsWith(`${filtreAnneeEntree}-${String(moisOptions.indexOf(filtreMoisEntree)).padStart(2, "0")}`)))
      .reduce((sum, af) => sum + (af.Quantite || 0), 0)
  }

  // Calcul des totaux pour la consommation
  let totalQuantiteConsommation = 0;
  let totalMontantConsommation = 0;
  let totalStockAu = 0;
  let totalMontantStockAu = 0;

  fournitures.forEach((f) => {
    const consommation = agenceFournitures
      .filter((af) => {
        if (!af.FournitureNom || !af.DateAssociation) return false;
        if (!filtreMoisConsommation || !filtreAnneeConsommation) return true;
        const moisIndex = moisOptions.indexOf(filtreMoisConsommation);
        if (moisIndex === -1) return false;
        return af.FournitureNom === f.Nom && af.DateAssociation.startsWith(`${filtreAnneeConsommation}-${String(moisIndex).padStart(2, "0")}`);
      })
      .reduce((sum, af) => sum + (af.Quantite || 0), 0);

    totalQuantiteConsommation += consommation;
    totalMontantConsommation += consommation * (f.cmup || 0);
    totalStockAu += f.quantite || 0;
    totalMontantStockAu += (f.quantite || 0) * (f.cmup || 0);
  });

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
            <h1 className="page-title">Inventaire des Fournitures Consommables</h1>
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
              <div className="section-left">
                <Package size={23} />
                <h2>Stock enregistrés</h2>
              </div>
              <div className="header-actions">
                <button className="btn-exporter" onClick={exporterExcel}>
                  <FileDown size={18} />
                  Exporter Excel
                </button>
              </div>
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
                        const dateEntree = new Date(e.DateEntree);
                        return dateEntree <= dateFinFiltre;
                      });
                    })
                    .map((f, index) => {
                      const entreesFiltrees = f.entreesFournitures.filter((e) => 
                        !filtreMoisEntree || !filtreAnneeEntree || e.DateEntree.startsWith(`${filtreAnneeEntree}-${String(moisOptions.indexOf(filtreMoisEntree)).padStart(2, "0")}`)
                      );
                      const totalQuantiteEntree = entreesFiltrees.reduce((sum, e) => sum + (e.QuantiteEntree || 0), 0);
                      const totalMontantEntree = entreesFiltrees.reduce((sum, e) => sum + ((e.QuantiteEntree || 0) * (e.PrixUnitaire || 0)), 0);
                      const puMoyenEntree = totalQuantiteEntree > 0 ? totalMontantEntree / totalQuantiteEntree : 0;

                      return (
                        <tr key={`row-${f.id}-${index}`}>
                          <td>{f.Nom}</td>
                          <td>{f.quantite}</td>
                          <td>{f.cmup?.toFixed(2)}</td>
                          <td>{f.prixTotal?.toFixed(2)}</td>
                          <td>{totalQuantiteEntree || 0}</td>
                          <td>{puMoyenEntree?.toFixed(2) || 0}</td>
                          <td>{totalMontantEntree?.toFixed(2) || 0}</td>
                          <td>{(f.quantite || 0) + (totalQuantiteEntree || 0)}</td>
                          {agences.map((agence, agenceIndex) => {
                            const af = agenceFournitures.find(
                              (af) => af.FournitureNom === f.Nom && af.AgenceNom === agence.nom && 
                              (!filtreMoisEntree || !filtreAnneeEntree || af.DateAssociation.startsWith(`${filtreAnneeEntree}-${String(moisOptions.indexOf(filtreMoisEntree)).padStart(2, "0")}`))
                            )
                            return <td key={`cell-${agence.nom}-${index}-${agenceIndex}`}>{af ? af.Quantite : 0}</td>
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

          <section className="stock-section">
            <div className="consommation-filter-container">
              <label htmlFor="filtreMoisConsommation" className="consommation-filter-label">
                Filtrer Consommation :
              </label>
              <div className="consommation-filter-group">
                <div className="consommation-select-wrapper">
                  <select
                    id="filtreMoisConsommation"
                    value={filtreMoisConsommation}
                    onChange={(e) => setFiltreMoisConsommation(e.target.value)}
                    className="consommation-select"
                  >
                    {moisOptions.map((mois, index) => (
                      <option key={index} value={mois}>{mois}</option>
                    ))}
                  </select>
                </div>
                <input
                  type="number"
                  id="filtreAnneeConsommation"
                  value={filtreAnneeConsommation}
                  onChange={(e) => setFiltreAnneeConsommation(e.target.value)}
                  placeholder="Année"
                  className="consommation-year-input"
                />
              </div>
            </div>
            
            <div className="section-title">
              <div className="section-left">
                <Package size={20} />
                <h2>Stock enregistrés - Total Consommation</h2>
              </div>
              <div className="header-actions">
                <button className="btn-exporter" onClick={exporterExcelConsommation}>
                  <FileDown size={22} />
                  Exporter Excel
                </button>
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th rowSpan="2">DÉSIGNATIONS</th>
                    <th colSpan="3">TOTAL CONSOMMATION {filtreMoisConsommation && filtreAnneeConsommation ? `${filtreMoisConsommation} ${filtreAnneeConsommation}` : "TOUT"}</th>
                    <th colSpan="3">STOCKS AU {filtreMoisConsommation && filtreAnneeConsommation ? `30/${String(moisOptions.indexOf(filtreMoisConsommation)).padStart(2, "0")}/${filtreAnneeConsommation}` : "TOUT"}</th>
                  </tr>
                  <tr>
                    <th>Quantité</th>
                    <th>CMUP</th>
                    <th>Montant</th>
                    <th>Quantité</th>
                    <th>CMUP</th>
                    <th>Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {fournitures.map((f, index) => {
                    const consommation = agenceFournitures
                      .filter((af) => {
                        if (!af.FournitureNom || !af.DateAssociation) return false;
                        if (!filtreMoisConsommation || !filtreAnneeConsommation) return true;
                        const moisIndex = moisOptions.indexOf(filtreMoisConsommation);
                        if (moisIndex === -1) return false;
                        return af.FournitureNom === f.Nom && af.DateAssociation.startsWith(`${filtreAnneeConsommation}-${String(moisIndex).padStart(2, "0")}`);
                      })
                      .reduce((sum, af) => sum + (af.Quantite || 0), 0);

                    const cmup = f.cmup || 0;
                    const montantConsommation = consommation * cmup;
                    return (
                      <tr key={`cons-row-${f.id}-${index}`}>
                        <td>{f.Nom}</td>
                        <td>{consommation}</td>
                        <td>{cmup.toFixed(2)}</td>
                        <td>{montantConsommation.toFixed(2)}</td>
                        <td>{f.quantite || 0}</td>
                        <td>{cmup.toFixed(2)}</td>
                        <td>{(f.quantite * cmup).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td>Total</td>
                    <td>{totalQuantiteConsommation}</td>
                    <td></td>
                    <td>{totalMontantConsommation.toFixed(2)}</td>
                    <td>{totalStockAu}</td>
                    <td></td>
                    <td>{totalMontantStockAu.toFixed(2)}</td>
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
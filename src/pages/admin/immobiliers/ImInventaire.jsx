"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, FileDown, RefreshCw, AlertCircle, X, CheckCircle } from 'lucide-react'
import "./css/ImInventaire.css"
import { getImmobiliers } from "../../../services/immobilierServices"
import { getAmortissements } from "../../../services/amortissementServices"
import { getBienAgences } from "../../../services/bienAgenceServices"
import { getAgences } from "../../../services/agenceServices"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

function ImInventaire() {
  const [filtreDesignation, setFiltreDesignation] = useState("")
  const [filtreMois, setFiltreMois] = useState("")
  const [filtreAnnee, setFiltreAnnee] = useState("")
  const [filtreStatut, setFiltreStatut] = useState("")
  const [filtreAgence, setFiltreAgence] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [inventaireData, setInventaireData] = useState([])
  const [agences, setAgences] = useState([])
  const [affectations, setAffectations] = useState([])
  const [toasts, setToasts] = useState([])

  const genererOptionsAnnees = () => {
    const anneeActuelle = new Date().getFullYear()
    const annees = []
    for (let i = anneeActuelle - 5; i <= anneeActuelle; i++) {
      annees.push(i)
    }
    return annees.reverse()
  }

  useEffect(() => {
    chargerDonnees()
  }, [])

  const chargerDonnees = async () => {
    setLoading(true)
    setError(null)

    try {
      const agencesRes = await getAgences()
      let agencesData = agencesRes.data
      if (agencesData && typeof agencesData === "object" && "$values" in agencesData) {
        agencesData = agencesData.$values
      }
      if (!Array.isArray(agencesData)) {
        console.warn("Les données agences reçues ne sont pas un tableau:", agencesData)
        agencesData = []
      }
      setAgences(agencesData)

      const immobiliersRes = await getImmobiliers()
      let immobiliersData = immobiliersRes.data
      if (immobiliersRes.data && typeof immobiliersRes.data === "object" && "$values" in immobiliersRes.data) {
        immobiliersData = immobiliersRes.data.$values
      }
      if (!Array.isArray(immobiliersData)) {
        console.warn("Les données immobiliers reçues ne sont pas un tableau:", immobiliersData)
        immobiliersData = []
      }

      const amortissementsRes = await getAmortissements()
      let amortissementsData = amortissementsRes.data
      if (amortissementsRes.data && typeof amortissementsRes.data === "object" && "$values" in amortissementsRes.data) {
        amortissementsData = amortissementsRes.data.$values
      }
      if (!Array.isArray(amortissementsData)) {
        console.warn("Les données amortissements reçues ne sont pas un tableau:", amortissementsData)
        amortissementsData = []
      }

      const affectationsRes = await getBienAgences()
      console.log("RAW AFFECTATIONS ===>", affectationsRes.data)
      let affectationsData = affectationsRes.data
      if (affectationsRes.data && typeof affectationsRes.data === "object") {
        if ("$values" in affectationsRes.data) {
          affectationsData = affectationsRes.data.$values
        } else if ("values" in affectationsRes.data) {
          affectationsData = affectationsRes.data.values
        }
      }
      if (!Array.isArray(affectationsData)) {
        console.warn("Les données affectations reçues ne sont pas un tableau:", affectationsData)
        affectationsData = []
      }
      affectationsData = affectationsData.filter((aff) => {
        const isValid = aff.idBien && aff.idAgence && aff.fonction && aff.fonction.trim() !== "" && aff.quantite !== undefined
        if (!isValid) {
          console.warn(`Affectation invalide ignorée:`, aff)
        }
        return isValid
      })
      console.log("Affectations filtrées:", affectationsData)
      setAffectations(affectationsData)

      const inventaireItems = immobiliersData.map((item) => {
        const amortissementsBien = amortissementsData.filter((a) => a.idBien === item.idBien)
        const affectationsBien = affectationsData.filter((a) => a.idBien === item.idBien)

        return {
          id: item.idBien,
          codeArticle: `IMM-${String(item.idBien).padStart(3, "0")}`,
          designation: item.nomBien || "Inconnu",
          codeBarre: item.codeBarre || "0000000000000",
          prixAchat: item.valeurAcquisition || 0,
          typeImmobilier: item.categorie?.nomCategorie || "Non catégorisé",
          dateAcquisition: item.dateAcquisition?.split("T")[0] || "",
          quantite: item.quantite || 1,
          statut: item.statut,
          affectations: affectationsBien,
        }
      })

      setInventaireData(inventaireItems)
    } catch (err) {
      console.error("Erreur lors du chargement des données:", err)
      setError("Impossible de charger les données. Veuillez réessayer plus tard.")
    } finally {
      setLoading(false)
    }
  }

  const getNomBien = (idBien) => {
    const bien = inventaireData.find((item) => item.id === idBien)
    return bien ? bien.designation : "Inconnu"
  }

  const getNomAgence = (idAgence) => {
    const agence = agences.find((item) => item.id === idAgence)
    return agence ? agence.nom : "Inconnue"
  }

  const filteredInventaire = useMemo(() => {
    return inventaireData.filter((item) => {
      const matchDesignation = (item.designation || "").toLowerCase().includes(filtreDesignation.toLowerCase())
      const matchStatut = filtreStatut === "" || item.statut === filtreStatut

      let matchMois = true
      if (filtreMois !== "") {
        const moisAcquisition = new Date(item.dateAcquisition).getMonth() + 1
        matchMois = moisAcquisition.toString() === filtreMois
      }

      let matchAnnee = true
      if (filtreAnnee !== "") {
        const anneeAcquisition = new Date(item.dateAcquisition).getFullYear().toString()
        matchAnnee = anneeAcquisition === filtreAnnee
      }

      let matchAgence = true
      if (filtreAgence !== "") {
        const affectationsBien = item.affectations || []
        matchAgence = affectationsBien.some((aff) => aff.idAgence.toString() === filtreAgence)
      }

      return matchDesignation && matchStatut && matchMois && matchAnnee && matchAgence
    })
  }, [inventaireData, filtreDesignation, filtreStatut, filtreMois, filtreAnnee, filtreAgence])

  const combinaisonsAgenceFonction = useMemo(() => {
    if (affectations.length === 0) {
      console.warn("Aucune affectation valide pour générer les combinaisons agence/fonction")
      return []
    }

    const combinaisons = []
    const seen = new Set()

    affectations.forEach((aff) => {
      const fonction = (aff.fonction || "").trim()
      if (fonction !== "") {
        const key = `${aff.idAgence}-${fonction.toLowerCase()}`
        if (!seen.has(key)) {
          seen.add(key)
          combinaisons.push({
            idAgence: aff.idAgence,
            nomAgence: getNomAgence(aff.idAgence),
            fonction,
          })
        }
      } else {
        console.warn(`Affectation ignorée en raison de fonction vide: idBien=${aff.idBien}, idAgence=${aff.idAgence}, quantite=${aff.quantite}`)
      }
    })

    const sortedCombinaisons = combinaisons.sort((a, b) => {
      if (a.nomAgence === b.nomAgence) {
        return a.fonction.localeCompare(b.fonction)
      }
      return a.nomAgence.localeCompare(b.nomAgence)
    })

    console.log("COMBINAISONS AGENCE + FONCTION avec index:", sortedCombinaisons.map((c, i) => `${i}: ${c.nomAgence} - ${c.fonction}`).join(", "))
    return sortedCombinaisons
  }, [affectations, agences])

  const donneesAffectations = useMemo(() => {
    const result = []
    const uniqueIds = [...new Set(affectations.map((aff) => aff.idBien))]

    // Générer l'ordre des combinaisons basé sur l'en-tête
    const orderedCombinations = [];
    agences.forEach((agence) => {
      const fonctions = combinaisonsAgenceFonction.filter(c => c.idAgence === agence.id);
      orderedCombinations.push(...fonctions);
    });

    uniqueIds.forEach((idBien) => {
      const affectationsBien = affectations.filter((aff) => aff.idBien === idBien)
      const quantitesParCombinaison = orderedCombinations.map((comb, index) => {
        const totalQuantite = affectationsBien
          .filter((aff) => {
            return (
              aff.idAgence === comb.idAgence &&
              aff.fonction &&
              aff.fonction.trim().toLowerCase() === comb.fonction.toLowerCase() &&
              aff.quantite !== undefined
            )
          })
          .reduce((sum, aff) => sum + (Number(aff.quantite) || 0), 0)
        console.log(`idBien=${idBien}, index=${index}, comb=${comb.nomAgence}-${comb.fonction}, total=${totalQuantite}`)
        return totalQuantite
      })

      console.log(`Quantités pour idBien=${idBien} (${getNomBien(idBien)}):`, quantitesParCombinaison)
      result.push({
        idBien: idBien,
        designation: getNomBien(idBien),
        affectations: quantitesParCombinaison,
      })
    })

    console.log("Données affectations:", result)
    return result
  }, [affectations, combinaisonsAgenceFonction, inventaireData, agences])

  const exporterEnPDF = () => {
    try {
      const doc = new jsPDF()
      
      doc.setFontSize(16)
      doc.text("Inventaire des Immobiliers", 14, 20)
      autoTable(doc, {
        head: [
          [
            "Code Article",
            "Désignation",
            "Code Barre",
            "Prix d'achat",
            "Type",
            "Date d'acquisition",
            "Quantité",
            "Statut",
          ],
        ],
        body: filteredInventaire.map((item) => [
          item.codeArticle,
          item.designation,
          item.codeBarre,
          `${item.prixAchat.toLocaleString()} Ar`,
          item.typeImmobilier,
          item.dateAcquisition,
          item.quantite,
          item.statut === "actif" ? "Actif" : "Amorti",
        ]),
        startY: 30,
        theme: "grid",
        headStyles: { fillColor: [22, 160, 133] },
        styles: { fontSize: 8, cellPadding: 2 },
      })

      doc.save("inventaire-immobiliers.pdf")
      afficherToast("Exportation de l'inventaire en PDF réussie !", "succes")
    } catch (err) {
      console.error("Erreur lors de l'exportation en PDF:", err)
      afficherToast("Erreur lors de l'exportation de l'inventaire en PDF.", "error")
    }
  }

  const exporterAffectationsPDF = () => {
    try {
      const doc = new jsPDF("landscape")

      const headRow1 = [{ content: "Désignation", rowSpan: 2 }]
      const headRow2 = []

      agences.forEach((agence) => {
        const fonctions = combinaisonsAgenceFonction.filter((c) => c.idAgence === agence.id)
        if (fonctions.length > 0) {
          headRow1.push({ content: agence.nom, colSpan: fonctions.length })
          fonctions.forEach((f) => {
            headRow2.push({ content: f.fonction })
          })
        }
      })

      const body = donneesAffectations.map((item) => [
        item.designation,
        ...item.affectations.map((q) => (q > 0 ? q : "0")),
      ])

      autoTable(doc, {
        head: [headRow1, headRow2],
        body,
        startY: 20,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [41, 128, 185], halign: "center" },
      })

      doc.save("Affectations.pdf")
      afficherToast("Exportation du tableau des affectations réussie !", "succes")
    } catch (err) {
      console.error("Erreur lors de l'exportation des affectations en PDF:", err)
      afficherToast("Erreur lors de l'exportation du tableau des affectations.", "error")
    }
  }

  const afficherToast = (message, type) => {
    const id = Date.now()
    const nouveauToast = { id, message, type }
    setToasts((prev) => [...prev, nouveauToast])

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 3000)
  }

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
      </div>

      <div className="inventaire-actions">
        <button className="btn-exp" onClick={exporterEnPDF}>
          <FileDown size={16} /> Exporter l'inventaire en PDF
        </button>
        <button className="btn-exp" onClick={exporterAffectationsPDF}>
          <FileDown size={16} /> Exporter le tableau des affectations
        </button>
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={chargerDonnees}>
            <RefreshCw size={16} /> Réessayer
          </button>
        </div>
      )}

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
            <label htmlFor="filtreStatut">Statut :</label>
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
            <label htmlFor="filtreMois">Mois :</label>
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
            <label htmlFor="filtreAnnee">Année :</label>
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

        <div className="filtre-groupe">
          <div className="select-wrapper">
            <label htmlFor="filtreAgence">Agence :</label>
            <select
              id="filtreAgence"
              value={filtreAgence}
              onChange={(e) => setFiltreAgence(e.target.value)}
              className="select-filtre"
            >
              <option value="">Toutes</option>
              {agences.map((agence) => (
                <option key={agence.id} value={agence.id}>
                  {agence.nom}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="tableau-container">
        <h3>Inventaire des biens</h3>
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
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="no-data">
                  {loading
                    ? "Chargement..."
                    : 'Aucun article trouvé. Utilisez la page "Stock" pour ajouter des articles.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    <div className="tableau-container">
  <h3>Inventaire des Affectations</h3>
  {combinaisonsAgenceFonction.length === 0 ? (
    <div className="no-data">
      Aucune affectation valide trouvée. Vérifiez les données dans la base ou ajoutez des affectations.
    </div>
  ) : (
    <div className="table-responsive">
      <table className="tableau-inventaire">
        <thead>
          <tr>
            <th rowSpan="2">Désignation</th>
            {agences.map((agence) => {
              const fonctionsAgence = combinaisonsAgenceFonction.filter(
                (c) => c.idAgence === agence.id
              );
              return fonctionsAgence.length > 0 ? (
                <th key={agence.id} colSpan={fonctionsAgence.length}>
                  {agence.nom}
                </th>
              ) : null;
            })}
          </tr>
          <tr>
            {agences.map((agence) => {
              const fonctionsAgence = combinaisonsAgenceFonction.filter(
                (c) => c.idAgence === agence.id
              );
              return fonctionsAgence.map((comb) => (
                <th key={`${comb.idAgence}-${comb.fonction}`}>
                  {comb.fonction}
                </th>
              ));
            })}
          </tr>
        </thead>
        <tbody>
          {donneesAffectations.length > 0 ? (
            donneesAffectations.map((item, index) => (
              <tr key={`${item.idBien}-${index}`}>
                <td>{item.designation}</td>
                {item.affectations.map((quantite, qIndex) => (
                  <td
                    key={`${item.idBien}-${combinaisonsAgenceFonction[qIndex].idAgence}-${combinaisonsAgenceFonction[qIndex].fonction}-${index}`}
                  >
                    {quantite > 0 ? quantite : "0"}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={combinaisonsAgenceFonction.length + 1}
                className="no-data"
              >
                Aucune affectation trouvée pour les biens filtrés.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )}
</div>

      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <div className="toast-icon">
              {toast.type === "succes" ? (
                <CheckCircle size={20} />
              ) : (
                <AlertCircle size={20} />
              )}
            </div>
            <div className="toast-content">
              <p>{toast.message}</p>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="toast-close"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ImInventaire
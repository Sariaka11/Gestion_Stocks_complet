"use client"

import { useState, useEffect } from "react"
import { Search, Plus, Save, FileText, X, CheckCircle, AlertCircle } from "lucide-react"
import "./css/ImDispatche.css"
import { getImmobiliers } from "../../../services/immobilierServices"
import { getAgences } from "../../../services/agenceServices"
import { getBienAgences, createBienAgence } from "../../../services/bienAgenceServices"
import { useRefresh } from "../context/RefreshContext.jsx"

function ImDispatche() {
  const { triggerRefresh } = useRefresh()
  const [immobiliers, setImmobiliers] = useState([])
  const [agences, setAgences] = useState([])
  const [agencesAffichees, setAgencesAffichees] = useState([])
  const [affectations, setAffectations] = useState([])
  const [affectationEnEdition, setAffectationEnEdition] = useState(null)
  const [filtreDesignation, setFiltreDesignation] = useState("")
  const [filtreAgence, setFiltreAgence] = useState("")
  const [filtreAgenceTableau, setFiltreAgenceTableau] = useState("")
  const [modalOuvert, setModalOuvert] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState([])

  const [nouvelleAffectation, setNouvelleAffectation] = useState({
    idBien: "",
    idAgence: "",
    quantite: "",
    dateAffectation: "",
  })

  // Fonction pour afficher un toast
  const afficherToast = (message, type) => {
    const id = Date.now()
    const nouveauToast = { id, message, type }
    setToasts((prev) => [...prev, nouveauToast])
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 5000)
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([getImmobiliers(), getAgences(), getBienAgences()])
      .then(([resImmobiliers, resAgences, resAffectations]) => {
        // Formatage des immobiliers
        let immobiliersRaw = resImmobiliers.data
        if (!Array.isArray(immobiliersRaw)) {
          immobiliersRaw = immobiliersRaw?.["$values"] || []
        }
        setImmobiliers(immobiliersRaw)

        // Formatage des agences
        let agencesRaw = resAgences.data
        if (!Array.isArray(agencesRaw)) {
          agencesRaw = agencesRaw?.["$values"] || []
        }
        setAgences(agencesRaw)

        // Formatage des affectations
        let affectationsRaw = resAffectations.data
        if (!Array.isArray(affectationsRaw)) {
          affectationsRaw = affectationsRaw?.["$values"] || []
        }

        // Construire le tableau des affectations
        const lignes = immobiliersRaw.map((immobilier) => ({
          id: immobilier.idBien,
          designation: immobilier.nomBien,
          quantite: immobilier.quantite ,
          date: immobilier.dateAcquisition?.split("T")[0],
          affectations: agencesRaw.map((a) => ({
            agenceId: a.id,
            quantite: affectationsRaw
              .filter((aff) => aff.idBien === immobilier.idBien && aff.idAgence === a.id)
              .reduce((sum, aff) => sum + (aff.quantite ), 0),
          })),
        }))
        setAffectations(lignes)
      })
      .catch((err) => {
        console.error("Erreur chargement:", err)
        afficherToast("Erreur lors du chargement des données", "erreur")
      })
      .finally(() => setLoading(false))
  }, [])

  const ajouterAgenceTableau = () => {
    if (!filtreAgenceTableau) return
    const agence = agences.find((a) => a.id === parseInt(filtreAgenceTableau))
    if (agence && !agencesAffichees.find((a) => a.id === agence.id)) {
      setAgencesAffichees((prev) => [...prev, agence])
    }
    setFiltreAgenceTableau("")
  }

  const toggleEditionAffectation = (id) => {
    if (affectationEnEdition === id) {
      const ligne = affectations.find((a) => a.id === id)
      let totalQuantiteAffectee = 0

      // Calculer la quantité totale affectée
      ligne.affectations.forEach((a) => {
        if (a.quantite > 0) {
          totalQuantiteAffectee += a.quantite
        }
      })

      // Vérifier si la quantité totale est valide
      if (totalQuantiteAffectee > ligne.quantite) {
        afficherToast("La quantité totale dépasse le stock disponible", "erreur")
        return
      }

      // Envoyer les mises à jour pour chaque affectation
      const promises = ligne.affectations
        .filter((a) => a.quantite > 0)
        .map((a) =>
          createBienAgence({
            idBien: ligne.id,
            idAgence: a.agenceId,
            quantite: a.quantite,
            dateAffectation: new Date().toISOString(),
          })
        )

      Promise.all(promises)
        .then(() => {
          afficherToast("Affectation mise à jour avec succès", "succes")
          triggerRefresh()
          setAffectationEnEdition(null)
        })
        .catch((error) => {
          console.error("Erreur lors de la mise à jour de l'affectation:", error)
          if (error.code === "ECONNABORTED") {
            afficherToast("Requête interrompue, mais la mise à jour a peut-être réussi", "info")
            triggerRefresh()
          } else if (error.response?.status === 400) {
            afficherToast(error.response.data || "Données invalides", "erreur")
          } else {
            afficherToast("Erreur lors de la mise à jour de l'affectation", "erreur")
          }
        })
    } else {
      setAffectationEnEdition(id)
    }
  }

  const mettreAJourAffectation = (immobilierId, agenceId, qtt) => {
    setAffectations((prev) =>
      prev.map((a) => {
        if (a.id === immobilierId) {
          const majAff = a.affectations.map((aff) =>
            aff.agenceId === agenceId ? { ...aff, quantite: parseInt(qtt, 10) || 0 } : aff
          )
          return { ...a, affectations: majAff }
        }
        return a
      })
    )
  }

  const ouvrirModal = () => {
    setNouvelleAffectation({ idBien: "", idAgence: "", quantite: "", dateAffectation: "" })
    setFiltreDesignation("")
    setFiltreAgence("")
    setModalOuvert(true)
  }

  const fermerModal = () => {
    setModalOuvert(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setNouvelleAffectation((prev) => ({ ...prev, [name]: value }))
  }

const sauvegarderAffectation = async () => {
  try {
    const { idBien, idAgence, quantite, dateAffectation } = nouvelleAffectation;
    const immobilier = immobiliers.find((i) => i.idBien === parseInt(idBien));

    if (!immobilier || !idAgence || !quantite || !dateAffectation) {
      afficherToast("Veuillez remplir tous les champs.", "erreur");
      return;
    }

    const quantiteInt = parseInt(quantite);
    if (isNaN(quantiteInt) || quantiteInt <= 0) {
      afficherToast("La quantité doit être un nombre positif.", "erreur");
      return;
    }

    if (quantiteInt > (immobilier.quantite || 0)) {
      afficherToast("Quantité supérieure au stock disponible.", "erreur");
      return;
    }

    console.log("Données avant envoi:", { idBien, idAgence, quantite: quantiteInt, dateAffectation });

    await createBienAgence({
      idBien: parseInt(idBien),
      idAgence: parseInt(idAgence),
      quantite: quantiteInt,
      dateAffectation: new Date(dateAffectation).toISOString(),
    });

    afficherToast("Affectation enregistrée avec succès.", "succes");
    setModalOuvert(false);
    setNouvelleAffectation({
      idBien: "",
      idAgence: "",
      quantite: "",
      dateAffectation: "",
    });
    triggerRefresh();
  } catch (error) {
    console.error("Erreur lors de la création de l'affectation:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    if (error.code === "ECONNABORTED") {
      afficherToast("Requête interrompue, mais la mise à jour a peut-être réussi.", "info");
      triggerRefresh();
    } else if (error.response?.status === 400) {
      afficherToast(error.response.data || "Données invalides.", "erreur");
    } else {
      afficherToast(`Erreur lors de l'enregistrement: ${error.response?.data || error.message}`, "erreur");
    }
  }
};

  const affectationsFiltrees = affectations.filter((a) =>
    a.designation.toLowerCase().includes(filtreDesignation.toLowerCase())
  )

  return (
    <div className="page-dispatche animation-dispatche">
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Chargement en cours...</p>
        </div>
      )}

      <h1 className="titre-page">Gestion des Affectations d'Immobiliers</h1>

      <div className="section-dispatche">
        <div className="entete-section">
          <h2>Liste des Affectations</h2>
          <div className="actions-entete">
            <div className="champ-recherche-wrapper">
              <Search size={18} className="icone-recherche" />
              <input
                type="text"
                placeholder="Filtrer par désignation..."
                value={filtreDesignation}
                onChange={(e) => setFiltreDesignation(e.target.value)}
                className="champ-filtre"
              />
            </div>
            <div className="champ-recherche-wrapper">
              <Search size={18} className="icone-recherche" />
              <select
                value={filtreAgenceTableau}
                onChange={(e) => setFiltreAgenceTableau(e.target.value)}
                className="champ-filtre"
              >
                <option value="">Sélectionner une agence</option>
                {agences.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nom}
                  </option>
                ))}
              </select>
            </div>
            <button className="bouton-ajouter" onClick={ajouterAgenceTableau}>
              <Plus size={16} /> Ajouter
            </button>
            <button className="bouton-ajouter" onClick={ouvrirModal}>
              <Plus size={16} /> Créer une affectation
            </button>
          </div>
        </div>

        <div className="tableau-dispatche-wrapper">
          <div className="tableau-dispatche">
            <table>
              <thead>
                <tr>
                  <th>Désignation</th>
                  <th>Quantité</th>
                  {agencesAffichees.length > 0 && <th colSpan={agencesAffichees.length}>Affectations par agence</th>}
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
                {agencesAffichees.length > 0 && (
                  <tr>
                    <th></th>
                    <th></th>
                    {agencesAffichees.map((agence) => (
                      <th key={agence.id} className="th-agence">
                        {agence.nom}
                      </th>
                    ))}
                    <th></th>
                    <th></th>
                  </tr>
                )}
              </thead>
              <tbody>
                {affectationsFiltrees.length > 0 ? (
                  affectationsFiltrees.map((affectation) => (
                    <tr key={affectation.id}>
                      <td>{affectation.designation}</td>
                      <td>{affectation.quantite}</td>
                      {agencesAffichees.map((agence) => {
                        const aff = affectation.affectations?.find((a) => a.agenceId === agence.id)
                        return (
                          <td key={`${affectation.id}-${agence.id}`}>
                            <input
                              type="number"
                              min="0"
                              max={affectation.quantite}
                              value={aff?.quantite || 0}
                              onChange={(e) =>
                                mettreAJourAffectation(affectation.id, agence.id, e.target.value)
                              }
                              className="input-consommation"
                              disabled={affectationEnEdition !== affectation.id}
                            />
                          </td>
                        )
                      })}
                      <td>{affectation.date}</td>
                      <td className="actions-cellule">
                        <button
                          className={`bouton-modifier ${affectationEnEdition === affectation.id ? "actif" : ""}`}
                          onClick={() => toggleEditionAffectation(affectation.id)}
                        >
                          {affectationEnEdition === affectation.id ? (
                            <>
                              <Save size={14} /> Enregistrer
                            </>
                          ) : (
                            <>
                              <Save size={14} /> Modifier
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={agencesAffichees.length > 0 ? agencesAffichees.length + 4 : 4} className="no-data">
                      Aucune donnée trouvée. Utilisez le bouton "Créer une affectation" pour ajouter des données.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOuvert && (
        <div className="modal-overlay">
          <div className="modal-contenu">
            <h2>Créer une affectation d'immobilier</h2>
            <div className="formulaire-modal">
              <div className="groupe-champ">
                <label htmlFor="filtreImmobilier">Rechercher un immobilier</label>
                <input
                  type="text"
                  placeholder="Filtrer..."
                  value={filtreDesignation}
                  onChange={(e) => setFiltreDesignation(e.target.value)}
                />
                <select
                  name="idBien"
                  value={nouvelleAffectation.idBien}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Sélectionner --</option>
                  {immobiliers
                    .filter((i) =>
                      i.nomBien.toLowerCase().includes(filtreDesignation.toLowerCase())
                    )
                    .map((i) => (
                      <option key={i.idBien} value={i.idBien}>
                        {i.nomBien}
                      </option>
                    ))}
                </select>
              </div>

              <div className="groupe-champ">
                <label htmlFor="filtreAgence">Rechercher une agence</label>
                <input
                  type="text"
                  placeholder="Filtrer..."
                  value={filtreAgence}
                  onChange={(e) => setFiltreAgence(e.target.value)}
                />
                <select
                  name="idAgence"
                  value={nouvelleAffectation.idAgence}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Sélectionner --</option>
                  {agences
                    .filter((a) =>
                      a.nom.toLowerCase().includes(filtreAgence.toLowerCase())
                    )
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nom}
                      </option>
                    ))}
                </select>
              </div>

              <div className="groupe-champ">
                <label htmlFor="quantite">Quantité</label>
                <input
                  type="number"
                  name="quantite"
                  min="1"
                  value={nouvelleAffectation.quantite}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="groupe-champ">
                <label htmlFor="dateAffectation">Date</label>
                <input
                  type="date"
                  name="dateAffectation"
                  value={nouvelleAffectation.dateAffectation}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="actions-modal">
                <button className="bouton-annuler" onClick={fermerModal}>
                  Annuler
                </button>
                <button className="bouton-sauvegarder" onClick={sauvegarderAffectation}>
                  Valider
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <div className="toast-icon">
              <FileText size={20} />
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

export default ImDispatche
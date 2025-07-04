"use client"

import { useState, useEffect } from "react"
import { Search, Plus, Save, FileText, X } from "lucide-react"
import "./css/ImDispatche.css"
import { getImmobiliers } from "../../../services/immobilierServices"
import { getAgences } from "../../../services/agenceServices"
import { getBienAgences, createBienAgence } from "../../../services/bienAgenceServices"
import axios from "axios"

function ImDispatche() {
  const [immobiliers, setImmobiliers] = useState([])
  const [agences, setAgences] = useState([])
  const [agencesAffichees, setAgencesAffichees] = useState([])
  const [affectations, setAffectations] = useState([])
  const [affectationEnEdition, setAffectationEnEdition] = useState(null)
  const [filtreDesignation, setFiltreDesignation] = useState("")
  const [filtreAgence, setFiltreAgence] = useState("")
  const [filtreAgenceTableau, setFiltreAgenceTableau] = useState("")
  const [filtreFonctionTableau, setFiltreFonctionTableau] = useState("")
  const [modalOuvert, setModalOuvert] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState([])

  const fonctions = [
    "Direction",
    "Comptabilité",
    "Ressources Humaines",
    "Informatique",
    "Logistique",
    "Marketing",
    "Ventes",
    "Production",
    "Non spécifiée"
  ]

  const [nouvelleAffectation, setNouvelleAffectation] = useState({
    idBien: "",
    idAgence: "",
    quantite: "",
    fonction: ""
  })

  const afficherToast = (message, type) => {
    console.log(`Toast affiché : ${message} (type: ${type})`)
    const id = Date.now()
    const nouveauToast = { id, message, type }
    setToasts((prev) => [...prev, nouveauToast])
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 5000)
  }

  const triggerRefresh = () => {
    getBienAgences().then((res) => {
      console.log("Réponse brute de getBienAgences :", res.data)
      let data = res.data
      if (res.data && res.data.values && Array.isArray(res.data.values)) {
        data = res.data.values
      }
      if (Array.isArray(data)) {
        console.log("Données après extraction :", data)
        const dataValide = data.filter((a) => a && a.nomBien)
        console.log("Données valides après filtrage :", dataValide)
        setAffectations(dataValide)
      } else {
        console.warn("Réponse inattendue :", res.data)
        setAffectations([])
      }
    }).catch((err) => {
      console.error("Erreur lors du refresh :", err)
      setAffectations([])
    })
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([getImmobiliers(), getAgences(), getBienAgences()])
      .then(([resImmobiliers, resAgences, resAffectations]) => {
        let immobiliersRaw = resImmobiliers.data
        if (!Array.isArray(immobiliersRaw)) {
          immobiliersRaw = immobiliersRaw?.["$values"] || []
        }
        setImmobiliers(immobiliersRaw)
        console.log("Immobiliers chargés :", immobiliersRaw)

        let agencesRaw = resAgences.data
        if (!Array.isArray(agencesRaw)) {
          agencesRaw = agencesRaw?.["$values"] || []
        }
        setAgences(agencesRaw)
        console.log("Agences chargées :", agencesRaw)

        let affectationsRaw = resAffectations.data
        if (!Array.isArray(affectationsRaw)) {
          affectationsRaw = affectationsRaw?.["$values"] || []
        }
        console.log("Affectations brutes :", affectationsRaw)

        const lignes = immobiliersRaw.map((immobilier) => ({
          id: immobilier.idBien,
          designation: immobilier.nomBien,
          quantite: immobilier.quantite,
          affectations: agencesRaw.flatMap((a) =>
            fonctions.map((f) => {
              const aff = affectationsRaw.find(
                (aff) => aff.idBien === immobilier.idBien && aff.idAgence === a.id && aff.fonction === f
              )
              return {
                agenceId: a.id,
                quantite: aff ? aff.quantite || 0 : 0,
                fonction: f,
                dateAffectation: aff ? aff.dateAffectation : null
              }
            })
          )
        }))
        console.log("Lignes d'affectations construites :", lignes)
        setAffectations(lignes)
      })
      .catch((err) => {
        console.error("Erreur chargement:", err)
        afficherToast("Erreur lors du chargement des données", "erreur")
      })
      .finally(() => setLoading(false))
  }, [])

  const ajouterAgenceTableau = () => {
    if (!filtreAgenceTableau || !filtreFonctionTableau) {
      afficherToast("Veuillez sélectionner une agence et une fonction.", "erreur")
      return
    }
    const agence = agences.find((a) => a.id === parseInt(filtreAgenceTableau))
    if (agence && !agencesAffichees.find((a) => a.id === agence.id && a.fonction === filtreFonctionTableau)) {
      setAgencesAffichees((prev) => [...prev, { ...agence, fonction: filtreFonctionTableau }])
      console.log(`Agence ajoutée au tableau : ${agence.nom} - ${filtreFonctionTableau}`)
    }
    setFiltreAgenceTableau("")
    setFiltreFonctionTableau("")
  }

  const toggleEditionAffectation = (id) => {
    console.log(`toggleEditionAffectation appelé avec id: ${id}, affectationEnEdition actuel: ${affectationEnEdition}`)
    if (affectationEnEdition === id) {
      const ligne = affectations.find((a) => a.id === id)
      let totalQuantiteAffectee = 0

      ligne.affectations.forEach((a) => {
        if (a.quantite > 0) {
          totalQuantiteAffectee += a.quantite
        }
      })

      if (totalQuantiteAffectee > ligne.quantite) {
        afficherToast("La quantité totale dépasse le stock disponible", "erreur")
        return
      }

      const premiereAffectation = ligne.affectations.find((a) => a.quantite > 0)
      if (premiereAffectation) {
        const fonction = premiereAffectation.fonction || "Non spécifiée"
        console.log(`Envoi pour idBien: ${ligne.id}, idAgence: ${premiereAffectation.agenceId}, quantite: ${premiereAffectation.quantite}, fonction: ${fonction}`)

        const dateAffectation = new Date().toISOString().split("T")[0] // Format YYYY-MM-DD
        createBienAgence({
          idBien: ligne.id,
          idAgence: premiereAffectation.agenceId,
          quantite: premiereAffectation.quantite,
          dateAffectation: dateAffectation,
          fonction: fonction,
          quantiteConso: 0
        })
          .then(() => {
            afficherToast("Affectation mise à jour avec succès", "succes")
            triggerRefresh()
            setAffectationEnEdition(null)
            console.log("Mode édition désactivé")
          })
          .catch((error) => {
            console.error("Erreur lors de la mise à jour de l'affectation:", error)
            let errorMessage = error.response?.data || "Erreur lors de la mise à jour de l'affectation"
            afficherToast(errorMessage, "erreur")
          })
      } else {
        afficherToast("Aucune affectation à mettre à jour", "info")
        setAffectationEnEdition(null)
        console.log("Mode édition désactivé - aucune affectation")
      }
    } else {
      setAffectationEnEdition(id)
      console.log(`Mode édition activé pour id: ${id}`)
    }
  }

  const mettreAJourAffectation = (immobilierId, agenceId, qtt, fonction) => {
    console.log(`mettreAJourAffectation appelé: immobilierId=${immobilierId}, agenceId=${agenceId}, qtt=${qtt}, fonction=${fonction}`)
    setAffectations((prev) =>
      prev.map((a) => {
        if (a.id === immobilierId) {
          const majAff = a.affectations.map((aff) =>
            aff.agenceId === agenceId && aff.fonction === fonction
              ? { ...aff, quantite: parseInt(qtt, 10) || 0 }
              : aff
          )
          console.log(`Affectations mises à jour pour immobilierId=${immobilierId}:`, majAff)
          return { ...a, affectations: majAff }
        }
        return a
      })
    )
  }

  const ouvrirModal = () => {
    setNouvelleAffectation({ idBien: "", idAgence: "", quantite: "", fonction: "" })
    setFiltreDesignation("")
    setFiltreAgence("")
    setModalOuvert(true)
  }

  const fermerModal = () => {
    setModalOuvert(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    console.log(`Champ modifié - ${name}: ${value}`)
    setNouvelleAffectation((prev) => ({ ...prev, [name]: value }))
  }

  async function verifierQuantiteDisponible(idBien) {
    try {
      const response = await axios.get(`http://localhost:5000/api/Immobilisations/${idBien}`)
      return response.data.quantite || 0
    } catch (error) {
      console.error("Erreur lors de la vérification de la quantité disponible :", error)
      afficherToast("Erreur lors de la vérification de la quantité disponible", "erreur")
      return 0
    }
  }

  async function sauvegarderAffectation() {
    try {
      console.log("Démarrage de sauvegarderAffectation", nouvelleAffectation)
      const { idBien, idAgence, quantite, fonction } = nouvelleAffectation
      console.log("Valeurs des champs :", { idBien, idAgence, quantite, fonction })

      // Validations
      if (!idBien) {
        console.log("Erreur : idBien est vide")
        afficherToast("Veuillez sélectionner un immobilier.", "erreur")
        return
      }
      const parsedIdBien = parseInt(idBien)
      if (isNaN(parsedIdBien)) {
        console.log("Erreur : idBien n'est pas un nombre valide", idBien)
        afficherToast("L'ID de l'immobilier n'est pas valide.", "erreur")
        return
      }
      const immobilier = immobiliers.find((i) => i.idBien === parsedIdBien)
      if (!immobilier) {
        console.log("Erreur : Aucun immobilier trouvé pour idBien =", parsedIdBien)
        afficherToast("Aucun immobilier trouvé pour l'ID spécifié.", "erreur")
        return
      }
      if (!idAgence) {
        console.log("Erreur : idAgence est vide")
        afficherToast("Veuillez sélectionner une agence.", "erreur")
        return
      }
      const parsedIdAgence = parseInt(idAgence)
      if (isNaN(parsedIdAgence)) {
        console.log("Erreur : idAgence n'est pas un nombre valide", idAgence)
        afficherToast("L'ID de l'agence n'est pas valide.", "erreur")
        return
      }
      if (!quantite) {
        console.log("Erreur : quantite est vide")
        afficherToast("Veuillez spécifier une quantité.", "erreur")
        return
      }
      const quantiteInt = parseInt(quantite)
      if (isNaN(quantiteInt) || quantiteInt <= 0) {
        console.log("Erreur : quantiteInt =", quantiteInt)
        afficherToast("La quantité doit être un nombre positif.", "erreur")
        return
      }
      if (!fonction) {
        console.log("Erreur : fonction est vide")
        afficherToast("Veuillez sélectionner une fonction.", "erreur")
        return
      }

      // Vérifier la quantité disponible
      const quantiteDisponible = await verifierQuantiteDisponible(parsedIdBien)
      const quantiteDejaAffectee = affectations
        .find((a) => a.id === parsedIdBien)
        ?.affectations.reduce((sum, aff) => sum + (aff.quantite || 0), 0) || 0
      const quantiteRestante = quantiteDisponible - quantiteDejaAffectee

      console.log("Quantité disponible :", quantiteDisponible, "Quantité déjà affectée :", quantiteDejaAffectee, "Quantité restante :", quantiteRestante)

      if (quantiteInt > quantiteRestante) {
        console.log("Erreur : quantiteInt =", quantiteInt, "supérieur à quantiteRestante =", quantiteRestante)
        afficherToast(`Quantité demandée (${quantiteInt}) dépasse le stock restant (${quantiteRestante}).`, "erreur")
        return
      }

      // Préparer les données pour la requête POST avec la date d'aujourd'hui
      const dateAffectation = new Date().toISOString().split("T")[0] // Format YYYY-MM-DD
      const payload = {
        idBien: parsedIdBien,
        idAgence: parsedIdAgence,
        quantite: quantiteInt,
        dateAffectation: dateAffectation,
        fonction: fonction,
        quantiteConso: 0
      }

      console.log("Données envoyées à createBienAgence :", payload)

      // Envoyer la requête POST
      await createBienAgence(payload)

      afficherToast("Affectation créée ou mise à jour avec succès.", "succes")
      setModalOuvert(false)
      setNouvelleAffectation({
        idBien: "",
        idAgence: "",
        quantite: "",
        fonction: ""
      })
      triggerRefresh()
    } catch (error) {
      console.error("Erreur dans sauvegarderAffectation :", {
        message: error.message,
        stack: error.stack,
        status: error.response?.status,
        data: error.response?.data
      })
      let errorMessage = error.response?.data || "Erreur lors de l'enregistrement."
      afficherToast(errorMessage, "erreur")
    }
  }

  const affectationsFiltrees = affectations.filter(
    (a) =>
      a &&
      typeof a.designation === "string" &&
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
            <div className="champ-recherche-wrapper">
              <select
                value={filtreFonctionTableau}
                onChange={(e) => setFiltreFonctionTableau(e.target.value)}
                className="champ-filtre"
              >
                <option value="">Sélectionner une fonction</option>
                {fonctions.map((fonction) => (
                  <option key={fonction} value={fonction}>
                    {fonction}
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
                  <th>Actions</th>
                </tr>
                {agencesAffichees.length > 0 && (
                  <tr>
                    <th></th>
                    <th></th>
                    {agencesAffichees.map((agence) => (
                      <th key={`${agence.id}-${agence.fonction}`} className="th-agence">
                        {`${agence.nom} - ${agence.fonction}`}
                      </th>
                    ))}
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
                        const aff = affectation.affectations.find(
                          (a) => a.agenceId === agence.id && a.fonction === agence.fonction
                        )
                        console.log(
                          `Rendu input pour idBien=${affectation.id}, agenceId=${agence.id}, fonction=${agence.fonction}, quantite=${aff?.quantite || 0}, disabled=${affectationEnEdition !== affectation.id}`
                        )
                        return (
                          <td key={`${affectation.id}-${agence.id}-${agence.fonction}`}>
                            <input
                              type="number"
                              min="0"
                              max={affectation.quantite}
                              value={aff?.quantite || 0}
                              onChange={(e) =>
                                mettreAJourAffectation(affectation.id, agence.id, e.target.value, agence.fonction)
                              }
                              className="input-consommation"
                              disabled={affectationEnEdition !== affectation.id}
                            />
                          </td>
                        )
                      })}
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
                    <td colSpan={agencesAffichees.length > 0 ? agencesAffichees.length + 3 : 3} className="no-data">
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
                <label htmlFor="fonction">Fonction</label>
                <select
                  name="fonction"
                  value={nouvelleAffectation.fonction}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Sélectionner --</option>
                  {fonctions.map((fonction) => (
                    <option key={fonction} value={fonction}>
                      {fonction}
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
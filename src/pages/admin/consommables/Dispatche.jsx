"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash, Save, FileText } from "lucide-react";
import {
  getAgences,
  deleteAgence,
} from "../../../services/agenceServices";
import {
  getFournitures,
  updateFourniture,
} from "../../../services/fournituresServices.js";
import {
  createAgenceFourniture,
} from "../../../services/agenceFournituresServices.js";
import { useRefresh } from "../context/RefreshContext.jsx";
import "./css/Dispatche.css";

function Dispatche() {
  const { triggerRefresh } = useRefresh();
  const [agences, setAgences] = useState([]);
  const [agencesAffichees, setAgencesAffichees] = useState([]);
  const [fournitures, setFournitures] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [dispatchEnEdition, setDispatchEnEdition] = useState(null);
  const [filtreDesignation, setFiltreDesignation] = useState("");
  const [filtreFourniture, setFiltreFourniture] = useState("");
  const [filtreAgence, setFiltreAgence] = useState("");
  const [filtreAgenceTableau, setFiltreAgenceTableau] = useState("");
  const [modalOuvert, setModalOuvert] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  const [nouveauDispatch, setNouveauDispatch] = useState({
    fournitureId: "",
    agenceId: "",
    quantite: "",
    date: "",
  });

  // Fonction pour afficher un toast
  const afficherToast = (message, type) => {
    const id = Date.now();
    const nouveauToast = { id, message, type };
    setToasts((prev) => [...prev, nouveauToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  };

  // Supprimer un toast spécifique
  const supprimerToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([getAgences(), getFournitures()])
      .then(([resAgences, resFournitures]) => {
        // On récupère les agences au bon format
        let agencesRaw = resAgences.data;
        if (!Array.isArray(agencesRaw)) {
          agencesRaw = agencesRaw?.["$values"] || [];
        }
        setAgences(agencesRaw);

        // On récupère les fournitures au bon format
        let fournituresRaw = resFournitures.data;
        if (!Array.isArray(fournituresRaw)) {
          fournituresRaw = fournituresRaw?.["$values"] || [];
        }
        setFournitures(fournituresRaw);

        // Construire le tableau dispatches avec agences déballées
        const lignes = fournituresRaw.map((f) => ({
          id: f.Id,
          designation: f.Nom,
          quantite: f.QuantiteRestante,
          date: f.date?.split("T")[0],
          consommations: agencesRaw.map((a) => ({ agenceId: a.id, quantite: 0 })),
        }));

        setDispatches(lignes);
      })
      .catch((err) => {
        console.error("Erreur chargement:", err);
        afficherToast("Erreur lors du chargement des données", "erreur");
      })
      .finally(() => setLoading(false));
  }, []);

  const ajouterAgenceTableau = () => {
    if (!filtreAgenceTableau) return;
    const agence = agences.find((a) => a.Id == parseInt(filtreAgenceTableau));
    console.log("*-*-*-*", filtreAgenceTableau,agence)
    if (agence && !agencesAffichees.find((a) => a.id === agence.Id)) {
      setAgencesAffichees((prev) => [...prev, agence]);
    }
    setFiltreAgenceTableau("");
  };

const supprimerAgence = (id) => {
  // Supprimer l'agence uniquement de agencesAffichees (front-end)
  setAgencesAffichees((prev) => prev.filter((a) => a.Id !== id));
  
  // Mettre à jour dispatches pour retirer la consommation associée à l'agence supprimée
  setDispatches((prev) =>
    prev.map((d) => ({
      ...d,
      consommations: d.consommations.filter((c) => c.AgenceId !== id),
    }))
  );
  
  // Afficher un toast pour confirmer la suppression
  afficherToast("Colonne d'agence supprimée", "succes");
};

  const toggleEditionDispatch = (id) => {
    if (dispatchEnEdition === id) {
      const ligne = dispatches.find((d) => d.id === id);
      let totalQuantiteDeduite = 0;

      // Calculer la quantité totale à déduire
      ligne.consommations.forEach((c) => {
        if (c.quantite > 0) {
          totalQuantiteDeduite += c.quantite;
        }
      });

      // Vérifier si la quantité totale est valide
      if (totalQuantiteDeduite > ligne.quantite) {
        afficherToast("La quantité totale dépasse le stock restant", "erreur");
        return;
      }

      // Envoyer les mises à jour pour chaque consommation
      const promises = ligne.consommations
        .filter((c) => c.quantite > 0)
        .map((c) =>
          createAgenceFourniture({
            agenceId: c.AgenceId,
            fournitureId: ligne.Id,
            quantite: c.Quantite,
            dateAssociation: new Date().toISOString(),
          })
        );

      Promise.all(promises)
        .then(() => {
          const newRestante = ligne.quantite - totalQuantiteDeduite;
          updateFourniture(ligne.id, {
            id: ligne.Id,
            nom: ligne.Nom,
            quantite: ligne.Quantite,
            prixUnitaire: fournitures.find((f) => f.id === ligne.id)?.PrixUnitaire || 0,
            categorie: fournitures.find((f) => f.id === ligne.id)?.Categorie || "",
            quantiteRestante: newRestante,
            date: new Date().toISOString(),
          }).then(() => {
            // Mettre à jour l'état local
            setFournitures((prev) =>
              prev.map((f) =>
                f.id === ligne.id ? { ...f, quantiteRestante: newRestante } : f
              )
            );
            setDispatches((prev) =>
              prev.map((d) =>
                d.id === ligne.id ? { ...d, quantite: newRestante } : d
              )
            );

            afficherToast("Dispatch mis à jour avec succès", "succes");
            triggerRefresh(); // Déclenche la mise à jour dans Inventaire.jsx
          });
        })
        .catch((error) => {
          console.error("Erreur lors de la mise à jour du dispatch:", error);
          if (error.code === "ECONNABORTED") {
            //afficherToast("Requête interrompue, mais la mise à jour a peut-être réussi", "info");
            triggerRefresh(); // Tente de synchroniser
          } else if (error.response?.status === 400) {
           // afficherToast(error.response.data || "Données invalides", "erreur");
          } else {
            //afficherToast("Erreur lors de la mise à jour du dispatch", "erreur");
          }
        });

      setDispatchEnEdition(null);
    } else {
      setDispatchEnEdition(id);
    }
  };

  const mettreAJourConsommation = (dispatchId, agenceId, qtt) => {
    setDispatches((prev) =>
      prev.map((d) => {
        if (d.Id === dispatchId) {
          const majCons = d.consommations.map((c) =>
            c.AgenceId === agenceId ? { ...c, quantite: parseInt(qtt, 10) || 0 } : c
          );
          return { ...d, consommations: majCons };
        }
        return d;
      })
    );
  };

  const supprimerDispatch = (id) => {
    setDispatches((prev) => prev.filter((d) => d.id !== id));
    afficherToast("Dispatch supprimé avec succès", "succes");
  };



  const fermerModal = () => {
    setModalOuvert(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNouveauDispatch((prev) => ({ ...prev, [name]: value }));
  };

  const sauvegarderDispatch = () => {
    const { fournitureId, agenceId, quantite, date } = nouveauDispatch;
    const fourniture = fournitures.find((f) => f.id === parseInt(fournitureId));
    if (!fourniture || !agenceId || !quantite || !date) {
      afficherToast("Veuillez remplir tous les champs", "erreur");
      return;
    }

    const quantiteInt = parseInt(quantite);
    if (isNaN(quantiteInt) || quantiteInt <= 0) {
      afficherToast("La quantité doit être un nombre positif", "erreur");
      return;
    }

    if (quantiteInt > fourniture.quantiteRestante) {
      afficherToast("Quantité supérieure au stock restant", "erreur");
      return;
    }

    const quantiteRestante = fourniture.quantiteRestante - quantiteInt;

    createAgenceFourniture({
      agenceId: parseInt(agenceId),
      fournitureId: fourniture.id,
      quantite: quantiteInt,
      dateAssociation: new Date(date).toISOString(),
    })
      .then(() => {
        updateFourniture(fourniture.id, {
          ...fourniture,
          quantiteRestante,
          date: new Date().toISOString(),
        }).then(() => {
          // Mettre à jour l'état local
          setFournitures((prev) =>
            prev.map((f) =>
              f.id === fourniture.id ? { ...f, quantiteRestante } : f
            )
          );
          setDispatches((prev) =>
            prev.map((d) =>
              d.id === fourniture.id
                ? {
                    ...d,
                    quantite: quantiteRestante,
                    consommations: d.consommations.map((c) =>
                      c.AgenceId === parseInt(agenceId)
                        ? { ...c, quantite: c.quantite + quantiteInt }
                        : c
                    ),
                  }
                : d
            )
          );

          setModalOuvert(false);
          afficherToast("Dispatch enregistré avec succès", "succes");
          triggerRefresh(); // Déclenche la mise à jour dans Inventaire.jsx
        });
      })
      .catch((error) => {
        console.error("Erreur lors de la création du dispatch:", error);
        if (error.code === "ECONNABORTED") {
          afficherToast("Requête interrompue, mais la mise à jour a peut-être réussi", "info");
          triggerRefresh(); // Tente de synchroniser
        } else if (error.response?.status === 400) {
          afficherToast(error.response.data || "Données invalides", "erreur");
        } else {
          afficherToast("Erreur lors de l'enregistrement du dispatch", "erreur");
        }
      });
  };

  const dispatchesFiltres = dispatches.filter((d) =>
    d.designation.toLowerCase().includes(filtreDesignation.toLowerCase())
  );

  return (
    <div className="page-dispatche animation-dispatche">
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Chargement en cours...</p>
        </div>
      )}

      <h1 className="titre-page">Gestion des Agences</h1>

      <div className="section-dispatche">
        <div className="entete-section">
          <h2>Liste des Agences</h2>
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
                  <option key={a.Id} value={a.Id}>
                    {a.Nom}
                  </option>
                ))}
              </select>
            </div>
            <button className="bouton-ajouter" onClick={ajouterAgenceTableau}>
              <Plus size={16} /> Ajouter
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
                  {agencesAffichees.length > 0 && <th colSpan={agencesAffichees.length}>Consommations des agences</th>}
                  {/* <th>Date</th> */}
                  <th>Actions</th>
                </tr>
                {agencesAffichees.length > 0 && (
                  <tr>
                    <th></th>
                    <th></th>
                    {agencesAffichees.map((agence) => (
                      <th key={agence.Id} className="th-agence">
                        {agence.Nom}
                        <button
                          className="bouton-supprimer-agence"
                          onClick={() => supprimerAgence(agence.Id)}
                        >
                          <Trash size={14} />
                        </button>
                      </th>
                    ))}
                    <th></th>
                    <th></th>
                  </tr>
                )}
              </thead>
              <tbody>
                {dispatchesFiltres.length > 0 ? (
                  dispatchesFiltres.map((dispatch) => (
                    <tr key={dispatch.id}>
                      <td>{dispatch.designation}</td>
                      <td>{dispatch.quantite}</td>
                      {agencesAffichees.map((agence) => {
                        const consommation = dispatch.consommations?.find((c) => c.AgenceId === agence.id);
                        return (
                          <td key={`${dispatch.id}-${agence.id}`}>
                            <input
                              type="number"
                              min="0"
                              max={dispatch.quantite}
                              value={consommation?.quantite || 0}
                              onChange={(e) =>
                                mettreAJourConsommation(dispatch.id, agence.id, e.target.value)
                              }
                              className="input-consommation"
                              disabled={dispatchEnEdition !== dispatch.id}
                            />
                          </td>
                        );
                      })}
                      {/* <td>{dispatch.date}</td> */}
                      <td className="actions-cellule">
                        <button
                          className={`bouton-modifier ${dispatchEnEdition === dispatch.id ? "actif" : ""}`}
                          onClick={() => toggleEditionDispatch(dispatch.id)}
                        >
                          {dispatchEnEdition === dispatch.id ? (
                            <>
                              <Save size={14} /> Enregistrer
                            </>
                          ) : (
                            <>
                              <Edit size={14} /> Modifier
                            </>
                          )}
                        </button>
                        <button className="bouton-supprimer" onClick={() => supprimerDispatch(dispatch.id)}>
                          <Trash size={14} /> Supprimer
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={agencesAffichees.length > 0 ? agencesAffichees.length + 4 : 4} className="no-data">
                      Aucune donnée trouvée. Utilisez le bouton "Créer un envoi" pour ajouter des données.
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
            <h2>Créer un envoi de fourniture</h2>
            <div className="formulaire-modal">
              <div className="groupe-champ">
                <label htmlFor="filtreFourniture">Rechercher une fourniture</label>
                <input
                  type="text"
                  placeholder="Filtrer..."
                  value={filtreFourniture}
                  onChange={(e) => setFiltreFourniture(e.target.value)}
                />
                <select
                  name="fournitureId"
                  value={nouveauDispatch.fournitureId}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Sélectionner --</option>
                  {fournitures
                    .filter((f) =>
                      f.nom.toLowerCase().includes(filtreFourniture.toLowerCase())
                    )
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nom}
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
                  name="agenceId"
                  value={nouveauDispatch.AgenceId}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Sélectionner --</option>
                  {agences
                    .filter((a) =>
                      a.Nom.toLowerCase().includes(filtreAgence.toLowerCase())
                    )
                    .map((a) => (
                      <option key={a.Id} value={a.Id}>
                        {a.Nom}
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
                  value={nouveauDispatch.quantite}
                  onChange={handleChange}
                  required
                />
              </div>
              {/* <div className="groupe-champ">
                <label htmlFor="date">Date</label>
                <input
                  type="date"
                  name="date"
                  value={nouveauDispatch.date}
                  onChange={handleChange}
                  required
                />
              </div> */}
              <div className="actions-modal">
                <button className="bouton-annuler" onClick={fermerModal}>
                  Annuler
                </button>
                <button className="bouton-sauvegarder" onClick={sauvegarderDispatch}>
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
            <button onClick={() => supprimerToast(toast.id)} className="toast-close">
              <Trash size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dispatche;
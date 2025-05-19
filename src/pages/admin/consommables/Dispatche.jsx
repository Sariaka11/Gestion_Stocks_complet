// ✅ Dispatche.jsx — Avec bouton "Créer", modal et envoi des fournitures à une agence

"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash, Save } from "lucide-react";
import {
  getAgences,
  createAgence,
  deleteAgence,
} from "../../../services/agenceServices";
import {
  getFournitures,
  updateFourniture,
} from "../../../services/fournituresServices";
import {
  createDispatch,
} from "../../../services/agenceFournituresServices";
import "./css/Dispatche.css";

function Dispatche() {
  const [agences, setAgences] = useState([]);
  const [fournitures, setFournitures] = useState([]);
  const [nouvelleAgence, setNouvelleAgence] = useState("");
  const [dispatches, setDispatches] = useState([]);
  const [dispatchEnEdition, setDispatchEnEdition] = useState(null);
  const [filtreDesignation, setFiltreDesignation] = useState("");
  const [listeAgencesOuverte, setListeAgencesOuverte] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filtreFourniture, setFiltreFourniture] = useState("");
  const [filtreAgence, setFiltreAgence] = useState("");
  const [modalAgenceOuvert, setModalAgenceOuvert] = useState(false);


  const [modalOuvert, setModalOuvert] = useState(false);
  const [nouveauDispatch, setNouveauDispatch] = useState({
    fournitureId: "",
    agenceId: "",
    quantite: "",
    date: "",
  });

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
      id: f.id,
      designation: f.nom,
      quantite: f.quantiteRestante,
      date: f.date?.split("T")[0],
      consommations: agencesRaw.map((a) => ({ agenceId: a.id, quantite: 0 })),
    }));

    setDispatches(lignes);
  })
  .catch((err) => console.error("Erreur chargement:", err))
  .finally(() => setLoading(false));


  }, []);

  const ajouterAgence = () => {
    if (!nouvelleAgence.trim()) return;
    createAgence({ nom: nouvelleAgence })
      .then((res) => {
        const nouvelle = res.data;
        setAgences((prev) => [...prev, nouvelle]);
        setDispatches((prev) =>
          prev.map((d) => ({
            ...d,
            consommations: [...d.consommations, { agenceId: nouvelle.id, quantite: 0 }],
          }))
        );
        setNouvelleAgence("");
      })
      .catch((err) => console.error("Erreur ajout agence:", err));
  };

  const toggleListeAgences = () => {
    setListeAgencesOuverte(!listeAgencesOuverte);
  };

  const supprimerAgence = (id) => {
    deleteAgence(id)
      .then(() => {
        setAgences((prev) => prev.filter((a) => a.id !== id));
        setDispatches((prev) =>
          prev.map((d) => ({
            ...d,
            consommations: d.consommations.filter((c) => c.agenceId !== id),
          }))
        );
      })
      .catch((err) => console.error("Erreur suppression agence:", err));
  };

  const toggleEditionDispatch = (id) => {
    if (dispatchEnEdition === id) {
      const ligne = dispatches.find((d) => d.id === id);
      ligne.consommations.forEach((c) => {
        if (c.quantite > 0) {
          createDispatch({
            agenceId: c.agenceId,
            fournitureId: ligne.id,
            quantite: c.quantite,
            date: new Date().toISOString(),
          });

          const newRestante = ligne.quantite - c.quantite;
          updateFourniture(ligne.id, {
            id: ligne.id,
            nom: ligne.designation,
            quantite: ligne.quantite,
            prixUnitaire: fournitures.find((f) => f.id === ligne.id)?.prixUnitaire || 0,
            categorie: fournitures.find((f) => f.id === ligne.id)?.categorie || "",
            quantiteRestante: newRestante,
            date: new Date().toISOString(),
          });

          ligne.quantite = newRestante;
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
        if (d.id === dispatchId) {
          const majCons = d.consommations.map((c) =>
            c.agenceId === agenceId ? { ...c, quantite: parseInt(qtt, 10) || 0 } : c
          );
          return { ...d, consommations: majCons };
        }
        return d;
      })
    );
  };

  const supprimerDispatch = (id) => {
    setDispatches((prev) => prev.filter((d) => d.id !== id));
  };

  const ouvrirModal = () => {
    setNouveauDispatch({ fournitureId: "", agenceId: "", quantite: "", date: "" });
    setFiltreFourniture("");
    setFiltreAgence("");
    setModalOuvert(true);
  };

    const ouvrirModalAgence = () => {
  setNouvelleAgence({ nom: "", numero: "" });
  setModalAgenceOuvert(true);
};

const fermerModalAgence = () => {
  setModalAgenceOuvert(false);
};

const handleChangeAgence = (e) => {
  const { name, value } = e.target;
  setNouvelleAgence((prev) => ({ ...prev, [name]: value }));
};

const sauvegarderAgence = () => {
  const { nom, numero } = nouvelleAgence;
  if (!nom.trim() || !numero.trim()) return;

  createAgence({ nom, numero })
    .then((res) => {
      const nouvelle = res.data;
      setAgences((prev) => [...prev, nouvelle]);
      setDispatches((prev) =>
        prev.map((d) => ({
          ...d,
          consommations: [...d.consommations, { agenceId: nouvelle.id, quantite: 0 }],
        }))
      );
      setModalAgenceOuvert(false);
    })
    .catch((err) => console.error("Erreur ajout agence:", err));
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
    if (!fourniture || !agenceId || !quantite || !date) return;

    const quantiteRestante = fourniture.quantiteRestante - parseInt(quantite);

    createDispatch({
      agenceId: parseInt(agenceId),
      fournitureId: fourniture.id,
      quantite: parseInt(quantite),
      date,
    }).then(() => {
      updateFourniture(fourniture.id, {
        ...fourniture,
        quantiteRestante,
        date: new Date().toISOString(),
      });

      setDispatches((prev) =>
        prev.map((d) =>
          d.id === fourniture.id
            ? {
                ...d,
                quantite: quantiteRestante,
                consommations: d.consommations.map((c) =>
                  c.agenceId === parseInt(agenceId)
                    ? { ...c, quantite: c.quantite + parseInt(quantite) }
                    : c
                ),
              }
            : d
        )
      );

      setModalOuvert(false);
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
            <div className="ajout-agence">
              <button className="bouton-ajouter-agence" onClick={ouvrirModalAgence}>
                <Plus size={16} /> Ajouter Agence
              </button>
            </div>
            <button className="bouton-ajouter" onClick={ouvrirModal}>
              <Plus size={16} /> Créer un envoi
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
                  {agences.length > 0 && <th colSpan={agences.length}>Consommations des agences</th>}
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
                {agences.length > 0 && (
                  <tr>
                    <th></th>
                    <th></th>
                    {agences.map((agence) => (
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
                {dispatchesFiltres.length > 0 ? (
                  dispatchesFiltres.map((dispatch) => (
                    <tr key={dispatch.id}>
                      <td>{dispatch.designation}</td>
                      <td>{dispatch.quantite}</td>
                      {agences.map((agence) => {
                        const consommation = dispatch.consommations?.find((c) => c.agenceId === agence.id);
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
                      <td>{dispatch.date}</td>
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
                    <td colSpan={agences.length > 0 ? agences.length + 4 : 4} className="no-data">
                      Aucune agence trouvée. Utilisez le bouton "Ajouter" pour en créer une.
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
    value={nouveauDispatch.agenceId}
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
                <input type="number" name="quantite" min="1" value={nouveauDispatch.quantite} onChange={handleChange} required />
              </div>
              <div className="groupe-champ">
                <label htmlFor="date">Date</label>
                <input type="date" name="date" value={nouveauDispatch.date} onChange={handleChange} required />
              </div>
              <div className="actions-modal">
                <button className="bouton-annuler" onClick={fermerModal}>Annuler</button>
                <button className="bouton-sauvegarder" onClick={sauvegarderDispatch}>Valider</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalAgenceOuvert && (
  <div className="modal-overlay">
    <div className="modal-contenu">
      <h2>Créer une nouvelle agence</h2>
      <div className="formulaire-modal">
        <div className="groupe-champ">
          <label htmlFor="numero">Numéro</label>
          <input
            type="text"
            name="numero"
            value={nouvelleAgence.numero}
            onChange={handleChangeAgence}
            required
          />
        </div>
        <div className="groupe-champ">
          <label htmlFor="nom">Nom</label>
          <input
            type="text"
            name="nom"
            value={nouvelleAgence.nom}
            onChange={handleChangeAgence}
            required
          />
        </div>
        <div className="actions-modal">
          <button className="bouton-annuler" onClick={fermerModalAgence}>Annuler</button>
          <button className="bouton-sauvegarder" onClick={sauvegarderAgence}>Créer</button>
        </div>
      </div>
    </div>
  </div>
)}


    </div>
  );
}

export default Dispatche;

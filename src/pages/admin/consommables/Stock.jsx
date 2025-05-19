"use client";

import { useState, useEffect } from "react";
import {
  getFournitures,
  createFourniture,
  updateFourniture,
  deleteFourniture,
} from "../../../services/fournituresServices";
import {
  Plus,
  Edit,
  Trash,
  Computer,
  Package,
  FileText,
  Brush,
  Calendar,
  Filter,
  Book,
  HardDrive,
} from "lucide-react";
import Modal from "../../../components/Modal";
import Alerte from "../../../components/Alerte";
import "./css/Stock.css";

function Stock() {
  const [filtreDesignation, setFiltreDesignation] = useState("");
  const [modalOuvert, setModalOuvert] = useState(false);
  const [categorieSelectionnee, setCategorieSelectionnee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [articleASupprimer, setArticleASupprimer] = useState(null);
  const [articleEnEdition, setArticleEnEdition] = useState(null);
  const [alerte, setAlerte] = useState(null);

  const [nouvelArticle, setNouvelArticle] = useState({
    designation: "",
    categorie: "",
    quantite: "",
    prixUnitaire: "",
    date: new Date().toISOString().split("T")[0],
  });

  const [articles, setArticles] = useState([]);

  const categoriesStock = [
    { id: 1, nom: "Fournitures de Bureau", icone: "FileText" },
    { id: 2, nom: "Matériel Informatique", icone: "Computer" },
    { id: 3, nom: "Fournitures d'Entretien", icone: "Package" },
    { id: 4, nom: "Matériels Informatiques", icone: "HardDrive" },
    { id: 5, nom: "Livret", icone: "Book" },
  ];

  useEffect(() => {
    setLoading(true);

    getFournitures()
      .then((res) => {
        const rawData = res.data;
        const array = Array.isArray(rawData) ? rawData : rawData["$values"] || [];

        const mapped = array.map((item) => ({
          id: item.id,
          designation: item.nom,
          categorie: item.categorie,

          stockAvant: {
            quantite: item.quantiteRestante,
            montant: item.quantiteRestante * item.prixUnitaire,
            cmup: item.cmup ?? 0,
          },

          stockActuel: {
            date: item.date,
            quantite: item.quantite,
            prixUnitaire: item.prixUnitaire,
            montant: item.quantite * item.prixUnitaire,
          },

          dateEntree: item.date,
        }));

        setArticles(mapped);
      })
      .catch((err) => console.error("Erreur API:", err))
      .finally(() => setLoading(false));
  }, []);

 const sauvegarderArticle = () => {
  const quantite = Number.parseInt(nouvelArticle.quantite, 10);
  const prixUnitaire = Number.parseFloat(nouvelArticle.prixUnitaire);

  if (!nouvelArticle.designation || !nouvelArticle.categorie || !quantite || !prixUnitaire) {
    setAlerte({ message: "Tous les champs sont obligatoires", type: "erreur" });
    return;
  }

  const data = {
    nom: nouvelArticle.designation,
    categorie: nouvelArticle.categorie,
    prixUnitaire,
    quantite,
    date: nouvelArticle.date,
  };

  if (articleEnEdition) {
    // 🔁 Cas modification
    updateFourniture(articleEnEdition.id, { ...data, id: articleEnEdition.id }).then(() => {
      const articleModifie = {
        ...articleEnEdition,
        designation: data.nom,
        categorie: data.categorie,
        stockActuel: {
          date: data.date,
          quantite: data.quantite,
          prixUnitaire: data.prixUnitaire,
          montant: data.quantite * data.prixUnitaire,
        },
        stockAvant: {
          quantite: articleEnEdition.stockAvant.quantite + (data.quantite - articleEnEdition.stockActuel.quantite),
          montant: (articleEnEdition.stockAvant.quantite + (data.quantite - articleEnEdition.stockActuel.quantite)) * data.prixUnitaire,
          cmup: articleEnEdition.stockAvant.cmup, // tu peux faire un appel API CMUP si tu veux
        },
        dateEntree: data.date,
      };

      setArticles((prev) =>
        prev.map((a) => (a.id === articleEnEdition.id ? articleModifie : a))
      );

      setAlerte({ message: "Article modifié avec succès!", type: "succes" });
      setModalOuvert(false);
      setArticleEnEdition(null);
    });
  } else {
    // ✅ Cas création
    createFourniture(data).then((res) => {
      const newItem = res.data;

      const nouvelArticleMapped = {
        id: newItem.id,
        designation: newItem.nom,
        categorie: newItem.categorie,
        stockAvant: {
          quantite: newItem.quantiteRestante,
          montant: newItem.quantiteRestante * newItem.prixUnitaire,
          cmup: newItem.cmup ?? 0,
        },
        stockActuel: {
          date: newItem.date,
          quantite: newItem.quantite,
          prixUnitaire: newItem.prixUnitaire,
          montant: newItem.quantite * newItem.prixUnitaire,
        },
        dateEntree: newItem.date,
      };

      setArticles((prev) => [...prev, nouvelArticleMapped]);
      setAlerte({ message: "Article ajouté avec succès!", type: "succes" });
      setModalOuvert(false);
    });
  }
};


 const supprimerArticle = () => {
  if (!articleASupprimer) return;

  deleteFourniture(articleASupprimer.id)
    .then(() => {
      setArticles((prev) =>
        prev.filter((a) => a.id !== articleASupprimer.id)
      );
      setAlerte({ message: "Article supprimé avec succès!", type: "succes" });
      setArticleASupprimer(null); // ferme la modale
    })
    .catch((err) => {
      console.error("Erreur de suppression:", err);
      setAlerte({ message: "Erreur lors de la suppression", type: "erreur" });
      setArticleASupprimer(null);
    });
};


  const getIconeCategorie = (nomCategorie) => {
    const cat = categoriesStock.find((c) => c.nom === nomCategorie);
    if (!cat) return <Package size={24} />;
    const icones = {
      Computer: <Computer size={24} />,
      Brush: <Brush size={24} />,
      Package: <Package size={24} />,
      FileText: <FileText size={24} />,
      HardDrive: <HardDrive size={24} />,
      Book: <Book size={24} />,
    };
    return icones[cat.icone] || <Package size={24} />;
  };

  const articlesFiltres = articles.filter((article) =>
    article.designation.toLowerCase().includes(filtreDesignation.toLowerCase())
  );

  return (
    <div className="page-stock">
      <h1 className="titre-page">Gestion du Stock</h1>

      <div className="categories-stock">
        {categoriesStock.map((cat) => (
          <div key={cat.id} className="boite-categorie">
            <div className="icone-categorie">{getIconeCategorie(cat.nom)}</div>
            <h3>{cat.nom}</h3>
            <p className="quantite-categorie">
              {articles.filter((a) => a.categorie === cat.nom).length} articles
            </p>
          </div>
        ))}
      </div>

      <div className="actions-stock">
        <input
          type="text"
          placeholder="Filtrer par désignation..."
          value={filtreDesignation}
          onChange={(e) => setFiltreDesignation(e.target.value)}
          className="champ-filtre"
        />
        <button className="bouton-ajouter" onClick={() => {
          setArticleEnEdition(null);
          setNouvelArticle({
            designation: "",
            categorie: "",
            quantite: "",
            prixUnitaire: "",
            date: new Date().toISOString().split("T")[0],
          });
          setModalOuvert(true);
        }}>
          <Plus size={16} /> Créer
        </button>
      </div>

      <table className="tableau-stock">
        <thead>
          <tr>
            <th>Désignation</th>
            <th>Catégorie</th>
            <th colSpan="3">Stock Restant</th>
            <th colSpan="4">Stock Actuel</th>
            <th>Actions</th>
          </tr>
          <tr>
            <th></th>
            <th></th>
            <th>Quantité</th>
            <th>Montant</th>
            <th>CMUP</th>
            <th>Date</th>
            <th>Quantité</th>
            <th>Prix Unitaire</th>
            <th>Montant</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
  {articlesFiltres.map((article) => (
    <tr key={article.id}>
      <td>{article.designation}</td>
      <td>
        <div className="categorie-cell">
          <span className="categorie-icon">{getIconeCategorie(article.categorie)}</span>
          <span>{article.categorie}</span>
        </div>
      </td>
      <td>{article.stockAvant.quantite}</td>
      <td>{article.stockAvant.montant.toFixed(2)}</td>
      <td>{article.stockAvant.cmup.toFixed(2)}</td>
      <td>{article.stockActuel.date?.split("T")[0]}</td>
      <td>{article.stockActuel.quantite}</td>
      <td>{article.stockActuel.prixUnitaire.toFixed(2)}</td>
      <td>{article.stockActuel.montant.toFixed(2)}</td>
      <td className="actions-cellule">
        <button
          className="bouton-modifier"
          onClick={() => {
            setArticleEnEdition(article);
            setNouvelArticle({
              designation: article.designation,
              categorie: article.categorie,
              quantite: article.stockActuel.quantite,
              prixUnitaire: article.stockActuel.prixUnitaire,
              date: article.dateEntree,
            });
            setModalOuvert(true);
          }}
        >
          <Edit size={14} /> Modifier
        </button>
        <button
          className="bouton-supprimer"
          onClick={() => setArticleASupprimer(article)}
        >
          <Trash size={14} /> Supprimer
        </button>
      </td>
    </tr>
  ))}
</tbody>

      </table>
      {articleASupprimer && (
  <div className="modal-overlay">
    <div className="modal-contenu">
      <h3>Confirmer la suppression</h3>
      <p>Voulez-vous vraiment supprimer "{articleASupprimer.designation}" ?</p>
      <div className="actions-modal">
        <button
          className="bouton-annuler"
          onClick={() => setArticleASupprimer(null)}
        >
          Annuler
        </button>
        <button className="bouton-supprimer" onClick={() => setArticleASupprimer()}>
          Confirmer
        </button>
      </div>
    </div>
  </div>
)}

      <Modal
        isOpen={modalOuvert}
        onClose={() => setModalOuvert(false)}
        title={articleEnEdition ? "Modifier un article" : "Ajouter un article"}
      >
        <div className="formulaire-modal">
          <input
            placeholder="Désignation"
            value={nouvelArticle.designation}
            onChange={(e) => setNouvelArticle({ ...nouvelArticle, designation: e.target.value })}
          />
          <select
            value={nouvelArticle.categorie}
            onChange={(e) => setNouvelArticle({ ...nouvelArticle, categorie: e.target.value })}
          >
            <option value="">-- Catégorie --</option>
            {categoriesStock.map((cat) => (
              <option key={cat.id} value={cat.nom}>{cat.nom}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Quantité"
            value={nouvelArticle.quantite}
            onChange={(e) => setNouvelArticle({ ...nouvelArticle, quantite: e.target.value })}
          />
          <input
            type="number"
            placeholder="Prix unitaire"
            value={nouvelArticle.prixUnitaire}
            onChange={(e) => setNouvelArticle({ ...nouvelArticle, prixUnitaire: e.target.value })}
          />
          <input
            type="date"
            value={nouvelArticle.date}
            onChange={(e) => setNouvelArticle({ ...nouvelArticle, date: e.target.value })}
          />
          <button onClick={sauvegarderArticle}>Sauvegarder</button>
        </div>
      </Modal>

      {alerte && (
        <Alerte message={alerte.message} type={alerte.type} onClose={() => setAlerte(null)} />
      )}



    </div>
  );
}

export default Stock;

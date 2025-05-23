"use client"

import { useState, useEffect } from "react"
import {
  getFournitures,
  createFourniture,
  updateFourniture,
  deleteFourniture,
} from "../../../services/fournituresServices"
import {
  Plus,
  Edit,
  Trash,
  Computer,
  Package,
  FileText,
  Brush,
  Calendar,
  Book,
  HardDrive,
  CheckCircle,
  AlertCircle,
  X,
  Save,
  AlertTriangle,
  Filter,
} from "lucide-react"
import Modal from "../../../components/Modal"
import "./css/Stock.css"

function Stock() {
  // Remplacer la déclaration des états au début du composant pour ajouter modalDetailOuvert et filtreMois/filtreAnnee
  const [modalDetailOuvert, setModalDetailOuvert] = useState(false)
  const [filtreMois, setFiltreMois] = useState("")
  const [filtreAnnee, setFiltreAnnee] = useState("")
  const [categorieSelectionnee, setCategorieSelectionnee] = useState(null)
  const [filtreDesignation, setFiltreDesignation] = useState("")
  const [modalOuvert, setModalOuvert] = useState(false)
  const [loading, setLoading] = useState(false)
  const [articleASupprimer, setArticleASupprimer] = useState(null)
  const [articleEnEdition, setArticleEnEdition] = useState(null)
  const [toasts, setToasts] = useState([])
  const [detailsOuverts, setDetailsOuverts] = useState({})
  const [filtresMois, setFiltresMois] = useState({})
  const [filtresAnnee, setFiltresAnnee] = useState({})

  const [nouvelArticle, setNouvelArticle] = useState({
    designation: "",
    categorie: "",
    quantite: "",
    prixUnitaire: "",
    date: new Date().toISOString().split("T")[0],
  })

  const [articles, setArticles] = useState([])

  const categoriesStock = [
    { id: 1, nom: "Fournitures de Bureau", icone: "FileText" },
    { id: 2, nom: "Matériel Informatique", icone: "Computer" },
    { id: 3, nom: "Fournitures d'Entretien", icone: "Package" },
    { id: 4, nom: "Matériels Informatiques", icone: "HardDrive" },
    { id: 5, nom: "Livret", icone: "Book" },
  ]

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

  // Fonction pour afficher une boîte de dialogue de confirmation moderne
  const afficherConfirmation = (message, onConfirm) => {
    const confirmationId = Date.now()
    const confirmation = {
      id: confirmationId,
      message,
      onConfirm,
      onCancel: () => {
        setToasts((prev) => prev.filter((t) => t.id !== confirmationId))
      },
    }

    setToasts((prev) => [...prev, { ...confirmation, type: "confirmation" }])
  }

  useEffect(() => {
    setLoading(true)

    getFournitures()
      .then((res) => {
        const rawData = res.data
        const array = Array.isArray(rawData) ? rawData : rawData["$values"] || []

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
        }))

        setArticles(mapped)
      })
      .catch((err) => {
        console.error("Erreur API:", err)
        afficherToast("Erreur lors du chargement des articles", "erreur")
      })
      .finally(() => setLoading(false))
  }, [])

  const sauvegarderArticle = () => {
    const quantite = Number.parseInt(nouvelArticle.quantite, 10)
    const prixUnitaire = Number.parseFloat(nouvelArticle.prixUnitaire)

    if (!nouvelArticle.designation || !nouvelArticle.categorie || !quantite || !prixUnitaire) {
      afficherToast("Tous les champs sont obligatoires", "erreur")
      return
    }

    const data = {
      nom: nouvelArticle.designation,
      categorie: nouvelArticle.categorie,
      prixUnitaire,
      quantite,
      date: nouvelArticle.date,
    }

    if (articleEnEdition) {
      // Cas modification
      updateFourniture(articleEnEdition.id, { ...data, id: articleEnEdition.id })
        .then(() => {
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
              montant:
                (articleEnEdition.stockAvant.quantite + (data.quantite - articleEnEdition.stockActuel.quantite)) *
                data.prixUnitaire,
              cmup: articleEnEdition.stockAvant.cmup,
            },
            dateEntree: data.date,
          }

          setArticles((prev) => prev.map((a) => (a.id === articleEnEdition.id ? articleModifie : a)))

          afficherToast("Article modifié avec succès!", "succes")
          setModalOuvert(false)
          setArticleEnEdition(null)
        })
        .catch((err) => {
          console.error("Erreur de modification:", err)
          afficherToast("Erreur lors de la modification", "erreur")
        })
    } else {
      // Cas création
      createFourniture(data)
        .then((res) => {
          const newItem = res.data

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
          }

          setArticles((prev) => [...prev, nouvelArticleMapped])
          afficherToast("Article ajouté avec succès!", "succes")
          setModalOuvert(false)
        })
        .catch((err) => {
          console.error("Erreur de création:", err)
          afficherToast("Erreur lors de la création", "erreur")
        })
    }
  }

  const supprimerArticle = () => {
    if (!articleASupprimer) return

    deleteFourniture(articleASupprimer.id)
      .then(() => {
        setArticles((prev) => prev.filter((a) => a.id !== articleASupprimer.id))
        afficherToast("Article supprimé avec succès!", "succes")
        setArticleASupprimer(null)
      })
      .catch((err) => {
        console.error("Erreur de suppression:", err)
        afficherToast("Erreur lors de la suppression", "erreur")
        setArticleASupprimer(null)
      })
  }

  const getIconeCategorie = (nomCategorie) => {
    const cat = categoriesStock.find((c) => c.nom === nomCategorie)
    if (!cat) return <Package size={24} />
    const icones = {
      Computer: <Computer size={24} />,
      Brush: <Brush size={24} />,
      Package: <Package size={24} />,
      FileText: <FileText size={24} />,
      HardDrive: <HardDrive size={24} />,
      Book: <Book size={24} />,
    }
    return icones[cat.icone] || <Package size={24} />
  }

  // Remplacer la fonction toggleDetails par ouvrirModalDetail
  const ouvrirModalDetail = (categorie) => {
    setCategorieSelectionnee(categorie)
    setModalDetailOuvert(true)
  }

  // Ajouter la fonction fermerModalDetail
  const fermerModalDetail = () => {
    setModalDetailOuvert(false)
    setCategorieSelectionnee(null)
    setFiltreMois("")
    setFiltreAnnee("")
  }

  const toggleDetails = (categorieId) => {
    setDetailsOuverts((prev) => ({
      ...prev,
      [categorieId]: !prev[categorieId],
    }))
  }

  const getArticlesParCategorie = (categorie) => {
    return articles.filter((a) => a.categorie === categorie)
  }

  const getMoisDisponibles = (articlesCategorie) => {
    const mois = new Set()
    articlesCategorie.forEach((article) => {
      if (article.dateEntree) {
        const date = new Date(article.dateEntree)
        mois.add(date.getMonth())
      }
    })
    return Array.from(mois).sort((a, b) => a - b)
  }

  const getAnneesDisponibles = (articlesCategorie) => {
    const annees = new Set()
    articlesCategorie.forEach((article) => {
      if (article.dateEntree) {
        const date = new Date(article.dateEntree)
        annees.add(date.getFullYear())
      }
    })
    return Array.from(annees).sort((a, b) => a - b)
  }

  const getNomMois = (numeroMois) => {
    const mois = [
      "Janvier",
      "Février",
      "Mars",
      "Avril",
      "Mai",
      "Juin",
      "Juillet",
      "Août",
      "Septembre",
      "Octobre",
      "Novembre",
      "Décembre",
    ]
    return mois[numeroMois]
  }

  const handleFiltreMois = (categorieId, mois) => {
    setFiltresMois((prev) => ({
      ...prev,
      [categorieId]: mois,
    }))
  }

  const handleFiltreAnnee = (categorieId, annee) => {
    setFiltresAnnee((prev) => ({
      ...prev,
      [categorieId]: annee,
    }))
  }

  const getArticlesFiltres = (categorie) => {
    const articlesCategorie = getArticlesParCategorie(categorie)
    const moisFiltre = filtresMois[categorie.id]
    const anneeFiltre = filtresAnnee[categorie.id]

    if (!moisFiltre && !anneeFiltre) return articlesCategorie

    return articlesCategorie.filter((article) => {
      if (!article.dateEntree) return false

      const date = new Date(article.dateEntree)
      const moisMatch = moisFiltre === undefined || date.getMonth() === moisFiltre
      const anneeMatch = anneeFiltre === undefined || date.getFullYear() === anneeFiltre

      return moisMatch && anneeMatch
    })
  }

  // Modifier la fonction filtrerArticlesParDate
  const filtrerArticlesParDate = (articles) => {
    if (!filtreMois && !filtreAnnee) return articles

    return articles.filter((article) => {
      if (!article.dateEntree) return false

      const dateEntree = new Date(article.dateEntree)
      const moisMatch = !filtreMois || (dateEntree.getMonth() + 1).toString() === filtreMois
      const anneeMatch = !filtreAnnee || dateEntree.getFullYear().toString() === filtreAnnee

      return moisMatch && anneeMatch
    })
  }

  const articlesFiltres = articles.filter((article) =>
    article.designation.toLowerCase().includes(filtreDesignation.toLowerCase()),
  )

  return (
    <div className="page-stock">
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Chargement en cours...</p>
        </div>
      )}
      <h1 className="titre-page">Gestion du Stock</h1>

      {/* Remplacer le rendu des boîtes de catégories dans le JSX */}
      <div className="categories-stock">
        {categoriesStock.map((cat) => (
          <div key={cat.id} className="boite-categorie" onClick={() => ouvrirModalDetail(cat)}>
            <div className="icone-categorie">{getIconeCategorie(cat.nom)}</div>
            <h3>{cat.nom}</h3>
            <p className="quantite-categorie">{getArticlesParCategorie(cat.nom).length} articles</p>
            <div className="voir-details">Voir détails</div>
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
        <button
          className="bouton-ajouter"
          onClick={() => {
            setArticleEnEdition(null)
            setNouvelArticle({
              designation: "",
              categorie: "",
              quantite: "",
              prixUnitaire: "",
              date: new Date().toISOString().split("T")[0],
            })
            setModalOuvert(true)
          }}
        >
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
                    setArticleEnEdition(article)
                    setNouvelArticle({
                      designation: article.designation,
                      categorie: article.categorie,
                      quantite: article.stockActuel.quantite,
                      prixUnitaire: article.stockActuel.prixUnitaire,
                      date: article.dateEntree,
                    })
                    setModalOuvert(true)
                  }}
                >
                  <Edit size={14} /> Modifier
                </button>
                <button
                  className="bouton-supprimer"
                  onClick={() => {
                    afficherConfirmation(`Voulez-vous vraiment supprimer "${article.designation}" ?`, () =>
                      supprimerArticle(article),
                    )
                    setArticleASupprimer(article)
                  }}
                >
                  <Trash size={14} /> Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal
        isOpen={modalOuvert}
        onClose={() => setModalOuvert(false)}
        title={articleEnEdition ? "Modifier un article" : "Ajouter un article"}
      >
        <div className="formulaire-modal">
          <div className="form-group">
            <label>Désignation</label>
            <input
              placeholder="Désignation"
              value={nouvelArticle.designation}
              onChange={(e) => setNouvelArticle({ ...nouvelArticle, designation: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Catégorie</label>
            <select
              value={nouvelArticle.categorie}
              onChange={(e) => setNouvelArticle({ ...nouvelArticle, categorie: e.target.value })}
            >
              <option value="">-- Catégorie --</option>
              {categoriesStock.map((cat) => (
                <option key={cat.id} value={cat.nom}>
                  {cat.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Quantité</label>
            <input
              type="number"
              placeholder="Quantité"
              value={nouvelArticle.quantite}
              onChange={(e) => setNouvelArticle({ ...nouvelArticle, quantite: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Prix unitaire</label>
            <input
              type="number"
              placeholder="Prix unitaire"
              value={nouvelArticle.prixUnitaire}
              onChange={(e) => setNouvelArticle({ ...nouvelArticle, prixUnitaire: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Date</label>
            <div className="date-input-wrapper">
              <Calendar size={18} className="calendar-icon" />
              <input
                type="date"
                value={nouvelArticle.date}
                onChange={(e) => setNouvelArticle({ ...nouvelArticle, date: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button className="btn-annuler" onClick={() => setModalOuvert(false)}>
              Annuler
            </button>
            <button className="btn-sauvegarder" onClick={sauvegarderArticle}>
              <Save size={16} /> Sauvegarder
            </button>
          </div>
        </div>
      </Modal>

      {/* Système de toast notifications */}
      <div className="toast-container">
        {toasts.map((toast) =>
          toast.type === "confirmation" ? (
            <div key={toast.id} className="toast toast-confirmation">
              <div className="toast-icon">
                <AlertTriangle size={20} />
              </div>
              <div className="toast-content">
                <p>{toast.message}</p>
                <div className="toast-actions">
                  <button
                    onClick={() => {
                      supprimerArticle()
                      supprimerToast(toast.id)
                    }}
                    className="toast-btn confirm"
                  >
                    Confirmer
                  </button>
                  <button
                    onClick={() => {
                      setArticleASupprimer(null)
                      supprimerToast(toast.id)
                    }}
                    className="toast-btn cancel"
                  >
                    Annuler
                  </button>
                </div>
              </div>
              <button onClick={() => supprimerToast(toast.id)} className="toast-close">
                <X size={16} />
              </button>
            </div>
          ) : (
            <div key={toast.id} className={`toast toast-${toast.type}`}>
              <div className="toast-icon">
                {toast.type === "succes" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              </div>
              <div className="toast-content">
                <p>{toast.message}</p>
              </div>
              <button onClick={() => supprimerToast(toast.id)} className="toast-close">
                <X size={16} />
              </button>
            </div>
          ),
        )}
      </div>
      {/* Modal de détail de catégorie */}
      {modalDetailOuvert && categorieSelectionnee && (
        <div className="modal-overlay">
          <div className="modal-contenu modal-large">
            <div className="entete-modal-detail">
              <h2>Détails de la catégorie: {categorieSelectionnee.nom}</h2>
              <div className="filtres-date">
                <div className="groupe-filtre">
                  <label htmlFor="filtreMois">
                    <Calendar size={16} /> Mois:
                  </label>
                  <select id="filtreMois" value={filtreMois} onChange={(e) => setFiltreMois(e.target.value)}>
                    <option value="">Tous les mois</option>
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
                <div className="groupe-filtre">
                  <label htmlFor="filtreAnnee">
                    <Filter size={16} /> Année:
                  </label>
                  <select id="filtreAnnee" value={filtreAnnee} onChange={(e) => setFiltreAnnee(e.target.value)}>
                    <option value="">Toutes les années</option>
                    {getAnneesDisponibles(articles).map((annee) => (
                      <option key={annee} value={annee.toString()}>
                        {annee}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="tableau-detail-wrapper">
              <div className="tableau-detail">
                <table>
                  <thead>
                    <tr>
                      <th>Article</th>
                      <th>Quantité disponible</th>
                      <th>Date d'entrée</th>
                      <th>Prix unitaire</th>
                      <th>Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrerArticlesParDate(getArticlesParCategorie(categorieSelectionnee.nom)).length > 0 ? (
                      filtrerArticlesParDate(getArticlesParCategorie(categorieSelectionnee.nom)).map((article) => (
                        <tr key={article.id} className="article-row">
                          <td>{article.designation}</td>
                          <td>{article.stockActuel.quantite}</td>
                          <td>{article.dateEntree?.split("T")[0] || "N/A"}</td>
                          <td>{article.stockActuel.prixUnitaire.toFixed(2)}</td>
                          <td>{article.stockActuel.montant.toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="no-data">
                          Aucun article trouvé pour cette catégorie avec les filtres sélectionnés.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="actions-modal">
              <button className="bouton-fermer" onClick={fermerModalDetail}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Stock

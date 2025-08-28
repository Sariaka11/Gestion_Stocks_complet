"use client"

import { useState, useEffect } from "react"
import {
  getFournitures,
  createFourniture,
  updateFourniture,
  deleteFourniture,
  createEntreeFourniture,
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
  const [nouvelleEntree, setNouvelleEntree] = useState(null)

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
    { id: 4, nom: "Livret", icone: "Book" },
  ]

  const afficherToast = (message, type) => {
    const id = Date.now()
    const nouveauToast = { id, message, type }
    setToasts((prev) => [...prev, nouveauToast])
    setTimeout(() => setToasts((prev) => prev.filter((toast) => toast.id !== id)), 5000)
  }

  const supprimerToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const afficherConfirmation = (message, onConfirm) => {
    const confirmationId = Date.now()
    const confirmation = {
      id: confirmationId,
      message,
      onConfirm,
      onCancel: () => setToasts((prev) => prev.filter((t) => t.id !== confirmationId)),
    }
    setToasts((prev) => [...prev, { ...confirmation, type: "confirmation" }])
  }
 const getDataFourniture = () =>{
  setLoading(true)
  console.log("Début du chargement des données...")
  getFournitures()
      .then((res) => {
        console.log("Réponse API:", res)
        const rawData = res.data
        const array = Array.isArray(rawData) ? rawData : rawData["$values"] || []
        console.log("Données mappées:", array)
        
        const mapped = array.map((item) => {
          console.log("item", item)
          const latestEntree =
          item.EntreesFournitures && item.EntreesFournitures.length > 0
          ? item.EntreesFournitures[item.EntreesFournitures.length - 1]
              : null
              return {
                id: item.Id,
                designation: item.Nom || "Inconnu",
                categorie: item.Categorie || "Sans catégorie",
                stockAvant: {
                  quantite: item.QuantiteRestante || 0,
                  montant: (item.QuantiteRestante || 0) * (item.PrixUnitaire || 0),
                  cmup: item.CMUP ?? 0,
            },
            stockActuel: {
              date: latestEntree ? latestEntree.DateEntree : null,
              quantite: latestEntree ? latestEntree.QuantiteEntree : 0,
              prixUnitaire: item.PrixUnitaire || 0,
              montant: latestEntree ? latestEntree.Montant : 0,
            },
            dateEntree: latestEntree ? latestEntree.dateEntree : null,
            entrees: item.entreesFournitures || [],
          }
        })
        console.log("Articles mappés:", mapped)
        setArticles(mapped)
      })
      .catch((err) => {
        console.error("Erreur API:", err)
        afficherToast("Erreur lors du chargement des articles", "erreur")
      })
      .finally(() => {
        console.log("Chargement terminé")
        setLoading(false)
      })
  }
  useEffect(() => {
    getDataFourniture()
  }, [])
  
  const sauvegarderArticle = () => {
    const quantite = Number.parseInt(nouvelArticle.quantite, 10)
    const prixUnitaire = Number.parseFloat(nouvelArticle.prixUnitaire)
    // console.log(nouvelArticle.designation , nouvelArticle.categorie , quantite , prixUnitaire)
    if (!nouvelArticle.designation || !nouvelArticle.categorie || !quantite || !prixUnitaire) {
      afficherToast("Tous les champs sont obligatoires", "erreur")
      return
    }

    const data = {
      nom: nouvelArticle.designation,
      categorie: nouvelArticle.categorie,
      prixUnitaire,
      quantite,
    }

    if (articleEnEdition) {
      updateFourniture(articleEnEdition.id, { ...data, id: articleEnEdition.id })
        .then(() => {
          return getFournitures()
        })
        .then((res) => {
          const rawData = res.data
          const array = Array.isArray(rawData) ? rawData : rawData["$values"] || []
          const mapped = array.map((item) => {
            const latestEntree =
              item.EntreesFournitures && item.EntreesFournitures.length > 0
                ? item.EntreesFournitures[item.EntreesFournitures.length - 1]
                : null
            return {
              id: item.id,
              designation: item.Nom || "Inconnu",
              categorie: item.Categorie || "Sans catégorie",
              stockAvant: {
                quantite: item.QuantiteRestante || 0,
                montant: (item.QuantiteRestante || 0) * (item.PrixUnitaire || 0),
                cmup: item.CMUP ?? 0,
              },
              stockActuel: {
                date: latestEntree ? latestEntree.DateEntree : null,
                quantite: latestEntree ? latestEntree.QuantiteEntree : 0,
                PrixUnitaire: item.PrixUnitaire || 0,
                montant: latestEntree ? latestEntree.Montant : 0,
              },
              dateEntree: latestEntree ? latestEntree.DateEntree : null,
              entrees: item.entreesFournitures || [],
            }
          })
          setArticles(mapped)
          afficherToast("Article modifié avec succès!", "succes")
          setModalOuvert(false)
          setArticleEnEdition(null)
        })
        .catch((err) => {
          console.error("Erreur de modification:", err)
          afficherToast("Erreur lors de la modification", "erreur")
        })
    } else {
      createFourniture(data)
        .then((res) => {
          const newItem = res.data
          const latestEntree =
            newItem.entreesFournitures && newItem.entreesFournitures.length > 0
              ? newItem.entreesFournitures[newItem.entreesFournitures.length - 1]
              : null
          const nouvelArticleMapped = {
            id: newItem.id,
            designation: newItem.Nom,
            categorie: newItem.Categorie,
            stockAvant: {
              quantite: newItem.QuantiteRestante,
              montant: newItem.QuantiteRestante * newItem.PrixUnitaire,
              cmup: newItem.cmup ?? 0,
            },
            stockActuel: {
              date: latestEntree ? latestEntree.DateEntree : null,
              quantite: latestEntree ? latestEntree.QuantiteEntree : 0,
              PrixUnitaire: newItem.PrixUnitaire,
              montant: latestEntree ? latestEntree.Montant : 0,
            },
            dateEntree: latestEntree ? latestEntree.DateEntree : null,
            entrees: newItem.entreesFournitures || [],
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
    setTimeout(() => {
      getDataFourniture()
    }, 3000);
  }

  const ajouterEntree = (article) => {
    console.log("article", article)
    setNouvelleEntree(article)
    setNouvelArticle({
      designation: article.designation,
      categorie: article.categorie,
      quantite: "",
      PrixUnitaire: "",
      date: new Date().toISOString().split("T")[0],
    })
    setModalOuvert(true)
  }

  const sauvegarderEntree = () => {
    if (!nouvelleEntree) return
    console.log(nouvelleEntree)
    const quantite = Number.parseInt(nouvelArticle.quantite, 10)
    const PrixUnitaire = Number.parseFloat(nouvelArticle.prixUnitaire)

    if (!quantite || !PrixUnitaire || !nouvelArticle.date) {
      afficherToast("Quantité, Prix unitaire et date sont obligatoires", "erreur")
      return
    }
    console.log("*-*----",nouvelleEntree)
    const data = {
      fournitureId: nouvelleEntree.id,
      quantiteEntree: quantite,
      PrixUnitaire: PrixUnitaire,
      dateEntree: nouvelArticle.date,
    }

    createEntreeFourniture(nouvelleEntree.id, data)
      .then((res) => {
        const updatedItem = res.data
        const latestEntree = updatedItem.EntreesFournitures[updatedItem.EntreesFournitures.length - 1]
        const articleMisAJour = {
          ...nouvelleEntree,
          stockAvant: {
            quantite: updatedItem.QuantiteRestante,
            montant: updatedItem.QuantiteRestante * updatedItem.PrixUnitaire,
            cmup: updatedItem.CMUP ?? 0,
          },
          stockActuel: {
            date: latestEntree.DateEntree,
            quantite: latestEntree.QuantiteEntree,
            PrixUnitaire: latestEntree.PrixUnitaire,
            montant: latestEntree.Montant,
          },
          dateEntree: latestEntree.DateEntree,
          entrees: updatedItem.EntreesFournitures || [],
        }
        setArticles((prev) => prev.map((a) => (a.id === nouvelleEntree.id ? articleMisAJour : a)))
        afficherToast("Nouvelle entrée ajoutée avec succès!", "succes")
        setModalOuvert(false)
        setNouvelleEntree(null)
        getDataFourniture()
      })
      .catch((err) => {
        console.error("Erreur lors de l'ajout de l'entrée:", err)
        afficherToast("Erreur lors de l'ajout de l'entrée", "erreur")
      })
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
      FileText: <FileText size={ 24} />,
      HardDrive: <HardDrive size={24} />,
      Book: <Book size={24} />,
    }
    return icones[cat.icone] || <Package size={24} />
  }

  const ouvrirModalDetail = (categorie) => {
    setCategorieSelectionnee(categorie)
    setModalDetailOuvert(true)
  }

  const fermerModalDetail = () => {
    setModalDetailOuvert(false)
    setCategorieSelectionnee(null)
    setFiltreMois("")
    setFiltreAnnee("")
  }

  const getArticlesParCategorie = (categorie) => {
    return articles.filter((a) => a.categorie === categorie)
  }

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

  const getNombreArticlesParCategorie = (categorie) => {
    const articlesCategorie = getArticlesParCategorie(categorie)
    return filtrerArticlesParDate(articlesCategorie).length
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
      {articles.length === 0 && !loading && <p className="no-data">Aucune donnée disponible.</p>}

      <div className="categories-stock">
        {categoriesStock.map((cat) => (
          <div key={cat.id} className="boite-categorie" onClick={() => ouvrirModalDetail(cat)}>
            <div className="icone-categorie">{getIconeCategorie(cat.nom)}</div>
            <h3>{cat.nom}</h3>
            <p className="quantite-categorie">{getNombreArticlesParCategorie(cat.nom)} articles</p>
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
              PrixUnitaire: "",
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
          {articlesFiltres.length > 0 ? (
            articlesFiltres.map((article) => (
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
                <td>{article.stockActuel.date?.split("T")[0] || "N/A"}</td>
                <td>{article.stockActuel.quantite}</td>
                <td>{article.stockActuel.prixUnitaire}</td>
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
                        date: article.dateEntree?.split("T")[0] || new Date().toISOString().split("T")[0],
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
                  <button
                    className="bouton-ajouter-entree"
                    onClick={() => ajouterEntree(article)}
                  >
                    <Plus size={14} /> Ajouter
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="10" className="no-data">
                Aucun article trouvé avec les filtres appliqués.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <Modal
        isOpen={modalOuvert}
        onClose={() => setModalOuvert(false)}
        title={articleEnEdition ? "Modifier un article" : nouvelleEntree ? "Ajouter une entrée" : "Ajouter un article"}
      >
        <div className="formulaire-modal">
          <div className="form-group">
            <label>Désignation</label>
            <input
              placeholder="Désignation"
              value={nouvelArticle.designation}
              onChange={(e) => setNouvelArticle({ ...nouvelArticle, designation: e.target.value })}
              disabled={!!articleEnEdition || !!nouvelleEntree}
            />
          </div>

          <div className="form-group">
            <label>Catégorie</label>
            <select
              value={nouvelArticle.categorie}
              onChange={(e) => setNouvelArticle({ ...nouvelArticle, categorie: e.target.value })}
              disabled={!!articleEnEdition || !!nouvelleEntree}
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
            <button
              className="btn-annuler"
              onClick={nouvelleEntree ? sauvegarderEntree : sauvegarderArticle}
            >
              <Save size={16} /> Sauvegarder
            </button>
          </div>
        </div>
      </Modal>

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
                    {[...new Set(articles.map((a) => new Date(a.dateEntree).getFullYear()))]
                      .sort((a, b) => a - b)
                      .map((annee) => (
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
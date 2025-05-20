"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Save, AlertCircle, RefreshCw, Trash2, Edit, X, CheckCircle, AlertTriangle } from "lucide-react"
import "./css/ImStock.css"
import { getImmobiliers, createImmobilier, deleteImmobilier } from "../../../services/immobilierServices"
import { getCategories, createCategorie, updateCategorie, deleteCategorie } from "../../../services/categorieServices"
import { useMockData } from "../../../../app/MockDataProvider"

function ImStock() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filtreDesignation, setFiltreDesignation] = useState("")
  const [modalOuvert, setModalOuvert] = useState(false)
  const [immobilierEnEdition, setImmobilierEnEdition] = useState(null)
  const [toasts, setToasts] = useState([])
  const objetVideImmobilier = {
    idBien: 0,
    codeArticle: "",
    nomBien: "",
    codeBarre: "",
    valeurAcquisition: 0,
    tauxAmortissement: 0,
    quantite: 1,
    statut: "actif",
    idCategorie: "",
    dateAcquisition: new Date().toISOString().split("T")[0],
  }
  const [nouvelImmobilier, setNouvelImmobilier] = useState(objetVideImmobilier)

  const [categories, setCategories] = useState([])
  const [nouvelleCategorie, setNouvelleCategorie] = useState({
    nomCategorie: "",
    dureeAmortissement: "",
  })
  const [categorieEnEdition, setCategorieEnEdition] = useState(null)
  const [alerteCategorie, setAlerteCategorie] = useState(null)

  // Tableau vide pour les immobiliers (à remplir avec des données réelles)
  const [immobilierItems, setImmobilierItems] = useState([])

  // Récupérer le contexte des données mockées
  const { useMockData: useMock, mockData, apiStatus, toggleMockData } = useMockData()

  // Fonction pour vérifier la connexion à l'API
  const verifierConnexionApi = async () => {
    try {
      // Vérifiez si le serveur est accessible avec un simple fetch
      const response = await fetch("http://localhost:5000/api/Categories", {
        method: "GET",
        mode: "cors",
      })
      console.log("Test de connexion API:", response)
      return response.ok
    } catch (error) {
      console.error("Erreur de connexion à l'API:", error)
      setError(
        `Impossible de se connecter au serveur API. Vérifiez que votre serveur backend est en cours d'exécution sur http://localhost:5000. Erreur: ${error.message}`,
      )
      return false
    }
  }

  // Fonction pour charger les immobiliers
  const chargerImmobiliers = () => {
    setLoading(true)
    setError(null)

    // Si nous utilisons des données mockées, utilisez-les directement
    if (useMock) {
      console.log("Utilisation des données mockées pour les immobiliers")

      const items = mockData.immobiliers.map((item) => ({
        id: item.idBien,
        nomBien: item.nomBien || "",
        dateAcquisition: item.dateAcquisition || "",
        valeurAcquisition: item.valeurAcquisition || 0,
        tauxAmortissement: item.tauxAmortissement || 0,
        statut: item.statut || "actif",
        categorie:
          item.categorie?.nomCategorie ||
          mockData.categories.find((c) => c.idCategorie === item.idCategorie)?.nomCategorie ||
          `Catégorie #${item.idCategorie}`,
        codeArticle: `IMM-${String(item.idBien).padStart(3, "0")}`,
        codeBarre: item.codeBarre || "0000000000000",
        quantite: item.quantite || 1,
        idCategorie: item.idCategorie,
      }))

      setImmobilierItems(items)
      setLoading(false)
      return
    }

    // Sinon, essayez de charger depuis l'API
    getImmobiliers()
      .then((res) => {
        console.log("Données immobiliers brutes:", res.data)

        // Déterminer le format des données
        let immRaw = res.data

        // Vérifier si les données sont dans un format spécifique (comme $values)
        if (res.data && typeof res.data === "object" && "$values" in res.data) {
          immRaw = res.data.$values
        }

        // S'assurer que immRaw est un tableau
        if (!Array.isArray(immRaw)) {
          console.warn("Les données reçues ne sont pas un tableau:", immRaw)
          immRaw = []
        }

        const items = immRaw.map((item) => ({
          id: item.idBien,
          nomBien: item.nomBien || "",
          dateAcquisition: item.dateAcquisition?.split("T")[0] || "",
          valeurAcquisition: item.valeurAcquisition ?? 0,
          tauxAmortissement: item.tauxAmortissement ?? 0,
          statut: item.statut || "actif",
          categorie: item.categorie?.nomCategorie || `Catégorie #${item.idCategorie}`,
          codeArticle: `IMM-${String(item.idBien).padStart(3, "0")}`,
          codeBarre: item.codeBarre || "0000000000000",
          quantite: item.quantite ?? 1,
          idCategorie: item.idCategorie,
        }))

        console.log("Données immobiliers transformées:", items)
        setImmobilierItems(items)
      })
      .catch((err) => {
        console.error("Erreur chargement immobiliers:", err)
        setError(
          `Impossible de charger les immobiliers: ${err.message}. Vérifiez que votre serveur API est en cours d'exécution.`,
        )

        // Si l'API échoue, basculez vers les données mockées
        if (!useMock) {
          console.log("Basculement vers les données mockées après échec de l'API")
          const items = mockData.immobiliers.map((item) => ({
            id: item.idBien,
            nomBien: item.nomBien || "",
            dateAcquisition: item.dateAcquisition || "",
            valeurAcquisition: item.valeurAcquisition || 0,
            tauxAmortissement: item.tauxAmortissement || 0,
            statut: item.statut || "actif",
            categorie:
              item.categorie?.nomCategorie ||
              mockData.categories.find((c) => c.idCategorie === item.idCategorie)?.nomCategorie ||
              `Catégorie #${item.idCategorie}`,
            codeArticle: `IMM-${String(item.idBien).padStart(3, "0")}`,
            codeBarre: item.codeBarre || "0000000000000",
            quantite: item.quantite || 1,
            idCategorie: item.idCategorie,
          }))
          setImmobilierItems(items)
        }
      })
      .finally(() => {
        setLoading(false)
      })
  }

  // Fonction pour charger les catégories
  const chargerCategories = () => {
    // Si nous utilisons des données mockées, utilisez-les directement
    if (useMock) {
      console.log("Utilisation des données mockées pour les catégories")
      setCategories(mockData.categories)
      return
    }

    // Sinon, essayez de charger depuis l'API
    getCategories()
      .then((res) => {
        console.log("Données catégories brutes:", res.data)

        // Déterminer le format des données
        let catRaw = res.data

        // Vérifier si les données sont dans un format spécifique (comme $values)
        if (res.data && typeof res.data === "object" && "$values" in res.data) {
          catRaw = res.data.$values
        }

        // S'assurer que catRaw est un tableau
        if (!Array.isArray(catRaw)) {
          console.warn("Les données reçues ne sont pas un tableau:", catRaw)
          catRaw = []
        }

        setCategories(catRaw)
      })
      .catch((err) => {
        console.error("Erreur chargement catégories:", err)
        afficherToast("Impossible de charger les catégories", "erreur")

        // Si l'API échoue, basculez vers les données mockées
        if (!useMock) {
          console.log("Basculement vers les données mockées après échec de l'API")
          setCategories(mockData.categories)
        }
      })
  }

  // Charger les données au démarrage
  useEffect(() => {
    chargerImmobiliers()
    chargerCategories()
  }, [])

  const sauvegarderCategorie = () => {
    const nom = nouvelleCategorie.nomCategorie?.trim()
    const duree = nouvelleCategorie.dureeAmortissement

    if (!nom || !duree) {
      afficherToast("Tous les champs sont obligatoires.", "erreur")
      return
    }

    const data = {
      nomCategorie: nouvelleCategorie.nomCategorie.trim(),
      dureeAmortissement: Number.parseInt(nouvelleCategorie.dureeAmortissement, 10),
    }

    if (categorieEnEdition) {
      updateCategorie(categorieEnEdition.idCategorie, {
        ...data,
        idCategorie: categorieEnEdition.idCategorie,
      })
        .then(() => {
          afficherToast("Catégorie modifiée avec succès !", "succes")
          setCategorieEnEdition(null)
          setNouvelleCategorie({ nomCategorie: "", dureeAmortissement: "" })
          chargerCategories()
        })
        .catch(() => afficherToast("Erreur lors de la modification", "erreur"))
    } else {
      createCategorie(data)
        .then(() => {
          afficherToast("Catégorie créée avec succès !", "succes")
          setNouvelleCategorie({ nomCategorie: "", dureeAmortissement: "" })
          chargerCategories()
        })
        .catch(() => afficherToast("Erreur lors de la création", "erreur"))
    }
  }

  const supprimerCategorie = (id) => {
    afficherConfirmation("Êtes-vous sûr de vouloir supprimer cette catégorie ?", () => {
      deleteCategorie(id)
        .then(() => {
          afficherToast("Catégorie supprimée avec succès !", "succes")
          chargerCategories()
        })
        .catch(() => afficherToast("Impossible de supprimer cette catégorie", "erreur"))
    })
  }

  const lancerEditionCategorie = (cat) => {
    setCategorieEnEdition(cat)
    setNouvelleCategorie({
      nomCategorie: cat.nomCategorie || "",
      dureeAmortissement: cat.dureeAmortissement || "",
    })
  }

  // Générer un code barre EAN-13
  const genererCodeBarre = () => {
    // Générer 12 chiffres aléatoires
    let code = "978" // Préfixe pour les livres (juste pour l'exemple)
    for (let i = 0; i < 9; i++) {
      code += Math.floor(Math.random() * 10)
    }

    // Calculer le chiffre de contrôle
    let somme = 0
    for (let i = 0; i < 12; i++) {
      somme += Number.parseInt(code[i]) * (i % 2 === 0 ? 1 : 3)
    }
    const chiffreControle = (10 - (somme % 10)) % 10

    return code + chiffreControle
  }

  // Ouvrir le modal pour ajouter un nouvel immobilier
  const ouvrirModalAjout = () => {
    setImmobilierEnEdition(null)
    setNouvelImmobilier({
      ...objetVideImmobilier,
      codeArticle: `IMM-${String(immobilierItems.length + 1).padStart(3, "0")}`,
      codeBarre: genererCodeBarre(),
      dateAcquisition: new Date().toISOString().split("T")[0],
    })
    setModalOuvert(true)
  }

  // Ouvrir le modal pour éditer un immobilier existant
  const ouvrirModalEdition = (immobilier) => {
    setImmobilierEnEdition(immobilier)
    setNouvelImmobilier({
      codeArticle: immobilier.codeArticle,
      nomBien: immobilier.nomBien,
      codeBarre: immobilier.codeBarre,
      valeurAcquisition: immobilier.valeurAcquisition.toString(),
      tauxAmortissement: immobilier.tauxAmortissement,
      dateAcquisition: immobilier.dateAcquisition,
      quantite: immobilier.quantite.toString(),
      idCategorie: immobilier.idCategorie,
      statut: immobilier.statut,
    })
    setModalOuvert(true)
  }

  // Fermer le modal
  const fermerModal = () => {
    setModalOuvert(false)
  }

  const sauvegarderImmobilier = () => {
    // Vérification simple
    if (
      !nouvelImmobilier.nomBien ||
      !nouvelImmobilier.valeurAcquisition ||
      !nouvelImmobilier.tauxAmortissement ||
      !nouvelImmobilier.quantite ||
      !nouvelImmobilier.idCategorie
    ) {
      afficherToast("Veuillez remplir tous les champs obligatoires.", "erreur")
      return
    }

    const data = {
      nomBien: nouvelImmobilier.nomBien,
      valeurAcquisition: Number.parseFloat(nouvelImmobilier.valeurAcquisition),
      tauxAmortissement: Number.parseFloat(nouvelImmobilier.tauxAmortissement),
      quantite: Number.parseInt(nouvelImmobilier.quantite, 10) || 1,
      statut: nouvelImmobilier.statut,
      idCategorie: Number.parseInt(nouvelImmobilier.idCategorie, 10),
      dateAcquisition: nouvelImmobilier.dateAcquisition,
      codeBarre: nouvelImmobilier.codeBarre,
    }

    setLoading(true)
    createImmobilier(data)
      .then((res) => {
        afficherToast("Immobilier enregistré avec succès!", "succes")
        setNouvelImmobilier(objetVideImmobilier)
        setModalOuvert(false)
        // Recharger les immobiliers après création
        setTimeout(() => chargerImmobiliers(), 500)
      })
      .catch((err) => {
        console.error("Erreur création immobilier:", err)
        afficherToast("Erreur lors de l'enregistrement.", "erreur")
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const supprimerImmobilier = (id) => {
    afficherConfirmation("Êtes-vous sûr de vouloir supprimer cet immobilier ?", () => {
      setLoading(true)
      deleteImmobilier(id)
        .then(() => {
          setImmobilierItems((prev) => prev.filter((item) => item.id !== id))
          afficherToast("Immobilier supprimé avec succès!", "succes")
        })
        .catch((err) => {
          console.error("Erreur suppression:", err)
          afficherToast("Erreur lors de la suppression", "erreur")
        })
        .finally(() => {
          setLoading(false)
        })
    })
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

  // Filtrer les immobiliers
  const immobiliersFiltres = immobilierItems.filter(
    (item) =>
      (item.nomBien || "").toLowerCase().includes(filtreDesignation.toLowerCase()) ||
      (item.codeArticle || "").toLowerCase().includes(filtreDesignation.toLowerCase()) ||
      (item.categorie || "").toLowerCase().includes(filtreDesignation.toLowerCase()),
  )

  return (
    <div className="imstock-container">
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Chargement en cours...</p>
        </div>
      )}

      <h2 className="page-title">Gestion du stock des immobiliers</h2>

      {apiStatus !== "available" && (
        <div className="api-status-warning">
          <AlertCircle size={20} />
          <span>
            {apiStatus === "checking"
              ? "Vérification de la connexion à l'API..."
              : "Mode hors ligne: utilisation de données de démonstration. L'API n'est pas accessible."}
          </span>
          <button onClick={toggleMockData}>{useMock ? "Essayer l'API" : "Utiliser les données de démo"}</button>
        </div>
      )}

      {error && (
        <div className="error-message">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={chargerImmobiliers}>
            <RefreshCw size={16} /> Réessayer
          </button>
        </div>
      )}

      <div className="imstock-header">
        <div className="imstock-actions">
          <button className="btn-add" onClick={ouvrirModalAjout}>
            <Plus size={16} /> Ajouter un bien
          </button>
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher un bien..."
              value={filtreDesignation}
              onChange={(e) => setFiltreDesignation(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="section-categorie">
        <h2>Gestion des catégories</h2>

        {alerteCategorie && <div className="message">{alerteCategorie}</div>}

        <div className="formulaire-categorie">
          <input
            type="text"
            placeholder="Nom de la catégorie"
            value={nouvelleCategorie.nomCategorie}
            onChange={(e) =>
              setNouvelleCategorie((prev) => ({
                ...prev,
                nomCategorie: e.target.value,
              }))
            }
          />
          <input
            type="number"
            placeholder="Durée d'amortissement"
            min="1"
            value={nouvelleCategorie.dureeAmortissement}
            onChange={(e) =>
              setNouvelleCategorie((prev) => ({
                ...prev,
                dureeAmortissement: Number.parseInt(e.target.value, 10) || "",
              }))
            }
          />
          <button onClick={sauvegarderCategorie}>{categorieEnEdition ? "Modifier" : "Créer"}</button>
          {categorieEnEdition && (
            <button
              onClick={() => {
                setCategorieEnEdition(null)
                setNouvelleCategorie({
                  nomCategorie: "",
                  dureeAmortissement: "",
                })
              }}
            >
              Annuler
            </button>
          )}
        </div>

        <table className="table-categorie">
          <thead>
            <tr>
              <th>#</th>
              <th>Nom</th>
              <th>Durée d'amortissement</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length > 0 ? (
              categories.map((cat, index) => (
                <tr key={cat.idCategorie}>
                  <td>{index + 1}</td>
                  <td>{cat.nomCategorie}</td>
                  <td>{cat.dureeAmortissement} ans</td>
                  <td>
                    <button onClick={() => lancerEditionCategorie(cat)} className="btn-icon">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => supprimerCategorie(cat.idCategorie)} className="btn-icon">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="no-data">
                  Aucune catégorie trouvée
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="imstock-table-container">
        <table className="imstock-table">
          <thead>
            <tr>
              <th>Code Article</th>
              <th>Désignation</th>
              <th>Date d'acquisition</th>
              <th>Catégorie</th>
              <th>Valeur d'acquisition</th>
              <th>Taux d'amortissement</th>
              <th>Quantité</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {immobiliersFiltres.length > 0 ? (
              immobiliersFiltres.map((item) => (
                <tr key={item.id}>
                  <td>{item.codeArticle}</td>
                  <td>{item.nomBien}</td>
                  <td>{item.dateAcquisition}</td>
                  <td>{item.categorie}</td>
                  <td>{item.valeurAcquisition.toLocaleString()} Ar</td>
                  <td>{item.tauxAmortissement}%</td>
                  <td>{item.quantite}</td>
                  <td>{item.statut}</td>
                  <td className="actions">
                    <button onClick={() => ouvrirModalEdition(item)} className="btn-icon">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => supprimerImmobilier(item.id)} className="btn-icon">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="no-data">
                  {loading ? "Chargement..." : "Aucun bien immobilier trouvé"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal d'ajout/modification */}
      {modalOuvert && (
        <div className="modal-overlay">
          <div className="modal-contenu">
            <h2>{immobilierEnEdition ? "Modifier" : "Ajouter"} un immobilier</h2>

            {/* Désignation */}
            <div className="groupe-champ">
              <label htmlFor="nomBien">Désignation</label>
              <input
                id="nomBien"
                name="nomBien"
                type="text"
                value={nouvelImmobilier.nomBien || ""}
                onChange={(e) => setNouvelImmobilier({ ...nouvelImmobilier, nomBien: e.target.value || "" })}
                required
              />
            </div>

            {/* Prix d'achat */}
            <div className="groupe-champ">
              <label htmlFor="valeurAcquisition">Valeur d'acquisition (Ar)</label>
              <input
                id="valeurAcquisition"
                name="valeurAcquisition"
                type="number"
                min="0"
                value={nouvelImmobilier.valeurAcquisition}
                onChange={(e) =>
                  setNouvelImmobilier({
                    ...nouvelImmobilier,
                    valeurAcquisition: Number.parseFloat(e.target.value) || 0,
                  })
                }
                required
              />
            </div>

            <div className="groupe-champ">
              <label htmlFor="categorie">Catégorie</label>
              <select
                id="categorie"
                value={nouvelImmobilier.idCategorie || ""}
                onChange={(e) =>
                  setNouvelImmobilier({
                    ...nouvelImmobilier,
                    idCategorie: Number.parseInt(e.target.value, 10) || null,
                  })
                }
                required
              >
                <option value="">-- Sélectionner une catégorie --</option>
                {categories.map((cat) => (
                  <option key={cat.idCategorie} value={cat.idCategorie}>
                    {cat.nomCategorie}
                  </option>
                ))}
              </select>
            </div>

            {/* Date d'acquisition */}
            <div className="groupe-champ">
              <label htmlFor="dateAcquisition">Date d'acquisition</label>
              <input
                id="dateAcquisition"
                name="dateAcquisition"
                type="date"
                value={nouvelImmobilier.dateAcquisition}
                onChange={(e) =>
                  setNouvelImmobilier({
                    ...nouvelImmobilier,
                    dateAcquisition: e.target.value,
                  })
                }
                required
              />
            </div>

            {/* Quantité */}
            <div className="groupe-champ">
              <label htmlFor="quantite">Quantité</label>
              <input
                id="quantite"
                name="quantite"
                type="number"
                min="1"
                value={nouvelImmobilier.quantite}
                onChange={(e) =>
                  setNouvelImmobilier({
                    ...nouvelImmobilier,
                    quantite: Number.parseInt(e.target.value, 10) || 1,
                  })
                }
                required
              />
            </div>

            {/* Taux d'amortissement */}
            <div className="groupe-champ">
              <label htmlFor="taux">Taux d'amortissement (%)</label>
              <input
                id="taux"
                name="tauxAmortissement"
                type="number"
                min="0.01"
                step="0.01"
                value={nouvelImmobilier.tauxAmortissement}
                onChange={(e) =>
                  setNouvelImmobilier({
                    ...nouvelImmobilier,
                    tauxAmortissement: Number.parseFloat(e.target.value) || 0,
                  })
                }
                required
              />
            </div>

            {/* Statut */}
            <div className="groupe-champ">
              <label htmlFor="statut">Statut</label>
              <select
                id="statut"
                value={nouvelImmobilier.statut}
                onChange={(e) =>
                  setNouvelImmobilier({
                    ...nouvelImmobilier,
                    statut: e.target.value || "actif",
                  })
                }
                required
              >
                <option value="actif">Actif</option>
                <option value="amorti">Amorti</option>
              </select>
            </div>

            <div className="actions-modal">
              <button className="bouton-annuler" onClick={fermerModal}>
                Annuler
              </button>
              <button type="button" className="bouton-sauvegarder" onClick={sauvegarderImmobilier}>
                <Save size={16} /> Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

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
                      toast.onConfirm()
                      supprimerToast(toast.id)
                    }}
                    className="toast-btn confirm"
                  >
                    Confirmer
                  </button>
                  <button
                    onClick={() => {
                      toast.onCancel()
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
    </div>
  )
}

export default ImStock

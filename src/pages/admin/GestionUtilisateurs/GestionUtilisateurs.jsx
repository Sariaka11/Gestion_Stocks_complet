"use client"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  getUsers,
  getUserAgence,
  getUserFournitures,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getAgences,
  createAgence,
  updateAgence,
  createUserAgence,
  updateUserAgence,
  getUserAgenceByUserId,
  checkEmail,
} from "../../../services/userServices"
import { getBienByAgence } from "../../../services/bienAgenceServices"
import { afficherMessage } from "../../../components/utils"
import { getFournitures } from "../../../services/fournituresServices"
import "./css/gestion.css"

function GestionUtilisateurs() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("Tous les types")
  const [selectedUser, setSelectedUser] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDispatcheModal, setShowDispatcheModal] = useState(false)
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [activeTab, setActiveTab] = useState("Consommables")

  const [nouvelleAgence, setNouvelleAgence] = useState("")
  const [numeroAgence, setNumeroAgence] = useState("")
  const [nouveauNom, setNouveauNom] = useState("")
  const [nouveauPrenom, setNouveauPrenom] = useState("")
  const [nouveauEmail, setNouveauEmail] = useState("")
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState("")
  const [messageContact, setMessageContact] = useState("")
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const API_URL = "http://localhost:5000/api"

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await getUsers()
      const data = response.data
      const usersWithDetails = await Promise.all(
        data.map(async (user) => {
          const agenceResponse = await getUserAgence(user.Id).catch(() => ({
            data: { nom: "N/A" },
          }))
          const fournituresResponse = await getUserFournitures(user.Id).catch(() => ({
            data: [],
          }))
          let stockItems = fournituresResponse.data
          if (stockItems && stockItems.$values && Array.isArray(stockItems.$values)) {
            stockItems = stockItems.$values
          } else if (!Array.isArray(stockItems)) {
            console.warn(`stockItems non valide pour user ${user.Id} :`, stockItems)
            stockItems = []
          }

          let stockLevel = 0
          let stockCritique = false
          if (stockItems.length > 0) {
            const stockPercentages = stockItems.map((item) => {
              const initialQty = item.QuantiteInitiale || item.Quantite || 1
              const remainingQty = item.QuantiteRestante || 0
              return (remainingQty / initialQty) * 100
            })
            stockLevel = Math.round(stockPercentages.reduce((sum, pct) => sum + pct, 0) / stockPercentages.length)
            stockLevel = Math.min(100, Math.max(0, stockLevel))
            stockCritique = stockItems.some((item) => (item.Quantite || 0) < (item.SeuilCritique || 10))
          }

          const agence = agenceResponse.data
          return {
            id: user.Id,
            nom: `${user.Nom} ${user.Prenom}`,
            role: user.Fonction,
            agence: agence.Nom,
            email: user.Email,
            telephone: "+261 34 00 000 00",
            dateCreation: new Date().toLocaleDateString(),
            stockCritique: stockCritique,
            stockLevel: stockLevel,
            stockItems: Array.isArray(stockItems)
              ? stockItems.map((item) => ({
                  id: item.Id,
                  designation: item.Nom,
                  quantite: item.Quantite || 0,
                  quantiteInitiale: item.QuantiteInitiale || item.Quantite || 0,
                  seuil: item.seuilCritique || 10,
                  cmup: item.CMUP || 0,
                }))
              : [],
          }
        }),
      )
      setUsers(usersWithDetails)
    } catch (err) {
      console.error("Erreur fetchUsers :", err)
      afficherMessage(err.message || "Erreur lors du chargement des utilisateurs", "erreur")
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const ajouterUtilisateur = async () => {
    if (!nouveauNom || !nouveauPrenom || !nouvelleAgence || !numeroAgence || !nouveauEmail || !nouveauMotDePasse) {
      afficherMessage("Veuillez remplir tous les champs obligatoires", "erreur")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(nouveauEmail)) {
      afficherMessage("Veuillez entrer un email valide", "erreur")
      return
    }

    try {
      const emailCheckResponse = await checkEmail(nouveauEmail)
      if (emailCheckResponse.data.exists) {
        afficherMessage("Un utilisateur avec cet email existe déjà.", "erreur")
        return
      }

      let agence
      const agenceResponse = await getAgences()
      const agences = Array.isArray(agenceResponse.data.$values) ? agenceResponse.data.$values : agenceResponse.data
      agence = agences.find((a) => a.nom.toLowerCase() === nouvelleAgence.toLowerCase() || a.numero === numeroAgence)

      if (!agence) {
        const newAgenceResponse = await createAgence({
          nom: nouvelleAgence,
          numero: numeroAgence,
        })
        agence = newAgenceResponse.data
      }

      const userResponse = await createUser({
        nom: nouveauNom,
        prenom: nouveauPrenom,
        email: nouveauEmail,
        motDePasse: nouveauMotDePasse,
        fonction: "utilisateur",
        dateAssociation: new Date(),
      })

      const user = userResponse.data

      await createUserAgence({
        userId: user.id,
        agenceId: agence.id,
        dateAssociation: new Date(),
      })

      const newUserResponse = await getUserById(user.Id)
      const newUserData = newUserResponse.data

      const agenceDetails = await getUserAgence(user.Id).catch(() => ({
        data: { nom: agence.Nom },
      }))

      const fournituresResponse = await getUserFournitures(user.id).catch(() => ({
        data: [],
      }))

      let stockItems = fournituresResponse.data
      if (stockItems && stockItems.$values && Array.isArray(stockItems.$values)) {
        stockItems = stockItems.$values
      } else if (!Array.isArray(stockItems)) {
        stockItems = []
      }

      const newUser = {
        id: newUserData.id,
        nom: `${newUserData.nom} ${newUserData.prenom}`,
        role: newUserData.fonction,
        agence: agenceDetails.data.nom,
        email: newUserData.email,
        telephone: "+261 34 00 000 00",
        dateCreation: new Date().toLocaleDateString(),
        stockCritique: false,
        stockLevel: 0,
        stockItems: stockItems.map((item) => ({
          id: item.id,
          designation: item.nom,
          quantite: item.quantite,
          seuil: item.seuilCritique || 10,
          cmup: item.cmup || 0,
        })),
      }

      setUsers([...users, newUser])
      setNouveauNom("")
      setNouveauPrenom("")
      setNouvelleAgence("")
      setNumeroAgence("")
      setNouveauEmail("")
      setNouveauMotDePasse("")
      setShowAddUserModal(false)
      afficherMessage(`Utilisateur ${newUser.nom} ajouté avec succès !`, "succes")
      await fetchUsers()
    } catch (err) {
      console.error("Erreur lors de la création de l'utilisateur :", err)
      const errorMessage = err.response?.data?.message || err.message || "Erreur lors de la création de l'utilisateur"
      afficherMessage(errorMessage, "erreur")
    }
  }

  const modifierUtilisateur = async () => {
    if (!nouveauNom || !nouveauPrenom || !nouvelleAgence || !numeroAgence || !nouveauEmail) {
      afficherMessage("Veuillez remplir tous les champs obligatoires", "erreur")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(nouveauEmail)) {
      afficherMessage("Veuillez entrer un email valide", "erreur")
      return
    }

    try {
      let agence
      const agenceResponse = await getAgences()
      const agences = Array.isArray(agenceResponse.data.$values) ? agenceResponse.data.$values : agenceResponse.data
      agence = agences.find((a) => a.nom.toLowerCase() === nouvelleAgence.toLowerCase() || a.numero === numeroAgence)

      if (!agence) {
        const newAgenceResponse = await createAgence({
          nom: nouvelleAgence,
          numero: numeroAgence,
        })
        agence = newAgenceResponse.data
      } else {
        await updateAgence(agence.id, {
          nom: nouvelleAgence,
          numero: numeroAgence,
        })
      }

      const userData = {
        id: selectedUser.id,
        nom: nouveauNom,
        prenom: nouveauPrenom,
        email: nouveauEmail,
        fonction: "Utilisateur",
      }

      if (nouveauMotDePasse) {
        userData.motDePasse = nouveauMotDePasse
      }

      await updateUser(selectedUser.id, userData)

      const userAgenceResponse = await getUserAgenceByUserId(selectedUser.id).catch(() => ({ data: null }))
      if (userAgenceResponse.data) {
        await updateUserAgence(selectedUser.id, {
          userId: selectedUser.id,
          agenceId: agence.id,
        })
      } else {
        await createUserAgence({
          userId: selectedUser.id,
          agenceId: agence.id,
        })
      }

      const usersModifies = users.map((user) =>
        user.id === selectedUser.id
          ? {
              ...user,
              nom: `${nouveauNom} ${nouveauPrenom}`,
              email: nouveauEmail,
              agence: nouvelleAgence,
              role: "Utilisateur",
            }
          : user,
      )

      setUsers(usersModifies)
      setSelectedUser({
        ...selectedUser,
        nom: `${nouveauNom} ${nouveauPrenom}`,
        email: nouveauEmail,
        agence: nouvelleAgence,
        role: "Utilisateur",
      })

      setShowEditModal(false)
      afficherMessage(`Utilisateur ${nouveauNom} ${nouveauPrenom} modifié avec succès !`, "succes")
      await fetchUsers()
    } catch (err) {
      console.error("Erreur lors de la modification de l'utilisateur :", err)
      const errorMessage =
        err.response?.data?.message || err.message || "Erreur lors de la modification de l'utilisateur"
      afficherMessage(errorMessage, "erreur")
    }
  }

  const confirmerSuppression = (user) => {
    setUserToDelete(user)
    setShowDeleteConfirmModal(true)
  }

  const supprimerUtilisateur = async () => {
    if (!userToDelete) return

    try {
      await deleteUser(userToDelete.id || userToDelete)
      setUsers(users.filter((user) => user.id !== (userToDelete.id || userToDelete)))
      setShowModal(false)
      setShowDeleteConfirmModal(false)
      setUserToDelete(null)
      afficherMessage("Utilisateur supprimé avec succès !", "succes")
    } catch (err) {
      console.error("Erreur lors de la suppression de l'utilisateur :", err)
      afficherMessage(
        err.response?.data?.message || err.message || "Erreur lors de la suppression de l'utilisateur",
        "erreur",
      )
    }
  }

  const annulerSuppression = () => {
    setShowDeleteConfirmModal(false)
    setUserToDelete(null)
  }

  const envoyerMessage = () => {
    if (!messageContact.trim()) {
      afficherMessage("Veuillez saisir un message", "erreur")
      return
    }
    console.log(`Message envoyé à ${selectedUser.nom}: ${messageContact}`)
    setMessageContact("")
    setShowContactModal(false)
    afficherMessage(`Message envoyé à ${selectedUser.nom}`, "succes")
  }

  const envoyerStock = (type) => {
    setShowDispatcheModal(false)
    if (type === "consommables") {
      navigate("/admin/consommables/dispatche")
    } else {
      navigate("/admin/immobiliers/dispatche")
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.agence.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterType === "Tous les types" || user.role === filterType

    return matchesSearch && matchesFilter
  })

  const openUserDetails = async (user) => {
    try {
      const userResponse = await getUserById(user.id)
      const userData = userResponse.data

      const agenceResponse = await getUserAgence(user.id).catch(() => ({
        data: { nom: "N/A", Id: null },
      }))

      // Récupérer les fournitures (consommables)
      const fournituresResponse = await getFournitures().catch(() => ({
        data: [],
      }))

      let stockItems = fournituresResponse.data
      if (!Array.isArray(stockItems)) {
        console.warn(`stockItems non valide pour user ${user.Id} :`, stockItems)
        stockItems = []
      } else {
        stockItems = stockItems.flatMap((item) => {
          const agencyData = item.AgenceFournitures?.find((el) => el.AgenceId == agenceResponse.data.Id)
          return agencyData
            ? [
                {
                  ...agencyData,
                  nom: item.Nom,
                  prixUnitaire: item.PrixUnitaire,
                  quantiteRestante: agencyData.Quantite || agencyData.QuantiteRestante || 0,
                  quantiteInitiale: agencyData.qtt || agencyData.Quantite || agencyData.quantiteInitiale || 0,
                  categorie: item.Categorie,
                  cmup: item.cmup || item.PrixUnitaire || 0,
                  seuilCritique: agencyData.seuilCritique || item.seuilCritique || 10,
                },
              ]
            : []
        })
      }

      // Récupérer les données de BIEN_AGENCE (immobiliers)
      const bienAgenceResponse = await getBienByAgence(agenceResponse.data.Id).catch(() => ({
        data: [],
      }))

      let immobilierItems = bienAgenceResponse.data
      if (immobilierItems && immobilierItems.$values && Array.isArray(immobilierItems.$values)) {
        immobilierItems = immobilierItems.$values
      } else if (!Array.isArray(immobilierItems)) {
        console.warn(`immobilierItems non valide pour agence ${agenceResponse.data.Id} :`, immobilierItems)
        immobilierItems = []
      }

      // Mapper les données de BIEN_AGENCE - CORRECTION APPLIQUÉE ICI
      immobilierItems = immobilierItems.map((item) => {
        // Utiliser les bonnes propriétés de l'API
        const quantiteRestante = item.Quantite || item.quantite || 0
        const quantiteConso = item.QuantiteConso || item.quantiteConso || 0
        const seuilCritique = item.Immobilisation?.SeuilCritique || item.seuilCritique || 10
        const designation = item.Immobilisation?.NomBien || item.NomBien || "Inconnu"

        return {
          id: item.IdBien || item.id,
          designation: designation,
          quantite: quantiteRestante,
          quantiteConso: quantiteConso,
          quantiteInitiale: item.QuantiteInitiale || item.Quantite || quantiteRestante,
          seuil: seuilCritique,
          cmup: item.Immobilisation?.PrixUnitaire || item.CMUP || 0,
        }
      })

      // Calcul amélioré du niveau de stock et statut critique pour consommables
      let stockLevel = 0
      let stockCritique = false
      if (stockItems.length > 0) {
        const stockPercentages = stockItems.map((item) => {
          const initialQty = item.QuantiteInitiale || 1
          return (item.QuantiteRestante / initialQty) * 100
        })
        stockLevel = Math.round(stockPercentages.reduce((sum, pct) => sum + pct, 0) / stockPercentages.length)
        stockLevel = Math.min(100, Math.max(0, stockLevel))
        stockCritique = stockItems.some((item) => item.QuantiteRestante < item.seuilCritique)
      }

      const updatedUser = {
        id: userData.Id,
        nom: `${userData.Nom} ${userData.Prenom}`,
        role: userData.Fonction,
        agence: agenceResponse.data.nom,
        email: userData.Email,
        telephone: "+261 34 00 000 00",
        dateCreation: new Date().toLocaleDateString(),
        stockCritique: stockCritique,
        stockLevel: stockLevel,
        stockItems: stockItems.map((item) => ({
          id: item.id,
          designation: item.nom,
          quantite: item.quantiteRestante,
          quantiteInitiale: item.quantiteInitiale,
          seuil: item.seuilCritique,
          cmup: item.cmup,
        })),
        immobilierItems: immobilierItems,
      }

      setSelectedUser(updatedUser)
      setShowModal(true)
    } catch (err) {
      console.error("Erreur lors du chargement des détails de l'utilisateur :", err)
      afficherMessage("Erreur lors du chargement des détails", "erreur")
    }
  }

  const openContactModal = () => {
    setMessageContact("")
    setShowContactModal(true)
    setShowModal(false)
  }

  const openEditModal = () => {
    setNouveauNom(selectedUser.nom.split(" ")[0])
    setNouveauPrenom(selectedUser.nom.split(" ").slice(1).join(" "))
    setNouveauEmail(selectedUser.email)
    setNouvelleAgence(selectedUser.agence)
    setNumeroAgence("")
    setNouveauMotDePasse("")
    setShowEditModal(true)
    setShowModal(false)
  }

  const openDispatcheModal = () => {
    setShowDispatcheModal(true)
    setShowModal(false)
  }

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <div className="gestion-utilisateurs-container">
      <h1 className="page-title">Gestion des Utilisateurs</h1>
      <div className="search-filter-container">
        <div className="search-box">
          <svg
            className="search-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <svg
            className="filter-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"></polygon>
          </svg>
          <label>Type:</label>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option>Tous les types</option>
            <option>Utilisateur</option>
            <option>admin</option>
          </select>
        </div>
        <button className="btn-add-user" onClick={() => setShowAddUserModal(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Ajouter un utilisateur
        </button>
      </div>

      {showDeleteConfirmModal && userToDelete && (
        <div className="modal-overlay">
          <div className="modal-contenu">
            <div className="modal-header">
              <h2>Confirmer la suppression</h2>
              <button className="close-modal-btn" onClick={annulerSuppression}>
                ×
              </button>
            </div>
            <div className="formulaire-modal">
              <div className="confirmation-content">
                <div className="warning-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                </div>
                <p>
                  Êtes-vous sûr de vouloir supprimer l'utilisateur{" "}
                  <strong>{userToDelete.nom || `Utilisateur ${userToDelete}`}</strong> ?
                </p>
                <p className="warning-text">Cette action est irréversible.</p>
              </div>
              <div className="actions-modal">
                <button className="bouton-annuler" onClick={annulerSuppression}>
                  Annuler
                </button>
                <button className="bouton-supprimer" onClick={supprimerUtilisateur}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3,6 5,6 21,6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                  Supprimer définitivement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddUserModal && (
        <div className="modal-overlay">
          <div className="modal-contenu">
            <div className="modal-header">
              <h2>Ajouter un utilisateur</h2>
              <button className="close-modal-btn" onClick={() => setShowAddUserModal(false)}>
                ×
              </button>
            </div>
            <div className="formulaire-modal">
              <div className="groupe-champ">
                <label htmlFor="nom">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  Nom*
                </label>
                <input
                  id="nom"
                  name="nom"
                  type="text"
                  value={nouveauNom}
                  onChange={(e) => setNouveauNom(e.target.value)}
                  required
                  placeholder="Ex: Rakoto"
                />
              </div>
              <div className="groupe-champ">
                <label htmlFor="prenom">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  Prénom*
                </label>
                <input
                  id="prenom"
                  name="prenom"
                  type="text"
                  value={nouveauPrenom}
                  onChange={(e) => setNouveauPrenom(e.target.value)}
                  required
                  placeholder="Ex: Jean"
                />
              </div>
              <div className="groupe-champ">
                <label htmlFor="email">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  Email*
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={nouveauEmail}
                  onChange={(e) => setNouveauEmail(e.target.value)}
                  required
                  placeholder="Ex: rakoto.jean@example.com"
                />
              </div>
              <div className="groupe-champ">
                <label htmlFor="motDePasse">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <circle cx="12" cy="16" r="1"></circle>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  Mot de passe*
                </label>
                <input
                  id="motDePasse"
                  name="motDePasse"
                  type="password"
                  value={nouveauMotDePasse}
                  onChange={(e) => setNouveauMotDePasse(e.target.value)}
                  required
                  placeholder="Entrez le mot de passe"
                />
              </div>
              <div className="groupe-champ">
                <label htmlFor="agence">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 21h18"></path>
                    <path d="M5 21V7l8-4v18"></path>
                    <path d="M19 21V11l-6-4"></path>
                  </svg>
                  Nom de l'Agence*
                </label>
                <input
                  id="agence"
                  name="agence"
                  type="text"
                  value={nouvelleAgence}
                  onChange={(e) => setNouvelleAgence(e.target.value)}
                  required
                  placeholder="Ex: Agence Centrale"
                />
              </div>
              <div className="groupe-champ">
                <label htmlFor="numeroAgence">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 21h18"></path>
                    <path d="M5 21V7l8-4v18"></path>
                    <path d="M19 21V11l-6-4"></path>
                  </svg>
                  Numéro d'Agence*
                </label>
                <input
                  id="numeroAgence"
                  name="numeroAgence"
                  type="text"
                  value={numeroAgence}
                  onChange={(e) => setNumeroAgence(e.target.value)}
                  required
                  placeholder="Ex: CEM01"
                />
              </div>
              <div className="actions-modal">
                <button className="bouton-annuler" onClick={() => setShowAddUserModal(false)}>
                  Annuler
                </button>
                <button
                  className="bouton-sauvegarder"
                  onClick={ajouterUtilisateur}
                  disabled={
                    !nouveauNom ||
                    !nouveauPrenom ||
                    !nouvelleAgence ||
                    !numeroAgence ||
                    !nouveauEmail ||
                    !nouveauMotDePasse
                  }
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showContactModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-contenu">
            <div className="modal-header">
              <h2>Contacter {selectedUser.nom}</h2>
              <button className="close-modal-btn" onClick={() => setShowContactModal(false)}>
                ×
              </button>
            </div>
            <div className="formulaire-modal">
              <div className="contact-info">
                <div className="contact-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  <span>{selectedUser.Email}</span>
                </div>
                <div className="contact-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  <span>{selectedUser.telephone}</span>
                </div>
              </div>
              <div className="groupe-champ">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  rows="5"
                  value={messageContact}
                  onChange={(e) => setMessageContact(e.target.value)}
                  placeholder="Saisissez votre message ici..."
                  required
                ></textarea>
              </div>
              <div className="actions-modal">
                <button className="bouton-annuler" onClick={() => setShowContactModal(false)}>
                  Annuler
                </button>
                <button className="bouton-sauvegarder" onClick={envoyerMessage} disabled={!messageContact.trim()}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  Envoyer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-contenu">
            <div className="modal-header">
              <h2>Modifier {selectedUser.nom}</h2>
              <button className="close-modal-btn" onClick={() => setShowEditModal(false)}>
                ×
              </button>
            </div>
            <div className="formulaire-modal">
              <div className="groupe-champ">
                <label htmlFor="edit-nom">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  Nom
                </label>
                <input
                  id="edit-nom"
                  name="edit-nom"
                  type="text"
                  value={nouveauNom}
                  onChange={(e) => setNouveauNom(e.target.value)}
                  required
                />
              </div>
              <div className="groupe-champ">
                <label htmlFor="edit-prenom">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  Prénom
                </label>
                <input
                  id="edit-prenom"
                  name="edit-prenom"
                  type="text"
                  value={nouveauPrenom}
                  onChange={(e) => setNouveauPrenom(e.target.value)}
                  required
                />
              </div>
              <div className="groupe-champ">
                <label htmlFor="edit-email">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  Email
                </label>
                <input
                  id="edit-email"
                  name="edit-email"
                  type="email"
                  value={nouveauEmail}
                  onChange={(e) => setNouveauEmail(e.target.value)}
                  required
                />
              </div>
              <div className="groupe-champ">
                <label htmlFor="edit-motDePasse">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <circle cx="12" cy="16" r="1"></circle>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  Mot de passe (laisser vide pour ne pas modifier)
                </label>
                <input
                  id="edit-motDePasse"
                  name="edit-motDePasse"
                  type="password"
                  value={nouveauMotDePasse}
                  onChange={(e) => setNouveauMotDePasse(e.target.value)}
                  placeholder="Nouveau mot de passe"
                />
              </div>
              <div className="groupe-champ">
                <label htmlFor="edit-agence">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 21h18"></path>
                    <path d="M5 21V7l8-4v18"></path>
                    <path d="M19 21V11l-6-4"></path>
                  </svg>
                  Nom de l'Agence
                </label>
                <input
                  id="edit-agence"
                  name="edit-agence"
                  type="text"
                  value={nouvelleAgence}
                  onChange={(e) => setNouvelleAgence(e.target.value)}
                  required
                />
              </div>
              <div className="groupe-champ">
                <label htmlFor="edit-numeroAgence">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 21h18"></path>
                    <path d="M5 21V7l8-4v18"></path>
                    <path d="M19 21V11l-6-4"></path>
                  </svg>
                  Numéro d'Agence
                </label>
                <input
                  id="edit-numeroAgence"
                  name="edit-numeroAgence"
                  type="text"
                  value={numeroAgence}
                  onChange={(e) => setNumeroAgence(e.target.value)}
                  required
                />
              </div>
              <div className="actions-modal">
                <button className="bouton-annuler" onClick={() => setShowEditModal(false)}>
                  Annuler
                </button>
                <button className="bouton-sauvegarder" onClick={modifierUtilisateur}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDispatcheModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-contenu">
            <div className="modal-header">
              <h2>Envoyer du stock à {selectedUser.nom}</h2>
              <button className="close-modal-btn" onClick={() => setShowDispatcheModal(false)}>
                ×
              </button>
            </div>
            <div className="dispatche-options">
              <div className="dispatche-option" onClick={() => envoyerStock("consommables")}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line>
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27,6.96 12,12.01 20.73,6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
                <h3>Consommables</h3>
                <p>Envoyer des articles consommables</p>
              </div>
              <div className="dispatche-option" onClick={() => envoyerStock("immobiliers")}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 21h18"></path>
                  <path d="M5 21V7l8-4v18"></path>
                  <path d="M19 21V11l-6-4"></path>
                </svg>
                <h3>Immobiliers</h3>
                <p>Envoyer des biens immobiliers</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Chargement des utilisateurs...</p>
        </div>
      ) : (
        <div className="users-grid">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div key={user.id} className="user-card">
                <div className="user-header">
                  <div className="user-avatar">
                    <div className="avatar-circle">{getInitials(user.nom)}</div>
                  </div>
                  <div className="user-info">
                    <h3>{user.nom}</h3>
                    <p>{user.role}</p>
                    <p className="user-agence">
                      Agence: <span>{user.agence}</span>
                    </p>
                  </div>
                  {user.stockCritique && (
                    <button className="stock-alert-btn" onClick={() => openUserDetails(user)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                      </svg>
                      Stock critique
                    </button>
                  )}
                </div>
                <div className="user-details">
                  <div className="detail-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    <span>{user.email}</span>
                  </div>
                </div>
                <div className="user-actions">
                  <button className="view-details-btn" onClick={() => openUserDetails(user)}>
                    Voir détails
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12,5 19,12 12,19"></polyline>
                    </svg>
                  </button>
                  <button className="action-btn delete-user" onClick={() => confirmerSuppression(user)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3,6 5,6 21,6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                    Supprimer
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-results">
              <div className="no-results-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <h3>Aucun utilisateur trouvé</h3>
              <p>Aucun utilisateur ne correspond à votre recherche ou aucun utilisateur n'a été créé.</p>
              <button className="btn-add-user" onClick={() => setShowAddUserModal(true)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Ajouter un utilisateur
              </button>
            </div>
          )}
        </div>
      )}

      {showModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content-only" onClick={(e) => e.stopPropagation()}>
            <div className="user-contact-info">
              <div className="contact-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <span>{selectedUser.email}</span>
              </div>
              <div className="contact-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span>Créé le {selectedUser.dateCreation}</span>
              </div>
            </div>
            <div className="user-stats">
              <div className="stat-box">
                <div className="stat-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line>
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27,6.96 12,12.01 20.73,6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                  </svg>
                </div>
                <div className="stat-info">
                  <h4>Articles en stock</h4>
                  <p>{selectedUser.stockItems.reduce((total, item) => total + item.quantite, 0)}</p>
                </div>
              </div>
              <div className="stat-box">
                <div className="stat-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                </div>
                <div className="stat-info">
                  <h4>Articles critiques</h4>
                  <p>{selectedUser.stockItems.filter((item) => item.quantite < item.seuil).length}</p>
                </div>
              </div>
              <div className="stat-box">
                <div className="stat-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="20" x2="12" y2="10"></line>
                    <line x1="18" y1="20" x2="18" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="16"></line>
                  </svg>
                </div>
                <div className="stat-info">
                  <h4>Valeur totale</h4>
                  <p>
                    {selectedUser.stockItems
                      .reduce((total, item) => total + item.quantite * item.cmup, 0)
                      .toLocaleString()}{" "}
                    Ar
                  </p>
                </div>
              </div>
            </div>
            <div className="stock-details">
              <h3>Détails du stock</h3>
              <div className="stock-tabs">
                <button
                  className={`tab-button ${activeTab === "Consommables" ? "active" : ""}`}
                  onClick={() => setActiveTab("Consommables")}
                >
                  Consommables
                </button>
                <button
                  className={`tab-button ${activeTab === "Immobiliers" ? "active" : ""}`}
                  onClick={() => setActiveTab("Immobiliers")}
                >
                  Immobiliers
                </button>
              </div>
              <div className="table-container">
                {activeTab === "Consommables" && (
                  <table className="stock-table">
                    <thead>
                      <tr>
                        <th>Désignation</th>
                        <th>Quantité</th>
                        <th>CMUP</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedUser.stockItems.length > 0 ? (
                        selectedUser.stockItems.map((item) => (
                          <tr key={item.id} className={item.quantite < item.seuil ? "critical-row" : ""}>
                            <td>{item.designation}</td>
                            <td>{item.quantite}</td>
                            <td>{item.cmup.toLocaleString()} Ar</td>
                            <td>
                              <span className={`status-badge ${item.quantite < item.seuil ? "critical" : "normal"}`}>
                                {item.quantite < item.seuil ? "Critique" : "Normal"}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="no-data">
                            Aucun article en stock
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
                {activeTab === "Immobiliers" && (
                  <table className="stock-table">
                    <thead>
                      <tr>
                        <th>Désignation</th>
                        <th>Quantité</th>
                        <th>Quantité Consommée</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedUser.immobilierItems.length > 0 ? (
                        selectedUser.immobilierItems.map((item) => (
                          <tr key={item.id} className={item.quantite < item.seuil ? "critical-row" : ""}>
                            <td>{item.designation}</td>
                            <td>{item.quantite}</td>
                            <td>{item.quantiteConso}</td>
                            <td>
                              <span className={`status-badge ${item.quantite < item.seuil ? "critical" : "normal"}`}>
                                {item.quantite < item.seuil ? "Critique" : "Normal"}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="no-data">
                            Aucun bien immobilier en stock
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            <div className="user-actions-footer">
              <button className="action-btn send-stock" onClick={openDispatcheModal}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
                </svg>
                Envoyer du stock
              </button>
             
              <button className="action-btn delete-user" onClick={() => confirmerSuppression(selectedUser)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3,6 5,6 21,6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
                Supprimer l'utilisateur
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GestionUtilisateurs
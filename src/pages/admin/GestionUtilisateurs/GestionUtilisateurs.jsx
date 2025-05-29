import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  ArrowRight,
  AlertTriangle,
  Package,
  BarChart,
  Plus,
  User,
  Building,
  Mail,
  Phone,
  Send,
  Edit,
  MessageSquare,
  Trash2,
  Lock,
} from "lucide-react";
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
  createAgenceFourniture,
  checkEmail,
  getAgenceFournitures, // Ajout
} from "../../../services/userServices";
import { afficherMessage } from "../../../components/utils";
import "./css/gestion.css";
import axios from "axios";

function GestionUtilisateurs() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("Tous les types");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDispatcheModal, setShowDispatcheModal] = useState(false);
  const [nouvelleAgence, setNouvelleAgence] = useState("");
  const [numeroAgence, setNumeroAgence] = useState("");
  const [nouveauNom, setNouveauNom] = useState("");
  const [nouveauPrenom, setNouveauPrenom] = useState("");
  const [nouveauEmail, setNouveauEmail] = useState("");
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState("");
  const [messageContact, setMessageContact] = useState("");
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const API_URL = "http://localhost:5000/api"; // Ajoutez si nécessaire

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await getUsers();
      const data = response.data;

      const usersWithDetails = await Promise.all(
        data.map(async (user) => {
          const agenceResponse = await getUserAgence(user.id).catch(() => ({
            data: { nom: "N/A" },
          }));
          const fournituresResponse = await getUserFournitures(user.id).catch(() => ({
            data: [],
          }));
          let stockItems = fournituresResponse.data;

          if (stockItems && stockItems.$values && Array.isArray(stockItems.$values)) {
            stockItems = stockItems.$values;
          } else if (!Array.isArray(stockItems)) {
            console.warn(`stockItems non valide pour user ${user.id} :`, stockItems);
            stockItems = [];
          }

          const agence = agenceResponse.data;

          return {
            id: user.id,
            nom: `${user.nom} ${user.prenom}`,
            role: user.fonction,
            agence: agence.nom,
            email: user.email,
            telephone: "+261 34 00 000 00",
            dateCreation: new Date().toLocaleDateString(),
            stockCritique:
              Array.isArray(stockItems) && stockItems.length > 0
                ? stockItems.some((item) => item.quantiteRestante < item.seuilCritique)
                : false,
            stockLevel:
              Array.isArray(stockItems) && stockItems.length > 0
                ? Math.min(
                    100,
                    stockItems.reduce((sum, item) => sum + item.quantiteRestante, 0) / stockItems.length
                  )
                : 0,
            stockItems: Array.isArray(stockItems)
              ? stockItems.map((item) => ({
                  id: item.id,
                  designation: item.nom,
                  quantite: item.quantiteRestante,
                  seuil: item.seuilCritique || 10,
                  cmup: item.cmup || 0,
                }))
              : [],
          };
        })
      );
      setUsers(usersWithDetails);
    } catch (err) {
      console.error("Erreur fetchUsers :", err);
      afficherMessage(err.message || "Erreur lors du chargement des utilisateurs", "erreur");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Add user
 const ajouterUtilisateur = async () => {
  if (!nouveauNom || !nouveauPrenom || !nouvelleAgence || !numeroAgence || !nouveauEmail || !nouveauMotDePasse) {
    afficherMessage("Veuillez remplir tous les champs obligatoires", "erreur");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(nouveauEmail)) {
    afficherMessage("Veuillez entrer un email valide", "erreur");
    return;
  }

  try {
    // Vérifier si l'email existe déjà
    const emailCheckResponse = await checkEmail(nouveauEmail);
    if (emailCheckResponse.data.exists) {
      afficherMessage("Un utilisateur avec cet email existe déjà.", "erreur");
      return;
    }

    // Step 1: Find or create agency
    let agence;
    const agenceResponse = await getAgences();
    const agences = Array.isArray(agenceResponse.data.$values)
      ? agenceResponse.data.$values
      : agenceResponse.data;

    agence = agences.find(
      (a) => a.nom.toLowerCase() === nouvelleAgence.toLowerCase() || a.numero === numeroAgence
    );

    if (!agence) {
      const newAgenceResponse = await createAgence({
        nom: nouvelleAgence,
        numero: numeroAgence,
      });
      agence = newAgenceResponse.data;
    }

    // Step 2: Create user
    const userResponse = await createUser({
      nom: nouveauNom,
      prenom: nouveauPrenom,
      email: nouveauEmail,
      motDePasse: nouveauMotDePasse,
      fonction: "Utilisateur",
      dateAssociation : new Date()
    });
    const user = userResponse.data;

    // Step 3: Associate user with agency
    await createUserAgence({
      userId: user.id,
      agenceId: agence.id,
      dateAssociation : new Date()
    });

    // Step 4 supprimé : Pas d'association de fourniture par défaut

    // Step 5: Fetch updated user details
    const newUserResponse = await getUserById(user.id);
    const newUserData = newUserResponse.data;
    const agenceDetails = await getUserAgence(user.id).catch(() => ({
      data: { nom: agence.nom },
    }));
    const fournituresResponse = await getUserFournitures(user.id).catch(() => ({
      data: [],
    }));
    let stockItems = fournituresResponse.data;
    console.log(fournituresResponse.data)
    if (stockItems && stockItems.$values && Array.isArray(stockItems.$values)) {
      stockItems = stockItems.$values;
    } else if (!Array.isArray(stockItems)) {
      stockItems = [];
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
        quantite: item.quantiteRestante,
        seuil: item.seuilCritique || 10,
        cmup: item.cmup || 0,
      })),
    };

    setUsers([...users, newUser]);
    setNouveauNom("");
    setNouveauPrenom("");
    setNouvelleAgence("");
    setNumeroAgence("");
    setNouveauEmail("");
    setNouveauMotDePasse("");
    setShowAddUserModal(false);
    afficherMessage(`Utilisateur ${newUser.nom} ajouté avec succès !`, "succes");
    await fetchUsers();
  } catch (err) {
    console.error("Erreur lors de la création de l'utilisateur :", err);
    const errorMessage =
      err.response?.data?.message ||
      err.message ||
      "Erreur lors de la création de l'utilisateur";
    afficherMessage(errorMessage, "erreur");
  }
};
  // Edit user
  const modifierUtilisateur = async () => {
  if (!nouveauNom || !nouveauPrenom || !nouvelleAgence || !numeroAgence || !nouveauEmail) {
    afficherMessage("Veuillez remplir tous les champs obligatoires", "erreur");
    return;
  }

  // Valider l'email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(nouveauEmail)) {
    afficherMessage("Veuillez entrer un email valide", "erreur");
    return;
  }

  try {
    // Step 1: Find or create agency
    let agence;
    const agenceResponse = await getAgences();
    const agences = Array.isArray(agenceResponse.data.$values)
      ? agenceResponse.data.$values
      : agenceResponse.data;

    agence = agences.find(
      (a) => a.nom.toLowerCase() === nouvelleAgence.toLowerCase() || a.numero === numeroAgence
    );

    if (!agence) {
      const newAgenceResponse = await createAgence({
        nom: nouvelleAgence,
        numero: numeroAgence,
      });
      agence = newAgenceResponse.data;
    } else {
      await updateAgence(agence.id, {
        nom: nouvelleAgence,
        numero: numeroAgence,
      });
    }

    // Step 2: Update user
    const userData = {
      id: selectedUser.id,
      nom: nouveauNom,
      prenom: nouveauPrenom,
      email: nouveauEmail,
      fonction: "Utilisateur",
    };
    if (nouveauMotDePasse) {
      userData.motDePasse = nouveauMotDePasse;
    }

    await updateUser(selectedUser.id, userData);

    // Step 3: Check and update/create user-agency association
    const userAgenceResponse = await getUserAgenceByUserId(selectedUser.id).catch(() => ({ data: null }));
    if (userAgenceResponse.data) {
      await updateUserAgence(selectedUser.id, {
        userId: selectedUser.id,
        agenceId: agence.id,
      });
    } else {
      await createUserAgence({
        userId: selectedUser.id,
        agenceId: agence.id,
      });
    }

    // Step 4: Update local state
    const usersModifies = users.map((user) =>
      user.id === selectedUser.id
        ? {
            ...user,
            nom: `${nouveauNom} ${nouveauPrenom}`,
            email: nouveauEmail,
            agence: nouvelleAgence,
            role: "Utilisateur",
          }
        : user
    );
    setUsers(usersModifies);
    setSelectedUser({
      ...selectedUser,
      nom: `${nouveauNom} ${nouveauPrenom}`,
      email: nouveauEmail,
      agence: nouvelleAgence,
      role: "Utilisateur",
    });
    setShowEditModal(false);
    afficherMessage(`Utilisateur ${nouveauNom} ${nouveauPrenom} modifié avec succès !`, "succes");
    await fetchUsers();
  } catch (err) {
    console.error("Erreur lors de la modification de l'utilisateur :", err);
    const errorMessage =
      err.response?.data?.message ||
      err.message ||
      "Erreur lors de la modification de l'utilisateur";
    afficherMessage(errorMessage, "erreur");
  }
};
  // Delete user
  const supprimerUtilisateur = async (userId) => {
    try {
      await deleteUser(userId);
      setUsers(users.filter((user) => user.id !== userId));
      setShowModal(false);
      afficherMessage("Utilisateur supprimé avec succès !", "succes");
    } catch (err) {
      console.error("Erreur lors de la suppression de l'utilisateur :", err);
      afficherMessage(
        err.response?.data?.message || err.message || "Erreur lors de la suppression de l'utilisateur",
        "erreur"
      );
    }
  };

  // Send message
  const envoyerMessage = () => {
    if (!messageContact.trim()) {
      afficherMessage("Veuillez saisir un message", "erreur");
      return;
    }

    console.log(`Message envoyé à ${selectedUser.nom}: ${messageContact}`);
    setMessageContact("");
    setShowContactModal(false);
    afficherMessage(`Message envoyé à ${selectedUser.nom}`, "succes");
  };

  // Redirect to dispatch page
  const envoyerStock = (type) => {
    setShowDispatcheModal(false);
    if (type === "consommables") {
      navigate("/admin/consommables/dispatche");
    } else {
      navigate("/admin/immobiliers/dispatche");
    }
  };

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.agence.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterType === "Tous les types" || user.role === filterType;

    return matchesSearch && matchesFilter;
  });

// Fonction corrigée pour openUserDetails
const openUserDetails = async (user) => {
  try {
    const userResponse = await getUserById(user.id);
    const userData = userResponse.data;
    const agenceResponse = await getUserAgence(user.id).catch(() => ({
      data: { nom: "N/A", id: null },
    }));

    // Utiliser getUserFournitures au lieu de getAgenceFournitures
    const fournituresResponse = await getUserFournitures(user.id).catch(() => ({
      data: [],
    }));
    
    let stockItems = fournituresResponse.data;
    console.log("Données fournitures reçues:", stockItems);

    // La réponse semble être un tableau direct, pas besoin de vérifier $values
    if (!Array.isArray(stockItems)) {
      console.warn(`stockItems non valide pour user ${user.id} :`, stockItems);
      stockItems = [];
    }

    const updatedUser = {
      id: userData.id,
      nom: `${userData.nom} ${userData.prenom}`,
      role: userData.fonction,
      agence: agenceResponse.data.nom,
      email: userData.email,
      telephone: "+261 34 00 000 00",
      dateCreation: new Date().toLocaleDateString(),
      stockCritique:
        stockItems.length > 0
          ? stockItems.some((item) => item.quantiteRestante < (item.seuilCritique || 10))
          : false,
      stockLevel:
        stockItems.length > 0
          ? Math.min(
              100,
              stockItems.reduce((sum, item) => sum + item.quantiteRestante, 0) / stockItems.length
            )
          : 0,
      stockItems: stockItems.map((item) => ({
        id: item.id,
        designation: item.nom,
        quantite: item.quantiteRestante,
        seuil: item.seuilCritique || 10,
        cmup: item.cmup || item.prixUnitaire || 0, // Utiliser cmup ou prixUnitaire comme fallback
      })),
    };

    setSelectedUser(updatedUser);
    setShowModal(true);
  } catch (err) {
    console.error("Erreur lors du chargement des détails de l'utilisateur :", err);
    afficherMessage("Erreur lors du chargement des détails", "erreur");
  }
};
  // Open contact modal
  const openContactModal = () => {
    setMessageContact("");
    setShowContactModal(true);
    setShowModal(false);
  };

  // Open edit modal
  const openEditModal = () => {
    setNouveauNom(selectedUser.nom.split(" ")[0]);
    setNouveauPrenom(selectedUser.nom.split(" ").slice(1).join(" "));
    setNouveauEmail(selectedUser.email);
    setNouvelleAgence(selectedUser.agence);
    setNumeroAgence("");
    setNouveauMotDePasse("");
    setShowEditModal(true);
    setShowModal(false);
  };

  // Open dispatch modal
  const openDispatcheModal = () => {
    setShowDispatcheModal(true);
    setShowModal(false);
  };

  // Get initials for avatar
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="gestion-utilisateurs-container">
      <h1 className="page-title">Gestion des Utilisateurs</h1>

      <div className="search-filter-container">
        <div className="search-box">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-box">
          <Filter className="filter-icon" size={18} />
          <label>Type:</label>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option>Tous les types</option>
            <option>Utilisateur</option>
            <option>admin</option>
          </select>
        </div>

        <button className="btn-add-user" onClick={() => setShowAddUserModal(true)}>
          <Plus size={16} /> Ajouter un utilisateur
        </button>
      </div>

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
                  <User size={16} /> Nom*
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
                  <User size={16} /> Prénom*
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
                  <Mail size={16} /> Email*
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
                  <Lock size={16} /> Mot de passe*
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
                  <Building size={16} /> Nom de l'Agence*
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
                  <Building size={16} /> Numéro d'Agence*
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
                  <Mail size={16} />
                  <span>{selectedUser.email}</span>
                </div>
                <div className="contact-item">
                  <Phone size={16} />
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
                <button
                  className="bouton-sauvegarder"
                  onClick={envoyerMessage}
                  disabled={!messageContact.trim()}
                >
                  <MessageSquare size={16} /> Envoyer
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
                  <User size={16} /> Nom
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
                  <User size={16} /> Prénom
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
                  <Mail size={16} /> Email
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
                  <Lock size={16} /> Mot de passe (laisser vide pour ne pas modifier)
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
                  <Building size={16} /> Nom de l'Agence
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
                  <Building size={16} /> Numéro d'Agence
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
              <div className="actions-modal-actions">
                <button className="bouton-annuler" onClick={() => setShowEditModal(false)}>
                  Annuler
                </button>
                <button className="bouton-sauvegarder" onClick={modifierUtilisateur}>
                  <Edit size={16} /> Enregistrer
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
                <Package size={48} />
                <h3>Consommables</h3>
                <p>Envoyer des articles consommables</p>
              </div>
              <div className="dispatche-option" onClick={() => envoyerStock("immobiliers")}>
                <Building size={48} />
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
                      <AlertTriangle size={16} /> Stock critique
                    </button>
                  )}
                </div>

                <div className="user-details">
                  <div className="detail-item">
                    <Mail size={16} />
                    <span>{user.email}</span>
                  </div>
                  <div className="detail-item">
                    <Phone size={16} />
                    <span>{user.telephone}</span>
                  </div>
                </div>

                <div className="stock-progress-container">
                  <div className="stock-label">
                    <span>Niveau de stock</span>
                    <span>{user.stockLevel}%</span>
                  </div>
                  <div className="stock-progress-bar">
                    <div
                      className={`stock-progress ${
                        user.stockLevel < 30 ? "low" : user.stockLevel < 70 ? "medium" : "high"
                      }`}
                      style={{ width: `${user.stockLevel}%` }}
                    ></div>
                  </div>
                </div>

                <div className="user-actions">
                  <button className="view-details-btn" onClick={() => openUserDetails(user)}>
                    Voir détails <ArrowRight size={16} />
                  </button>
                  <button className="action-btn delete-user" onClick={() => supprimerUtilisateur(user.id)}>
                    <Trash2 size={16} /> Supprimer
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-results">
              <div className="no-results-icon">
                <User size={48} />
              </div>
              <h3>Aucun utilisateur trouvé</h3>
              <p>Aucun utilisateur ne correspond à votre recherche ou aucun utilisateur n'a été créé.</p>
              <button className="btn-add-user" onClick={() => setShowAddUserModal(true)}>
                <Plus size={16} /> Ajouter un utilisateur
              </button>
            </div>
          )}
        </div>
      )}

      {showModal && selectedUser && (
        <div className="modal-overlay">
          <div className="user-details-modal">
            <div className="modal-header">
              <div className="user-modal-info">
                <div className="modal-avatar">{getInitials(selectedUser.nom)}</div>
                <div>
                  <h2>{selectedUser.nom}</h2>
                  <p>
                    {selectedUser.role} - {selectedUser.agence}
                  </p>
                </div>
              </div>
              <button className="close-modal-btn" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <div className="modal-content">
              <div className="user-contact-info">
                <div className="contact-item">
                  <Mail size={18} />
                  <span>{selectedUser.email}</span>
                </div>
                <div className="contact-item">
                  <Phone size={18} />
                  <span>{selectedUser.telephone}</span>
                </div>
                <div className="contact-item">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span>Créé le ${selectedUser.email}</span>
                </div>
              </div>

              <div className="user-stats">
                <div className="stat-box">
                  <div className="stat-icon">
                    <Package size={24} />
                  </div>
                  <div className="stat-info">
                    <h4>Articles en stock</h4>
                    <p>{selectedUser.stockItems.reduce((total, item) => total + item.quantite, 0)}</p>
                  </div>
                </div>

                <div className="stat-box">
                  <div className="stat-icon">
                    <AlertTriangle size={24} />
                  </div>
                  <div className="stat-info">
                    <h4>Articles critiques</h4>
                    <p>{selectedUser.stockItems.filter((item) => item.quantite < item.seuil).length}</p>
                  </div>
                </div>

                <div className="stat-box">
                  <div className="stat-icon">
                    <BarChart size={24} />
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
                  <button className="tab-button active">Consommables</button>
                  <button className="tab-button">Immobiliers</button>
                </div>
                <table className="stock-table">
                  <thead>
                    <tr>
                      <th>Désignation</th>
                      <th>Quantité</th>
                      <th>Seuil critique</th>
                      <th>CMUP</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedUser.stockItems.length > 0 ? (
                      selectedUser.stockItems.map((item) => (
                        <tr key="item.id" className={item.quantite < item.seuil ? "critical-row" : ""}>
                          <td>{item.designation}</td>
                          <td>{item.quantite}</td>
                          <td>{item.seuil}</td>
                          <td>{item.cmup.toLocaleString()} Ar</td>
                          <td>
                            <span
                              className={`status-badge ${item.quantite < item.seuil ? "critical" : "normal"}`}
                            >
                              {item.quantite < item.seuil ? "Critique" : "Normal"}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="no-data">
                          Aucun article en stock
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

                           <div className="user-actions-footer">
                  <button className="action-btn" onClick={openDispatcheModal}>
                    <Send size={16} /> Envoyer du stock
                  </button>
                  <button className="action-btn" onClick={openContactModal}>
                    <MessageSquare size={16} /> Contacter l'utilisateur
                  </button>
                  <button className="action-btn" onClick={openEditModal}>
                    <Edit size={16} /> Modifier l'utilisateur
                  </button>
                  <button
                    className="action-btn delete-user"
                    onClick={() => supprimerUtilisateur(selectedUser.id)}
                  >
                    <Trash2 size={16} /> Supprimer l'utilisateur
                  </button>
                </div>
              </div>
            </div>
          </div>
      )}
    </div>
  );
}

export default GestionUtilisateurs;
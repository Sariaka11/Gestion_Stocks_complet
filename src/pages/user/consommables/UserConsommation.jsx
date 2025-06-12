import { useState, useEffect } from "react";
import { useAuth } from "../../../Context/AuthContext";
import { getAgenceFournitures, createConsommation, addConsommation } from "../../../services/agenceFournituresServices";
import "./css/Consommation.css";

function UserConsommation() {
  const { userAgenceId } = useAuth();
  const [consommations, setConsommations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    fournitureId: "",
    consoMm: ""
  });
  const [fournitures, setFournitures] = useState([]);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedFourniture, setSelectedFourniture] = useState(null);
  const [detailedConsommations, setDetailedConsommations] = useState([]);

  // Charger les données
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!userAgenceId) {
          setError("Aucune agence connectée.");
          setLoading(false);
          return;
        }

        // Charger les fournitures (remplacez par votre endpoint réel)
        const fournituresResponse = await fetchFournitures();
        setFournitures(fournituresResponse || [
          { id: 1, nom: "Papier A4", categorie: "Papeterie" },
          { id: 2, nom: "Stylos", categorie: "Écriture" }
        ]);

        // Charger les consommations
        const response = await getAgenceFournitures(userAgenceId);
        const rawData = Array.isArray(response.data) ? response.data : response.data?.["$values"] || [];
        
        // Regrouper par fournitureNom
        const groupedData = rawData.reduce((acc, item) => {
          const key = item.fournitureNom;
          if (!acc[key]) {
            acc[key] = {
              id: item.id,
              fournitureId: item.fournitureId,
              fournitureNom: item.fournitureNom || "Inconnu",
              quantite: item.quantite,
              consoMm: item.consoMm || 0,
              categorie: item.categorie || "Non catégorisé",
              details: []
            };
          }
          acc[key].details.push({
            consoMm: item.consoMm || 0,
            date: item.dateAssociation
          });
          return acc;
        }, {});

        setConsommations(Object.values(groupedData));
      } catch (error) {
        setError("Erreur lors du chargement des données.");
        console.error("Erreur:", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userAgenceId]);

  // Fonction pour récupérer les fournitures
  const fetchFournitures = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/Fournitures");
      const data = await response.json();
      return Array.isArray(data) ? data : data["$values"] || [];
    } catch (error) {
      console.error("Erreur lors de la récupération des fournitures:", error);
      return [];
    }
  };

  // Gérer les changements dans le formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Soumettre une nouvelle consommation
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await createConsommation({
        agenceId: userAgenceId,
        fournitureId: parseInt(formData.fournitureId),
        consoMm: parseFloat(formData.consoMm)
      });
      setConsommations((prev) => {
        const existing = prev.find(c => c.fournitureNom === response.data.fournitureNom);
        if (existing) {
          existing.quantite = response.data.quantite;
          existing.consoMm = response.data.consoMm;
          existing.details.push({ consoMm: response.data.consoMm, date: response.data.dateAssociation });
          return [...prev];
        }
        return [...prev, {
          id: response.data.id,
          fournitureId: response.data.fournitureId,
          fournitureNom: response.data.fournitureNom || "Inconnu",
          quantite: response.data.quantite,
          consoMm: response.data.consoMm,
          categorie: response.data.categorie,
          details: [{ consoMm: response.data.consoMm, date: response.data.dateAssociation }]
        }];
      });
      setFormData({ fournitureId: "", consoMm: "" });
      setShowForm(false);
      setError(null);
    } catch (error) {
      setError("Erreur lors de la création de la consommation.");
      console.error("Erreur:", error.message);
    }
  };

  // Ajouter une consommation à une fourniture existante
  const handleAddConsommation = async (fournitureId, fournitureNom) => {
    try {
      const consoMm = prompt("Entrez la consommation (en mm) :");
      if (!consoMm || parseFloat(consoMm) <= 0) {
        alert("Veuillez entrer une consommation valide.");
        return;
      }

      const response = await addConsommation({
        agenceId: userAgenceId,
        fournitureId,
        consoMm: parseFloat(consoMm)
      });
      setConsommations((prev) => {
        const existing = prev.find(c => c.fournitureNom === response.data.fournitureNom);
        if (existing) {
          existing.quantite = response.data.quantite;
          existing.consoMm = response.data.consoMm;
          existing.details.push({ consoMm: response.data.consoMm, date: response.data.dateAssociation });
        }
        return [...prev];
      });
    } catch (error) {
      setError("Erreur lors de l'ajout de la consommation.");
      console.error("Erreur:", error.message);
    }
  };

  // Afficher les détails
  const handleDetailsClick = (item) => {
    setSelectedFourniture(item);
    setDetailedConsommations(item.details);
    setDetailsVisible(true);
  };

  if (loading) {
    return <div className="consommation-container"><p>Chargement en cours...</p></div>;
  }

  if (error) {
    return <div className="consommation-container"><div className="error-message">{error}</div></div>;
  }

  return (
    <div className="consommation-container">
      <div className="consommation-header">
        <h2>Mes consommations</h2>
        <button className="btn-add" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Annuler" : "Nouvelle consommation"}
        </button>
      </div>

      {showForm && (
        <div className="consommation-form">
          <form onSubmit={handleSubmit}>
            <div>
              <label>Fourniture</label>
              <select
                name="fournitureId"
                value={formData.fournitureId}
                onChange={handleInputChange}
                required
              >
                <option value="">Sélectionner une fourniture</option>
                {fournitures.map((fourniture) => (
                  <option key={fourniture.id} value={fourniture.id}>
                    {fourniture.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Consommation (mm)</label>
              <input
                type="number"
                name="consoMm"
                value={formData.consoMm}
                onChange={handleInputChange}
                step="0.1"
                min="0"
                required
              />
            </div>
            <button type="submit" className="btn-submit">Ajouter</button>
            {error && <p className="error-message">{error}</p>}
          </form>
        </div>
      )}

      <div className="consommation-table-container">
        <table className="consommation-table">
          <thead>
            <tr>
              <th>Désignation</th>
              <th>Quantité</th>
              <th>Consommation</th>
              <th>Catégorie</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {consommations.map((item) => (
              <tr key={item.id}>
                <td>{item.fournitureNom}</td>
                <td>{item.quantite}</td>
                <td>{item.consoMm ?? "N/A"}</td>
                <td>{item.categorie}</td>
                <td className="actions-cell">
                  <button
                    className="btn-add-cons"
                    onClick={() => handleAddConsommation(item.fournitureId, item.fournitureNom)}
                  >
                    Ajouter
                  </button>
                  <button className="btn-details" onClick={() => handleDetailsClick(item)}>
                    Détails
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detailsVisible && selectedFourniture && (
        <div className="modal" onClick={() => setDetailsVisible(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Détails de {selectedFourniture.fournitureNom}</h3>
            <table className="details-table">
              <thead>
                <tr>
                  <th>Consommation (mm)</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {detailedConsommations.map((detail, index) => (
                  <tr key={index}>
                    <td>{detail.consoMm}</td>
                    <td>{new Date(detail.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="btn-close" onClick={() => setDetailsVisible(false)}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserConsommation;
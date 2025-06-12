import { useEffect, useState } from "react";
import { getAgenceFournitures } from "../../../services/fournituresServices"; // Ajustez le chemin
import { useAuth } from "../../../Context/AuthContext"; // Ajustez le chemin
import "./css/Stock.css";
import jsPDF from "jspdf";
import autoTable from"jspdf-autotable";

function UserStock() {
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailedItems, setDetailedItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Tous");

  const { userAgenceId } = useAuth();
  console.log("userAgenceId dans UserStock :", userAgenceId);

  useEffect(() => {
    const fetchStock = async () => {
      console.log("Début de fetchStock, userAgenceId :", userAgenceId);
      setLoading(true);
      setError(null); // Réinitialiser l'erreur à chaque appel
      try {
        if (!userAgenceId) {
          console.log("Aucune agence connectée, arrêt du fetch");
          setError("Aucune agence connectée. Veuillez vérifier les données dans localStorage.");
          setLoading(false);
          return;
        }
        const response = await getAgenceFournitures(userAgenceId); // Filtrer par agenceId
        const rawData = Array.isArray(response.data) ? response.data : response.data?.["$values"] || [];

        console.log("Données brutes récupérées de l'API :", rawData);

        // Regrouper par fournitureNom et sommer les quantités
        const groupedData = rawData.reduce((acc, item) => {
          const key = item.fournitureNom;
          if (!acc[key]) {
            acc[key] = {
              id: item.id,
              nom: key,
              quantite: 0,
              categorie: item.categorie || "Non catégorisé",
              disponible: false,
              details: [],
            };
          }
          acc[key].quantite += item.quantite;
          acc[key].disponible = acc[key].quantite > 0;
          acc[key].details.push({ quantite: item.quantite, date: item.dateAssociation });
          return acc;
        }, {});

        const mappedStock = Object.values(groupedData);

        console.log("Données mappées pour le stock :", mappedStock);

        setStockItems(mappedStock);
      } catch (err) {
        console.error("Erreur lors de la récupération des données :", err);
        setError("Erreur lors du chargement du stock. Veuillez réessayer.");
      } finally {
        setLoading(false);
      }
    };

    fetchStock();
  }, [userAgenceId]);

  const handleDetailsClick = (item) => {
    setSelectedItem(item);
    setDetailedItems(item.details);
    setDetailsVisible(true);
  };

  // Filtrer par catégorie
  const filteredStockItems = selectedCategory === "Tous"
    ? stockItems
    : stockItems.filter((item) => item.categorie === selectedCategory);

  // Exporter en PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    autoTable(doc,{
      head: [["ID", "Nom", "Quantité", "Catégorie", "Disponibilité"]],
      body: filteredStockItems.map((item) => [
        item.id,
        item.nom,
        item.quantite,
        item.categorie,
        item.disponible ? "Disponible" : "Indisponible",
      ]),
      styles: { fontSize: 10 },
      margin: { top: 20 },
    });
    doc.save("stock_report.pdf");
  };

  if (loading) {
    return (
      <div className="user-stock-container">
        <div className="loading-overlay">
          <p>Chargement en cours...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-stock-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  // Extraire les catégories uniques
  const categories = ["Tous", ...new Set(stockItems.map((item) => item.categorie))];

  return (
    <div className="user-stock-container">
      <div className="user-stock-header">
        <h2>Stock des consommables disponibles</h2>
       
        <div className="user-stock-actions">
          <div className="search-bar">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-filter"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <button className="btn-export" onClick={exportToPDF}>
              Exporter en PDF
            </button>
          </div>
        </div>
      </div>
      <div className="user-stock-table-container">
        <table className="user-stock-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Quantité</th>
              <th>Catégorie</th>
              <th>Disponibilité</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStockItems.map((item) => (
              <tr key={item.id}>
                <td>{item.nom}</td>
                <td>{item.quantite}</td>
                <td>{item.categorie}</td>
                <td>
                  <span className={`status-badge ${item.disponible ? "disponible" : "indisponible"}`}>
                    {item.disponible ? "Disponible" : "Indisponible"}
                  </span>
                </td>
                <td className="actions-cell">
                  <button className="btn-details" onClick={() => handleDetailsClick(item)}>
                    Détails
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detailsVisible && selectedItem && (
  <div
    className="modal"
    onClick={() => setDetailsVisible(false)} // Ferme quand on clique sur le fond
  >
    <div
      className="modal-content"
      onClick={(e) => e.stopPropagation()} // Empêche la fermeture quand on clique sur le contenu
    >
      <h3>Détails de {selectedItem.nom}</h3>
      <table className="details-table">
        <thead>
          <tr>
            <th>Quantité</th>
            <th>Date d'association</th>
          </tr>
        </thead>
        <tbody>
          {detailedItems.map((detail, index) => (
            <tr key={index}>
              <td>{detail.quantite}</td>
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

export default UserStock;
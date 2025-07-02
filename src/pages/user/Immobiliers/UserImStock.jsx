
import { useState, useEffect } from "react";
import { getBienByAgence } from "../../../services/bienAgenceServices"; // Ajustez le chemin
import { useAuth } from "../../../Context/AuthContext"; // Ajustez le chemin
import jsPDF from "jspdf";
import "jspdf-autotable";
import "./css/Stock.css";

function UserStock() {
  const [stockItems, setStockItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Toutes");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchStock = async () => {
      try {
        setLoading(true);
        const data = await getBienByAgence(user.agenceId);
        console.log("Données mappées pour le stock :", data);
        setStockItems(data);
        setFilteredItems(data);
        const uniqueCategories = ["Toutes", ...new Set(data.map(item => item.categorie))];
        setCategories(uniqueCategories);
      } catch (err) {
        console.error("Erreur dans fetchStock :", err);
        setError("Erreur lors de la récupération des données.");
      } finally {
        setLoading(false);
      }
    };

    if (user?.agenceId) {
      fetchStock();
    }
  }, [user]);

  useEffect(() => {
    if (selectedCategory === "Toutes") {
      setFilteredItems(stockItems);
    } else {
      setFilteredItems(stockItems.filter(item => item.categorie === selectedCategory));
    }
  }, [selectedCategory, stockItems]);

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Rapport des Biens par Agence", 20, 10);
    doc.autoTable({
      head: [["Nom du Bien", "Agence", "Catégorie", "Quantité", "Quantité Consommée", "Fonction", "Date d'Affectation"]],
      body: filteredItems.map(item => [
        item.nomBien,
        item.nomAgence,
        item.categorie,
        item.quantite,
        item.quantiteConso || 0,
        item.fonction,
        new Date(item.dateAffectation).toLocaleDateString(),
      ]),
    });
    doc.save("stock_biens_report.pdf");
  };

  const openDetails = (item) => {
    setSelectedItem(item);
  };

  const closeDetails = () => {
    setSelectedItem(null);
  };

  if (loading) return <div className="loading-overlay">Chargement...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="user-imstock-container">
      <div className="user-imstock-header">
        <h2>Stock des Biens</h2>
        <div className="user-imstock-actions">
          <div className="search-bar">
            <div className="category-filter">
              <select
                className="category-select"
                value={selectedCategory}
                onChange={handleCategoryChange}
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button className="btn-export" onClick={exportToPDF}>
            Exporter en PDF
          </button>
        </div>
      </div>
      <div className="user-imstock-table-container">
        <table className="user-imstock-table">
          <thead>
            <tr>
              <th>Nom du Bien</th>
              <th>Agence</th>
              <th>Catégorie</th>
              <th>Quantité</th>
              <th>Quantité Consommée</th>
              <th>Fonction</th>
              <th>Date d'Affectation</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(item => (
              <tr key={`${item.idBien}-${item.idAgence}`}>
                <td>{item.nomBien}</td>
                <td>{item.nomAgence}</td>
                <td>{item.categorie}</td>
                <td>{item.quantite}</td>
                <td>{item.quantiteConso || 0}</td>
                <td>{item.fonction}</td>
                <td>{new Date(item.dateAffectation).toLocaleDateString()}</td>
                <td className="actions-cell">
                  <button className="btn-details" onClick={() => openDetails(item)}>
                    Détails
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedItem && (
        <div className="modal">
          <div className="modal-content">
            <h3>Détails du Bien</h3>
            <table className="details-table">
              <tbody>
                <tr>
                  <th>Nom du Bien</th>
                  <td>{selectedItem.nomBien}</td>
                </tr>
                <tr>
                  <th>Agence</th>
                  <td>{selectedItem.nomAgence}</td>
                </tr>
                <tr>
                  <th>Catégorie</th>
                  <td>{selectedItem.categorie}</td>
                </tr>
                <tr>
                  <th>Quantité</th>
                  <td>{selectedItem.quantite}</td>
                </tr>
                <tr>
                  <th>Quantité Consommée</th>
                  <td>{selectedItem.quantiteConso || 0}</td>
                </tr>
                <tr>
                  <th>Fonction</th>
                  <td>{selectedItem.fonction}</td>
                </tr>
                <tr>
                  <th>Date d'Affectation</th>
                  <td>{new Date(selectedItem.dateAffectation).toLocaleDateString()}</td>
                </tr>
              </tbody>
            </table>
            <button className="btn-close" onClick={closeDetails}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserStock;

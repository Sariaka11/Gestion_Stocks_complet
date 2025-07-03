import { useState, useEffect } from "react";
import { getBienByAgence } from "../../../services/bienAgenceServices"; 
import { useAuth } from "../../../Context/AuthContext"; 
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
        const response = await getBienByAgence(user.agenceId);
        console.log("Données mappées pour le stock :", response);
        const stockData = response.data;
        if (!Array.isArray(stockData)) {
          throw new Error("Les données reçues ne sont pas un tableau.");
        }
        // Filtrer les doublons
        const uniqueStockData = stockData.filter(
          (item, index, self) =>
            index ===
            self.findIndex(
              (t) => t.idBien === item.idBien && t.idAgence === item.idAgence
            )
        );
        console.log("Structure des données :", uniqueStockData);
        setStockItems(uniqueStockData);
        setFilteredItems(uniqueStockData);
        const uniqueCategories = ["Toutes", ...new Set(uniqueStockData.map(item => item.categorie))];
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
    // Ajouter un titre avec style
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`Rapport des Biens par Agence${selectedCategory !== "Toutes" ? ` - ${selectedCategory}` : ""}`, 14, 20);

    // Configurer le tableau avec des styles similaires à l'interface
    autoTable(doc, {
      head: [["Nom du Bien", "Catégorie", "Quantité", "Quantité Consommée", "Fonction", "Date d'Affectation"]],
      body: filteredItems.map(item => [
        item.nomBien || "N/A",
        item.categorie || "N/A",
        item.quantite || 0,
        item.quantiteConso || 0,
        item.fonction || "N/A",
        new Date(item.dateAffectation).toLocaleDateString("fr-FR") || "N/A",
      ]),
      startY: 30,
      styles: {
        fontSize: 10,
        cellPadding: 3,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [41, 128, 185], // Couleur de fond pour l'en-tête (bleu)
        textColor: [255, 255, 255], // Texte blanc pour l'en-tête
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240], // Couleur de fond alternée pour les lignes
      },
      columnStyles: {
        0: { cellWidth: 40 }, // Nom du Bien
        1: { cellWidth: 30 }, // Catégorie
        2: { cellWidth: 20 }, // Quantité
        3: { cellWidth: 30 }, // Quantité Consommée
        4: { cellWidth: 30 }, // Fonction
        5: { cellWidth: 30 }, // Date d'Affectation
      },
    });

    // Nom du fichier dynamique avec la date et la catégorie
    const date = new Date().toISOString().slice(0, 10);
    const fileName = `stock_biens_report_${date}${selectedCategory !== "Toutes" ? `_${selectedCategory}` : ""}.pdf`;
    doc.save(fileName);
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
              <th>Catégorie</th>
              <th>Quantité</th>
              <th>Quantité Consommée</th>
              <th>Fonction</th>
              <th>Date d'Affectation</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item, index) => (
              <tr key={`${item.idBien}-${item.idAgence}-${index}`}>
                <td>{item.nomBien}</td>
                <td>{item.categorie}</td>
                <td>{item.quantite}</td>
                <td>{item.quantiteConso || 0}</td>
                <td>{item.fonction || "N/A"}</td>
                <td>{new Date(item.dateAffectation).toLocaleDateString("fr-FR")}</td>
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
                  <td>{selectedItem.fonction || "N/A"}</td>
                </tr>
                <tr>
                  <th>Date d'Affectation</th>
                  <td>{new Date(selectedItem.dateAffectation).toLocaleDateString("fr-FR")}</td>
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
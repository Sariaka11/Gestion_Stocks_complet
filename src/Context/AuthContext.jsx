// AuthContext.js
import { createContext, useContext, useState, useEffect } from "react";
import { getAgenceIdByUserId } from "../services/userServices"; // Ajustez le chemin si nécessaire

// Créer le contexte
const AuthContext = createContext();

// Fournisseur du contexte
export const AuthProvider = ({ children }) => {
  const [userAgenceId, setUserAgenceId] = useState(null);

  useEffect(() => {
    const user = localStorage.getItem("user");
    console.log("Données brutes du localStorage :", user);

    const fetchAgenceId = async () => {
      if (user) {
        try {
          const userData = JSON.parse(user);
          console.log("Données parsées du localStorage :", userData);

          const userId = userData.id; // Utiliser l'id de l'utilisateur comme UserId
          console.log("UserId extrait :", userId);

          if (userId) {
            const agenceResponse = await getAgenceIdByUserId(userId); // Appel API
            console.log("Réponse de getAgenceIdByUserId :", agenceResponse); // Correction du nom
            const agenceId = agenceResponse?.data?.agenceId || null; // Accéder à data pour Axios
            console.log("userAgenceId extrait :", agenceId);
            setUserAgenceId(agenceId);
          } else {
            console.log("Aucun UserId trouvé dans les données du localStorage");
            setUserAgenceId(null);
          }
        } catch (error) {
          console.error("Erreur lors du parsing ou de la récupération de l'agence :", error);
          setUserAgenceId(null);
        }
      } else {
        console.log("Aucune donnée trouvée dans localStorage pour user");
        setUserAgenceId(null);
      }
    };

    fetchAgenceId();
  }, []);

  return (
    <AuthContext.Provider value={{ userAgenceId }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return context;
};

export default AuthContext;
import { createContext, useContext, useState, useEffect } from "react";
import { getAgenceIdByUserId } from "../services/userServices";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userAgenceId, setUserAgenceId] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    console.log("Données brutes du localStorage :", storedUser);

    const fetchAgenceId = async () => {
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          console.log("Données parsées du localStorage :", userData);
          setUser(userData);

          const userId = userData.id;
          console.log("UserId extrait :", userId);

          if (userId) {
            const agenceResponse = await getAgenceIdByUserId(userId);
            console.log("Réponse de getAgenceIdByUserId :", agenceResponse);
            const agenceId = agenceResponse?.data?.agenceId || null;
            console.log("userAgenceId extrait :", agenceId);
            setUserAgenceId(agenceId);
          } else {
            console.log("Aucun UserId trouvé dans les données du localStorage");
            setUserAgenceId(null);
          }
        } catch (error) {
          console.error("Erreur lors du parsing ou de la récupération de l'agence :", error);
          setUser(null);
          setUserAgenceId(null);
        }
      } else {
        console.log("Aucune donnée trouvée dans localStorage pour user");
        setUser(null);
        setUserAgenceId(null);
      }
    };

    fetchAgenceId();
  }, []);

  const login = (userData) => {
    console.log("Connexion avec userData :", userData);
    setUser(userData);
    setUserAgenceId(userData.agenceId || null);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    console.log("Déconnexion effectuée");
    setUser(null);
    setUserAgenceId(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, userAgenceId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return context;
};

export default AuthContext;
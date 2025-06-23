"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { getAgenceIdByUserId } from "../services/userServices";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userAgenceId, setUserAgenceId] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      setIsAuthLoading(true);
      const storedUser = localStorage.getItem("user");
      console.log("Données brutes du localStorage :", storedUser);

      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          console.log("Données parsées du localStorage :", userData);
          setUser(userData);

          const userId = userData.id;
          console.log("UserId extrait :", userId);

          if (userId) {
            try {
              const agenceResponse = await getAgenceIdByUserId(userId);
              console.log("Réponse de getAgenceIdByUserId :", agenceResponse);
              const agenceId = agenceResponse?.data?.agenceId ?? null;
              console.log("userAgenceId extrait :", agenceId);
              setUserAgenceId(agenceId);
              // Mettre à jour localStorage avec agenceId
              localStorage.setItem("user", JSON.stringify({ ...userData, agenceId }));
            } catch (error) {
              console.error("Erreur lors de la récupération de l'agence :", error);
              setUserAgenceId(null);
            }
          } else {
            console.log("Aucun UserId trouvé dans les données du localStorage");
            setUserAgenceId(null);
          }
        } catch (error) {
          console.error("Erreur lors du parsing du localStorage :", error);
          setUser(null);
          setUserAgenceId(null);
        }
      } else {
        console.log("Aucune donnée trouvée dans localStorage pour user");
        setUser(null);
        setUserAgenceId(null);
      }

      setIsAuthLoading(false);
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    if (user) {
      console.log("Synchronisation de localStorage avec user :", user);
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      console.log("Suppression de user de localStorage");
      localStorage.removeItem("user");
    }
  }, [user]);

  const login = async (userData) => {
    console.log("Connexion avec userData :", userData);
    try {
      setIsAuthLoading(true);
      setUser(userData);

      const userId = userData.id;
      let agenceId = userData.agenceId ?? null;

      if (userId && !agenceId) {
        try {
          const agenceResponse = await getAgenceIdByUserId(userId);
          console.log("Réponse de getAgenceIdByUserId dans login :", agenceResponse);
          agenceId = agenceResponse?.data?.agenceId ?? null;
          console.log("AgenceId récupéré dans login :", agenceId);
        } catch (error) {
          console.error("Erreur lors de la récupération de l'agence dans login :", error);
          agenceId = null;
        }
      }

      setUserAgenceId(agenceId);

      const updatedUserData = { ...userData, agenceId };
      localStorage.setItem("user", JSON.stringify(updatedUserData));
      console.log("Données utilisateur stockées dans localStorage :", updatedUserData);
    } catch (error) {
      console.error("Erreur lors de la connexion :", error);
      setUser(null);
      setUserAgenceId(null);
      localStorage.removeItem("user");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const logout = () => {
    console.log("Déconnexion effectuée");
    setUser(null);
    setUserAgenceId(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, userAgenceId, isAuthLoading, login, logout }}>
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
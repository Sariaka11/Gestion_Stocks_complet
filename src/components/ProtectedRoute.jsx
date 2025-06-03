import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // Vérifier simplement si un utilisateur existe dans localStorage
  const user = localStorage.getItem('user');
  
  // Si pas d'utilisateur dans localStorage, rediriger vers login
  if (!user) {
    return <Navigate to="/auth/login-admin" replace />;
  }

  return children;
};

export default ProtectedRoute;
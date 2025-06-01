import React, { createContext, useState, useEffect } from "react";

// Создаём контекст
export const AuthContext = createContext();

// Провайдер контекста
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem("token") !== null;
  });

  // Функция для входа
  const login = (token, name) => {
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("name", name);
    setIsAuthenticated(true);
  };

  // Функция для выхода
  const logout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("name");
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

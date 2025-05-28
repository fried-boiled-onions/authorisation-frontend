import React, { createContext, useState, useEffect } from "react";

// Создаём контекст
export const AuthContext = createContext();

// Провайдер контекста
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Начальное состояние: проверяем токен в localStorage
    return localStorage.getItem("token") !== null;
  });

  // Функция для входа
  const login = (token, name) => {
    localStorage.setItem("token", token);
    localStorage.setItem("name", name);
    setIsAuthenticated(true);
  };

  // Функция для выхода
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

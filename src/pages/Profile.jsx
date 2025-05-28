import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../utils/AuthContext";
import { disconnectSignalR } from "../utils/api";

const Profile = () => {
  const [name, setName] = useState(localStorage.getItem("name") || "");
  const [originalName, setOriginalName] = useState(
    localStorage.getItem("name") || ""
  );
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  const handleEditName = () => {
    if (isEditing) {
      // Сохраняем изменения
      localStorage.setItem("name", name);
      setOriginalName(name); // Обновляем исходное имя
    }
    setIsEditing(!isEditing);
  };

  const handleCancelEdit = () => {
    setName(originalName); // Восстанавливаем исходное имя
    setIsEditing(false); // Выходим из режима редактирования
  };

  const handleLogout = () => {
    logout();
    disconnectSignalR();
    navigate("/login", { replace: true });
  };

  const handleBackToMessenger = () => {
    navigate("/messenger");
  };

  return (
    <div
      className="profile-wrapper"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f3f4f6",
      }}
    >
      <div
        className="profile-card"
        style={{
          position: "relative", // Для позиционирования стрелки
          width: "400px",
          padding: "2rem",
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          textAlign: "center",
        }}
      >
        <button
          onClick={handleBackToMessenger}
          style={{
            position: "absolute",
            top: "1rem",
            left: "1rem",
            background: "none",
            border: "none",
            fontSize: "1.5rem",
            cursor: "pointer",
            color: "#2563eb",
          }}
        >
          ←
        </button>
        <h2>Профиль</h2>
        <div className="profile-info" style={{ marginBottom: "1rem" }}>
          <label>Имя пользователя:</label>
          {isEditing ? (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              style={{
                marginLeft: "1rem",
                padding: "0.5rem",
                width: "200px",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
              }}
            />
          ) : (
            <span style={{ marginLeft: "1rem" }}>{name}</span>
          )}
        </div>
        {isEditing ? (
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              justifyContent: "center",
              marginBottom: "1rem",
            }}
          >
            <button
              onClick={handleCancelEdit}
              className="button-secondary"
              style={{
                padding: "0.5rem 1rem",
                width: "100px",
                background: "#6b7280",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "0.875rem",
              }}
            >
              Отмена
            </button>
            <button
              onClick={handleEditName}
              className="button-primary"
              style={{
                padding: "0.5rem 1rem",
                width: "100px",
                background: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "0.875rem",
              }}
            >
              Сохранить
            </button>
          </div>
        ) : (
          <button
            onClick={handleEditName}
            className="button-primary"
            style={{
              padding: "0.5rem 1rem",
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            Редактировать имя
          </button>
        )}
        <button
          onClick={handleLogout}
          className="button-primary"
          style={{
            marginTop: "1.5rem",
            padding: "0.5rem 1rem",
            background: "#e3342f",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Выйти
        </button>
      </div>
    </div>
  );
};

export default Profile;

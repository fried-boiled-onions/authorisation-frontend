import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaUserCircle } from "react-icons/fa";
import { AuthContext } from "../utils/AuthContext";
import { disconnectSignalR } from "../utils/api";

const Profile = () => {
  const [name, setName] = useState(sessionStorage.getItem("name") || "");
  const [originalName, setOriginalName] = useState(
    sessionStorage.getItem("name") || ""
  );
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  const handleEditName = () => {
    if (isEditing) {
      sessionStorage.setItem("name", name);
      setOriginalName(name);
    }
    setIsEditing(!isEditing);
  };

  const handleCancelEdit = () => {
    setName(originalName);
    setIsEditing(false);
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
    <div className="profile-page">
      <div className="profile-container">
        <button onClick={handleBackToMessenger} className="back-btn">
          <FaArrowLeft />
        </button>
        <div className="avatar-placeholder">
          <FaUserCircle size={80} color="#6b7280" />
        </div>
        <h2>Профиль</h2>
        <div className="profile-content">
          <label>Имя пользователя: </label>
          {isEditing ? (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
            />
          ) : (
            <span>{name}</span>
          )}
        </div>
        {isEditing ? (
          <div className="profile-buttons">
            <button
              onClick={handleCancelEdit}
              className="button-primary cancel-btn"
            >
              Отмена
            </button>
            <button
              onClick={handleEditName}
              className="button-primary save-btn"
            >
              Сохранить
            </button>
          </div>
        ) : (
          <div className="profile-buttons">
            <button onClick={handleEditName} className="button-primary">
              Редактировать имя
            </button>
            <button
              onClick={handleLogout}
              className="button-primary logout-btn"
            >
              Выйти
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;

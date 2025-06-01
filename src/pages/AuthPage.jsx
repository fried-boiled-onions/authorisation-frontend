import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser } from "../utils/api";
import { AuthContext } from "../utils/AuthContext";

const AuthPage = ({ isRegister = false }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      let response;
      if (isRegister) {
        response = await registerUser(username, password);
      } else {
        response = await loginUser(username, password);
      }
      const { token, userId } = response; // Предполагаем, что сервер возвращает userId
      login(token, username);
      sessionStorage.setItem("id", userId); // Сохраняем ID пользователя
      navigate("/messenger");
    } catch (err) {
      setError(
        err.response?.data?.message || "Ошибка авторизации. Попробуйте снова."
      );
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>{isRegister ? "Регистрация" : "Вход"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Имя пользователя:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Пароль:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="button-primary">
            {isRegister ? "Зарегистрироваться" : "Войти"}
          </button>
        </form>
        <p className="toggle-text">
          {isRegister ? "Уже есть аккаунт?" : "Нет аккаунта?"}
          <span
            onClick={() =>
              navigate(isRegister ? "/login" : "/register", { replace: true })
            }
            className="toggle-link"
          >
            {isRegister ? "Войти" : "Зарегистрироваться"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;

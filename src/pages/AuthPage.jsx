import { useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";

const AuthPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    //setError("");
    try {
      const endpoint = isRegistering ? "/auth/register" : "/auth/login";
      const body = isRegistering
        ? { name, email, password }
        : { email, password };

      const res = await axios.post(endpoint, body);

      if (res) {
        navigate("http://localhost:3000", { replace: true });
      }
    } catch {
      console.error("произлошла ошибка");
    }
  };

  return (
    <div className="auth-container">
      <h2>{isRegistering ? "Регистрация" : "Вход"}</h2>
      <form onSubmit={handleSubmit}>
        {isRegistering && (
          <div className="form-group">
            <label>Name:</label>
            <input
              name="name"
              type="text"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        )}
        <div className="form-group">
          <label>Email:</label>
          <input
            name="email"
            type="email"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Password:</label>
          <input
            name="password"
            type="password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength="6"
          />
        </div>

        {/* {error && <div className="error-message">{error}</div>} */}

        <button type="submit" className="button-primary">
          {isRegistering ? "Зарегистрироваться" : "Войти"}
        </button>

        <button
          type="button"
          className="button-primary"
          style={{ marginTop: "1rem", background: "#4b5563" }}
          onClick={() => setIsRegistering(!isRegistering)}
        >
          {isRegistering
            ? "У вас уже есть аккаунт? Войти"
            : "Нет учетной записи? Зарегистрируйтесь"}
        </button>
      </form>
    </div>
  );
};

export default AuthPage;

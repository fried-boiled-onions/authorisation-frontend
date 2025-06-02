import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import Messenger from "./pages/Messenger";
import Profile from "./pages/Profile";
import { AuthProvider, AuthContext } from "./utils/AuthContext";
import { useContext } from "react";

const AuthRoute = ({ component, redirect }) => {
  const { isAuthenticated } = useContext(AuthContext);
  return !isAuthenticated ? component : <Navigate to={redirect} />;
};

const PrivateRoute = ({ component, redirect }) => {
  const { isAuthenticated } = useContext(AuthContext);
  return isAuthenticated ? component : <Navigate to={redirect} />;
};

const AuthRedirect = () => {
  const { isAuthenticated } = useContext(AuthContext);
  return <Navigate to={isAuthenticated ? "/messenger" : "/login"} />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route
            path="/login"
            element={
              <AuthRoute component={<AuthPage />} redirect="/messenger" />
            }
          />
          <Route
            path="/register"
            element={
              <AuthRoute
                component={<AuthPage isRegister={true} />}
                redirect="/messenger"
              />
            }
          />
          <Route
            path="/messenger"
            element={
              <PrivateRoute component={<Messenger />} redirect="/login" />
            }
          />
          <Route
            path="/profile"
            element={<PrivateRoute component={<Profile />} redirect="/login" />}
          />
          <Route path="*" element={<AuthRedirect />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

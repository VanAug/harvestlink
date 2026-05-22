import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { apiGet, isLoggedIn, logout } from "../lib/api";

function defaultRedirectForRole(role) {
  if (role === "buyer") return "/buyer-dashboard";
  if (role === "exporter") return "/exporter-dashboard";
  if (role === "finance_partner") return "/financing";
  if (role === "admin") return "/admin-dashboard";
  return "/login";
}

export default function ProtectedRoute({ children, roles }) {
  const [authState, setAuthState] = useState("checking");
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      setAuthState("invalid");
      return;
    }

    let active = true;
    apiGet("/auth/validate")
      .then((data) => {
        if (!active) return;
        setUser(data);
        setAuthState("valid");
      })
      .catch(() => {
        logout();
        if (active) setAuthState("invalid");
      });

    return () => {
      active = false;
    };
  }, []);

  if (authState === "checking") {
    return null;
  }

  if (authState === "invalid") {
    return <Navigate to="/login" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to={defaultRedirectForRole(user.role)} replace />;
  }

  return children;
}
import axios from "axios";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface AuthRequireProps {
  children: ReactNode;
}

const AuthRequire = ({ children }: AuthRequireProps) => {
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/auth/authVerif`, {
        withCredentials: true,
      })
      .then(() => setChecking(false))
      .catch(() => navigate("/connexion"));
  }, [navigate]);

  if (checking) return <p>Chargement…</p>;

  return <>{children}</>;
};

export default AuthRequire;

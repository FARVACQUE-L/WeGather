import axios from "axios";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface AuthRequireAdminProps {
  children: ReactNode;
}

const AuthRequireAdmin = ({ children }: AuthRequireAdminProps) => {
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/auth/authVerif`, {
        withCredentials: true,
      })
      .then(({ data }) => {
        if (!data?.isAdmin) {
          navigate("/homeevents");
          return;
        }

        setChecking(false);
      })
      .catch(() => navigate("/connexion"));
  }, [navigate]);

  if (checking) return <p>Chargement…</p>;

  return <>{children}</>;
};

export default AuthRequireAdmin;

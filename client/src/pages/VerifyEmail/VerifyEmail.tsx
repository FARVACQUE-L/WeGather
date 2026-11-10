import "../Connexion/Connexion.css";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import connexionImg from "../../assets/images/Connexion-img.png";
import logo from "../../assets/images/logo-wegather.png";
import { reconnectSocket } from "../../socket/socket";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState(
    token ? "" : "Lien de confirmation invalide.",
  );
  const sent = useRef(false);

  useEffect(() => {
    if (!token || sent.current) return;
    sent.current = true;

    const verify = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/auth/verify-email`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          },
        );
        const data = await res.json();

        if (!res.ok) {
          setErrorMessage(data.message || "Lien de confirmation invalide.");
          return;
        }

        reconnectSocket();
        navigate("/homeevents", { replace: true });
      } catch {
        setErrorMessage("Erreur serveur");
      }
    };

    verify();
  }, [token, navigate]);

  return (
    <>
      <div className="navbar-connexion">
        <Link to="/" className="nav-connexion">
          <img src={logo} alt="logo-wegather" />
          <h1>
            We<i>G</i>ather
          </h1>
        </Link>
      </div>

      <div className="connection-section">
        <div className="connection-img-text">
          <img
            src={connexionImg}
            alt="connexion-img"
            className="connection-img"
          />
          <div className="connection-text">
            <h2>Facilitez vos prochains événements.</h2>
            <p>
              WeGather vous propose une expérience utilisateur simple et
              efficace.
            </p>
          </div>
        </div>

        <div className="connection-content">
          <div className="wel-para-title">
            <h2>Confirmation de l'adresse e-mail</h2>
            {errorMessage ? (
              <p>{errorMessage}</p>
            ) : (
              <p>Confirmation en cours…</p>
            )}
          </div>
          {errorMessage && (
            <h5 className="register-link-connection">
              <Link to="/connexion" className="register-link">
                Retour à la connexion
              </Link>
            </h5>
          )}
        </div>
      </div>
    </>
  );
}

export default VerifyEmail;

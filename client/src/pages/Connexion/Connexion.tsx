import "./Connexion.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import connexionImg from "../../assets/images/Connexion-img.png";
import eye from "../../assets/images/eye.png";
import hide from "../../assets/images/hide.png";
import logo from "../../assets/images/logo-wegather.png";

function Connexion() {
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [_submitted, setSubmitted] = useState(false);
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
  const isUsername = identifier.trim().length >= 3;
  const identifierValid = isEmail || isUsername;

  const passwordRules =
    password.length >= 12 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[@$!%*?&]/.test(password);

  const formValid = identifierValid && passwordRules;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    setErrorMessage("");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.message || "Erreur de connexion");
        return;
      }

      navigate("/homeevents");
    } catch {
      setErrorMessage("Erreur serveur");
    }
  };

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

        <form className="connection-content" onSubmit={handleSubmit}>
          <div className="wel-para-title">
            <h2>Bienvenue</h2>
            <p>Connectez-vous à votre tableau de bord.</p>
          </div>
          <div className="input-group">
            <div className="input-header">
              <label htmlFor="identifier">Pseudo ou Email</label>
            </div>
            <input
              id="identifier"
              type="text"
              placeholder="Entrez votre pseudo ou email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="input-focus"
            />
          </div>
          <div className="input-group">
            <div className="input-header">
              <label htmlFor="password">Mot de passe</label>
              <Link to="/forgetpassword" className="password-forget">
                Mot de passe oublié ?
              </Link>
            </div>
            <div className="container-password">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Entrez votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-focus password-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                <img
                  src={showPassword ? eye : hide}
                  alt="afficher mot de passe"
                  className="img-password-eye"
                />
              </button>
            </div>

            {errorMessage && <p className="error">{errorMessage}</p>}
          </div>

          <button
            type="submit"
            className="button-connection-submit"
            disabled={!formValid}
          >
            Connexion
          </button>
          <h5 className="register-link-connection">
            Pas encore inscrit ?{" "}
            <Link to="/register" className="register-link">
              Rejoins-nous ici
            </Link>
          </h5>
        </form>
      </div>
    </>
  );
}

export default Connexion;

import "./ForgetPassword.css";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import Swal from "sweetalert2";
import connexionImg from "../../assets/images/Connexion-img.png";
import logo from "../../assets/images/logo-wegather.png";

function ForgetPassword() {
  // Le premier champ reçoit le focus à l'ouverture : on peut taper
  // directement, sans cliquer dans le formulaire.
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  const [identifier, setIdentifier] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
  const isUsername = identifier.trim().length >= 3;
  const identifierValid = isEmail || isUsername;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/forgot-password`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ identifier }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.message || "Erreur serveur");
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Email envoyé",
        text: "Vérifie ta boîte mail pour réinitialiser ton mot de passe.",
        showConfirmButton: false,
        timer: 2500,
        background: "#ffffff",
        color: "#333",
        iconColor: "#e98d66",
      });

      navigate("/connexion");
    } catch {
      setErrorMessage("Erreur serveur");
    }
  };

  return (
    <>
      <div className="navbar-forgetpassword">
        <Link to="/" className="nav-forgetpassword">
          <img src={logo} alt="logo-wegather" />
          <h1>
            We<i>G</i>ather
          </h1>
        </Link>
      </div>
      <div className="forgetPassword-section">
        <div className="forgetPassword-img-text">
          <img
            src={connexionImg}
            alt="forgetPassword"
            className="forgetPassword-img"
          />

          <div className="forgetPassword-text">
            <h2>Facilitez vos prochains événements.</h2>
            <p className="forgetPassword-parag">
              WeGather vous propose une expérience utilisateur simple et
              efficace.
            </p>
          </div>
        </div>
        <form className="forgetPassword-content" onSubmit={handleSubmit}>
          <div className="wel-para-title-forgetPassword">
            <h2>Mot de passe oublié ?</h2>
            <p className="Welcome-forgetPassword-para">
              Entrez votre email ou votre pseudo pour recevoir un lien de
              réinitialisation.
            </p>
          </div>
          <div className="input-group">
            <label htmlFor="id">Pseudo ou Email</label>
            <input
              ref={firstInputRef}
              id="id"
              type="text"
              placeholder="Entrez votre pseudo ou email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="input-focus"
            />
            {identifier && !identifierValid && (
              <p className="error">✗ Pseudo ou adresse email invalide</p>
            )}
            {errorMessage && <p className="error">{errorMessage}</p>}
          </div>
          <button
            type="submit"
            className="button-forgetPassword-submit"
            disabled={!identifierValid}
          >
            Envoyer
          </button>
          <h5 className="register-link-connection-forgetPassword">
            Déjà un compte ?{" "}
            <Link to="/connexion" className="register-link-forgetPassword">
              Se connecter
            </Link>
          </h5>
          <h5 className="register-link-connection-forgetPassword">
            Pas encore inscrit ?{" "}
            <Link to="/register" className="register-link-forgetPassword">
              Rejoins-nous ici
            </Link>
          </h5>
        </form>
      </div>
    </>
  );
}

export default ForgetPassword;

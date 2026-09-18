import "./Register.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import Swal from "sweetalert2";
import connexionImg from "../../assets/images/Connexion-img.png";
import eye from "../../assets/images/eye.png";
import hide from "../../assets/images/hide.png";
import logo from "../../assets/images/logo-wegather.png";

function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const usernameValid = username.trim().length >= 3;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const passwordRules = {
    length: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&]/.test(password),
  };

  const passwordValid = Object.values(passwordRules).every(Boolean);
  const passwordsMatch = password === confirmPassword && confirmPassword !== "";
  const formValid =
    usernameValid &&
    emailValid &&
    passwordValid &&
    passwordsMatch &&
    acceptedTerms;

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const toast = Swal.mixin({
      toast: true,
      position: "top",
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true,

      customClass: {
        popup: "toast",
      },
    });

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/users`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password }),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        toast.fire({
          icon: "error",
          text: data.message,

          customClass: {
            popup: "toast-error-popup",
          },
        });

        return;
      }

      toast.fire({
        icon: "success",
        text: data.message || "Inscription réussie 🎉",

        customClass: {
          popup: "toast-success-popup",
        },
      });

      navigate("/connexion");
    } catch (error) {
      console.error(error);

      toast.fire({
        icon: "error",
        text: "Erreur serveur",

        customClass: {
          popup: "toast-error-popup",
        },
      });
    }
  };

  return (
    <div className="register-page">
      <div className="navbar-register">
        <Link to="/" className="nav-register">
          <img src={logo} alt="logo-wegather" />
          <h1>
            We<i>G</i>ather
          </h1>
        </Link>
      </div>
      <div className="register-section">
        <div className="register-img-text">
          <img src={connexionImg} alt="register-img" className="register-img" />
          <div className="register-text">
            <h2>Facilitez vos prochains événements.</h2>
            <p className="register-parag">
              WeGather vous propose une expérience utilisateur simple et
              efficace.
            </p>
          </div>
        </div>
        <form className="register-content" onSubmit={handleSubmit}>
          <div className="wel-para-title-register">
            <h2>Bienvenue</h2>
            <p>Inscrivez-vous à WeGather.</p>
          </div>
          <div className="input-group">
            <label htmlFor="username">Identifiant</label>
            <input
              type="text"
              id="username"
              placeholder="Entrez votre pseudo"
              required
              className="input-focus"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            {username && (
              <p
                className={`status-msg ${usernameValid ? "success" : "error"}`}
              >
                {usernameValid ? "✓ Pseudo valide" : "✗ Minimum 3 caractères"}
              </p>
            )}
          </div>
          <div className="input-group">
            <label htmlFor="email">Adresse email</label>
            <input
              type="email"
              id="email"
              placeholder="nom@wegather.com"
              required
              className="input-focus"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {email && (
              <p className={`status-msg ${emailValid ? "success" : "error"}`}>
                {emailValid ? "✓ Email valide" : "✗ Adresse email invalide"}
              </p>
            )}
          </div>
          <div className="input-group">
            <label htmlFor="password">Mot de passe</label>
            <div className="container-password-register">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Entrez votre mot de passe"
                required
                className="input-focus"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                <img src={showPassword ? eye : hide} alt="Toggle view" />
              </button>
            </div>
            <div>
              <p
                className={`status-msg ${passwordRules.length ? "success" : "error"}`}
              >
                Minimum 12 caractères
              </p>
              <p
                className={`status-msg ${passwordRules.uppercase ? "success" : "error"}`}
              >
                Une majuscule
              </p>
              <p
                className={`status-msg ${passwordRules.lowercase ? "success" : "error"}`}
              >
                Une minuscule
              </p>
              <p
                className={`status-msg ${passwordRules.number ? "success" : "error"}`}
              >
                Un chiffre
              </p>
              <p
                className={`status-msg ${passwordRules.special ? "success" : "error"}`}
              >
                Un caractère spécial
              </p>
            </div>
          </div>
          <div className="input-group">
            <label htmlFor="confirmPassword">Confirmez le mot de passe</label>
            <div className="container-password-register">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                placeholder="Confirmez votre mot de passe"
                required
                className="input-focus"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <img src={showConfirmPassword ? eye : hide} alt="Toggle view" />
              </button>
            </div>
            {password !== confirmPassword && confirmPassword !== "" && (
              <p className="status-msg error">
                ✗ Les mots de passe ne correspondent pas
              </p>
            )}
          </div>
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="terms"
              required
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
            />
            <label htmlFor="terms">
              J'accepte les <span>conditions générales d'utilisation</span> de
              WeGather
            </label>
          </div>
          <button
            type="submit"
            className="button-register-submit"
            disabled={!formValid}
          >
            Valider
          </button>
          <h5 className="register-link-connection">
            Déjà un compte ? <Link to="/connexion">Se connecter</Link>
          </h5>
        </form>
      </div>
    </div>
  );
}

export default Register;

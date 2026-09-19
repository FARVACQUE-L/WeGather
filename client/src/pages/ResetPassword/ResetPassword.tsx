import "./ResetPassword.css";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import Swal from "sweetalert2";
import connexionImg from "../../assets/images/Connexion-img.png";
import eye from "../../assets/images/eye.png";
import hide from "../../assets/images/hide.png";
import logo from "../../assets/images/logo-wegather.png";

function ResetPassword() {
  // Le premier champ reçoit le focus à l'ouverture : on peut taper
  // directement, sans cliquer dans le formulaire.
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const passwordRules = {
    length: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&]/.test(password),
  };

  const passwordValid = Object.values(passwordRules).every(Boolean);
  const passwordsMatch = password === confirmPassword && confirmPassword !== "";
  const formValid = passwordValid && passwordsMatch;

  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const navigate = useNavigate();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/auth/reset-password`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      },
    );

    const data = await res.json();

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

    if (!res.ok) {
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
      text: "Mot de passe changé avec succès. Vous allez être redirigé vers la connexion.",

      customClass: {
        popup: "toast-error-popup",
      },
    });

    setTimeout(() => {
      navigate("/connexion");
    }, 2000);
  };

  return (
    <>
      <div className="navbar-resetpassword">
        <Link to="/">
          <img src={logo} alt="logo-wegather" />
          <h1>
            We<i>G</i>ather
          </h1>
        </Link>
      </div>

      <div className="resetpassword-section">
        <div className="resetpassword-image">
          <img
            src={connexionImg}
            alt="resetpassword-img"
            className="resetpassword-img"
          />

          <div className="text">
            <h2>Facilitez vos prochains événements.</h2>
            <p>
              WeGather vous propose une expérience utilisateur simple et
              efficace.
            </p>
          </div>
        </div>

        <form className="resetpassword-content" onSubmit={handleReset}>
          <div className="title">
            <h2>Changez votre mot de passe.</h2>
          </div>

          <div className="field">
            <label htmlFor="password">Nouveau mot de passe</label>

            <div className="password-container">
              <input
                ref={firstInputRef}
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Entrer votre nouveau mot de passe"
                required
                className="input-focus"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                <img
                  src={showPassword ? eye : hide}
                  alt="Afficher le mot de passe"
                />
              </button>
            </div>

            <div>
              <p className={passwordRules.length ? "success" : "error"}>
                Minimum 12 caractères
              </p>

              <p className={passwordRules.uppercase ? "success" : "error"}>
                Une majuscule
              </p>

              <p className={passwordRules.lowercase ? "success" : "error"}>
                Une minuscule
              </p>

              <p className={passwordRules.number ? "success" : "error"}>
                Un chiffre
              </p>

              <p className={passwordRules.special ? "success" : "error"}>
                Un caractère spécial
              </p>
            </div>
          </div>

          <div className="field">
            <label htmlFor="confirmPassword">Confirmez le mot de passe</label>

            <div className="password-container">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirmer votre mot de passe"
                required
                className="input-focus"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <img
                  src={showConfirmPassword ? eye : hide}
                  alt="Afficher le mot de passe"
                />
              </button>
            </div>

            {password !== confirmPassword && confirmPassword !== "" && (
              <p className="error">✗ Le mot de passe ne correspond pas</p>
            )}
          </div>

          <button
            type="submit"
            className="button-resetpassword-submit"
            disabled={!formValid}
          >
            Réinitialiser
          </button>
        </form>
      </div>
    </>
  );
}

export default ResetPassword;

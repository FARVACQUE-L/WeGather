import "./ChangePassword.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import Swal from "sweetalert2";
import connexionImg from "../../assets/images/Connexion-img.png";
import eye from "../../assets/images/eye.png";
import hide from "../../assets/images/hide.png";
import logo from "../../assets/images/logo-wedoo.png";

function ChangePassword() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");

  const navigate = useNavigate();

  const passwordRules = {
    length: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&]/.test(password),
  };

  const passwordValid = Object.values(passwordRules).every(Boolean);
  const passwordsMatch = password === confirmPassword && confirmPassword !== "";

  const formValid = currentPassword !== "" && passwordValid && passwordsMatch;

  const handleChangePassword = async (e: React.FormEvent) => {
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
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/change-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            currentPassword,
            newPassword: password,
          }),
        },
      );

      const data = await res.json();

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
        text: "Mot de passe modifié avec succès",

        customClass: {
          popup: "toast-success-popup",
        },
      });
      navigate("/connexion");
    } catch (error) {
      console.error("CHANGE PASSWORD ERROR :", error);
      toast.fire({
        icon: "error",
        text: `Erreur : ${String(error)}`,

        customClass: {
          popup: "toast-error-popup",
        },
      });
    }
  };

  return (
    <>
      <nav className="navbar-changepassword">
        <Link to="/">
          <img src={logo} alt="logo-wedoo" />
          <h1>
            We<i>G</i>ather
          </h1>
        </Link>
      </nav>

      <section className="changepassword-section">
        <div className="image-side">
          <img
            src={connexionImg}
            alt="Illustration connexion"
            className="changepassword-img"
          />

          <div className="text-overlay">
            <h2>Facilitez vos prochains événements.</h2>
            <p>
              WeGather vous propose une expérience utilisateur simple et
              efficace.
            </p>
          </div>
        </div>
        <form
          className="changepassword-content"
          onSubmit={handleChangePassword}
        >
          <header>
            <h2>Changez votre mot de passe.</h2>
          </header>
          <div className="input-group">
            <label htmlFor="currentPassword">Ancien mot de passe</label>

            <div className="password-container">
              <input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                placeholder="Entrer votre ancien mot de passe"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input-focus"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                <img
                  src={showCurrentPassword ? eye : hide}
                  alt="Afficher le mot de passe"
                />
              </button>
            </div>
          </div>
          <div className="input-group">
            <label htmlFor="newPassword">Nouveau mot de passe</label>

            <div className="password-container">
              <input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Entrer votre nouveau mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-focus"
                required
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

            <div className="password-rules">
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
          <div className="input-group">
            <label htmlFor="confirmPassword">Confirmez le mot de passe</label>
            <div className="password-container">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirmer votre mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-focus"
                required
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

          <button type="submit" disabled={!formValid} className="submit-btn">
            Réinitialiser
          </button>
        </form>
      </section>
    </>
  );
}

export default ChangePassword;

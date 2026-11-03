import { Send } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import NavBar from "../../components/NavBar/NavBar";
import Profil from "../../components/Profil/Profil";
// Même mise en page que les pages légales, plus les styles du formulaire.
import "../PageCGV/PageCGV.css";
import "./Contact.css";

const CONTACT_EMAIL = "wedoop3@gmail.com";
const MESSAGE_MAX = 2000;
const MESSAGE_MIN = 10;

// Mêmes valeurs que CONTACT_SUBJECTS (server/src/modules/contact).
const SUBJECTS = [
  "Question",
  "Problème technique",
  "Suggestion",
  "Partenariat",
  "Autre",
];

// Page publique : le menu du profil n'apparaît que pour un utilisateur
// connecté.
function Contact() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [message, setMessage] = useState("");
  // Champ piège : invisible pour un visiteur, rempli par les robots.
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/auth/authVerif`, {
      credentials: "include",
    })
      .then((res) => setIsLoggedIn(res.ok))
      .catch(() => setIsLoggedIn(false));
  }, []);

  // Le navigateur vérifie déjà les champs (required, type="email",
  // minLength, maxLength) avant d'arriver ici.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStatus("sending");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/contact`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, subject, message, website }),
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(
          data?.message ??
            "Votre message n'a pas pu être envoyé. Réessayez plus tard.",
        );
        setStatus("idle");
        return;
      }

      setStatus("sent");
    } catch {
      setError("Impossible de joindre le serveur. Réessayez plus tard.");
      setStatus("idle");
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setSubject(SUBJECTS[0]);
    setMessage("");
    setStatus("idle");
  };

  return (
    <div className="cgv-Layout">
      <header className="cvg-HeaderNav">
        <NavBar />
        {isLoggedIn && <Profil />}
      </header>
      <main className="cgv-Page">
        <h1>Nous contacter</h1>
        <p className="cgv-Updated">
          Une question, un souci, une idée ? L'équipe WeGather vous répond par
          e-mail.
        </p>

        {status === "sent" ? (
          <div className="Contact-Sent" role="status">
            <h3>Message envoyé, merci !</h3>
            <p>
              Nous l'avons bien reçu et vous répondrons à l'adresse{" "}
              <strong>{email}</strong> dès que possible.
            </p>
            <button
              type="button"
              className="Contact-Button"
              onClick={resetForm}
            >
              Envoyer un autre message
            </button>
          </div>
        ) : (
          <form className="Contact-Form" onSubmit={handleSubmit}>
            <div className="Contact-Row">
              <div className="Contact-Field">
                <label htmlFor="contact-name">Nom</label>
                <input
                  id="contact-name"
                  type="text"
                  autoComplete="name"
                  maxLength={100}
                  placeholder="Ex : Camille Martin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="Contact-Field">
                <label htmlFor="contact-email">Adresse e-mail</label>
                <input
                  id="contact-email"
                  type="email"
                  autoComplete="email"
                  maxLength={100}
                  placeholder="nom@exemple.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="Contact-Field">
              <label htmlFor="contact-subject">Sujet</label>
              <select
                id="contact-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              >
                {SUBJECTS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="Contact-Field">
              <label htmlFor="contact-message">Message</label>
              <textarea
                id="contact-message"
                rows={7}
                minLength={MESSAGE_MIN}
                maxLength={MESSAGE_MAX}
                placeholder="Décrivez votre demande…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
              <span className="Contact-Counter">
                {message.length} / {MESSAGE_MAX}
              </span>
            </div>

            {/* Hors écran et ignoré au clavier et par les lecteurs d'écran. */}
            <div className="Contact-Trap" aria-hidden="true">
              <label htmlFor="contact-website">Site web</label>
              <input
                id="contact-website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            {error && (
              <p className="Contact-Error" role="alert">
                {error}
              </p>
            )}

            <p className="Contact-Notice">
              Votre nom, votre adresse e-mail et votre message sont transmis à
              l'équipe WeGather, via Discord, uniquement pour vous répondre.
              Voir la{" "}
              <Link to="/confidentialite">politique de confidentialité</Link>.
            </p>

            <button
              type="submit"
              className="Contact-Button"
              disabled={status === "sending"}
            >
              <Send size={16} />
              {status === "sending" ? "Envoi…" : "Envoyer"}
            </button>
          </form>
        )}

        <p className="Contact-Alternative">
          Vous préférez l'e-mail ? Écrivez-nous à{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </main>
    </div>
  );
}

export default Contact;

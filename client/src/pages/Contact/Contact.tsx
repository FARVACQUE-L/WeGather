import {
  AnimatePresence,
  MotionConfig,
  motion,
  type Variants,
} from "framer-motion";
import { Send } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import NavBar from "../../components/NavBar/NavBar";
import Profil from "../../components/Profil/Profil";
import "../PageCGV/PageCGV.css";
import "./Contact.css";

const CONTACT_EMAIL = "contact@wegather.fr";
const MESSAGE_MAX = 2000;
const MESSAGE_MIN = 10;

const SUBJECTS = [
  "Question",
  "Problème technique",
  "Suggestion",
  "Partenariat",
  "Autre",
];

const formVariants: Variants = {
  hidden: {},
  visible: { transition: { delayChildren: 0.2, staggerChildren: 0.08 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

const fieldVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

function Contact() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [message, setMessage] = useState("");
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
    <MotionConfig reducedMotion="user">
      <div className="cgv-Layout">
        <header className="cvg-HeaderNav">
          <NavBar />
          {isLoggedIn && <Profil />}
        </header>
        <main className="cgv-Page">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            Nous contacter
          </motion.h1>
          <motion.p
            className="cgv-Updated"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            Une question, un souci, une idée ? L'équipe WeGather vous répond par
            e-mail.
          </motion.p>

          <AnimatePresence mode="wait">
            {status === "sent" ? (
              <motion.div
                key="sent"
                className="Contact-Sent"
                role="status"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
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
              </motion.div>
            ) : (
              <motion.form
                key="form"
                className="Contact-Form"
                onSubmit={handleSubmit}
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <motion.div className="Contact-Row" variants={fieldVariants}>
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
                </motion.div>

                <motion.div className="Contact-Field" variants={fieldVariants}>
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
                </motion.div>

                <motion.div className="Contact-Field" variants={fieldVariants}>
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
                </motion.div>

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

                <AnimatePresence>
                  {error && (
                    <motion.p
                      key={error}
                      className="Contact-Error"
                      role="alert"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <motion.p className="Contact-Notice" variants={fieldVariants}>
                  Votre nom, votre adresse e-mail et votre message sont transmis
                  à l'équipe WeGather, via Discord, uniquement pour vous
                  répondre. Voir la{" "}
                  <Link to="/confidentialite">
                    politique de confidentialité
                  </Link>
                  .
                </motion.p>

                <motion.div
                  className="Contact-Actions"
                  variants={fieldVariants}
                >
                  <button
                    type="submit"
                    className="Contact-Button"
                    disabled={status === "sending"}
                  >
                    <Send size={16} />
                    {status === "sending" ? "Envoi…" : "Envoyer"}
                  </button>
                </motion.div>
              </motion.form>
            )}
          </AnimatePresence>

          <motion.p
            className="Contact-Alternative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.7 }}
          >
            Vous préférez l'e-mail ? Écrivez-nous à{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </motion.p>
        </main>
      </div>
    </MotionConfig>
  );
}

export default Contact;

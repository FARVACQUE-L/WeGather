import "./Profil.css";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  LockKeyhole,
  LogOut,
  Pencil,
  ShieldUser,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import Swal from "sweetalert2";

function Profil() {
  const navigate = useNavigate();
  const location = useLocation();
  const isOnEventPage = location.pathname.startsWith("/homeevents");
  const [userName, setUserName] = useState("");
  const [isMainModalOpen, setIsMainModalOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isAdminPage = location.pathname === "/admin";
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/auth/authVerif`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Utilisateur non connecté");
        }
        return res.json();
      })
      .then((data) => {
        setUserId(data.id);
        setIsAdmin(Boolean(data.isAdmin));
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!userId) return;

    fetch(`${import.meta.env.VITE_API_URL}/api/users/${userId}/photo`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Erreur récupération photo");
        }
        return res.json();
      })
      .then((data) => {
        setProfilePicture(data.user_profile_picture);
      })
      .catch((error) => console.error(error));
  }, [userId]);
  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPreview(URL.createObjectURL(file));
    }
  }

  async function handleUploadPhoto() {
    const toast = Swal.mixin({
      toast: true,
      position: "top",
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true,
      customClass: { popup: "toast" },
    });

    if (!photo) {
      toast.fire({
        icon: "warning",
        text: "Choisis une image",
        customClass: { popup: "toast-warning-popup" },
      });
      return;
    }

    if (!userId) {
      toast.fire({
        icon: "error",
        text: "Utilisateur introuvable",
        customClass: { popup: "toast-error-popup" },
      });
      return;
    }

    const formData = new FormData();
    formData.append("photo", photo);

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/users/${userId}/photo`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      },
    );

    const data = await response.json();

    if (!response.ok) {
      toast.fire({
        icon: "error",
        text: data.message,
        customClass: { popup: "toast-error-popup" },
      });
      return;
    }

    setProfilePicture(data.photoUrl);
    setPhoto(null);
    setPreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function updateUserName(user_name: string, user_id: number) {
    if (!user_name.trim()) {
      setErrorMessage("Rentrer un pseudo");
      return;
    }

    try {
      setErrorMessage("");
      await fetch(`${import.meta.env.VITE_API_URL}/api/users/${user_id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_name }),
      });
      setUserName("");
    } catch (error) {
      console.error(error);
    }
  }

  async function handleDeconnexion() {
    try {
      if (isOnEventPage) {
        await fetch(`${import.meta.env.VITE_API_URL}/api/logout`, {
          method: "POST",
          credentials: "include",
        });

        navigate("/connexion");
      } else {
        navigate("/homeevents");
      }
    } catch (error) {
      console.error("Erreur déconnexion :", error);
    }
  }

  return (
    <div className="profil">
      <button
        className="button"
        type="button"
        onClick={() => setIsMainModalOpen(true)}
      >
        <img
          src={`${import.meta.env.VITE_API_URL}${profilePicture}`}
          alt="photo-profil"
        />
      </button>

      <AnimatePresence>
        {isMainModalOpen && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              setIsMainModalOpen(false);
              setActiveModal(null);
            }}
          >
            <motion.div
              className="modal"
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onClick={(e: React.MouseEvent<HTMLDivElement>) =>
                e.stopPropagation()
              }
            >
              <h2>Parametre du profil</h2>

              <img
                src={`${import.meta.env.VITE_API_URL}${profilePicture}`}
                alt="photo-profil"
              />

              <button
                type="button"
                onClick={() =>
                  setActiveModal((prev) =>
                    prev === "Changer le pseudo" ? null : "Changer le pseudo",
                  )
                }
              >
                <Pencil size={15} />
                Changer le pseudo
              </button>

              <AnimatePresence>
                {activeModal === "Changer le pseudo" && (
                  <motion.div
                    className="change-pseudo"
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                  >
                    <input
                      ref={fileInputRef}
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Changer le nom"
                    />
                    {errorMessage && (
                      <p className="error-message">{errorMessage}</p>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (userId !== null) {
                          updateUserName(userName, userId);
                        }
                      }}
                    >
                      Valider
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <button type="button" onClick={() => navigate("/changepassword")}>
                <LockKeyhole size={15} />
                Changer le mot de passe
              </button>

              <button
                type="button"
                onClick={() =>
                  setActiveModal((prev) =>
                    prev === "Changer la photo de profil"
                      ? null
                      : "Changer la photo de profil",
                  )
                }
              >
                <Camera size={15} />
                Changer la photo de profil
              </button>

              <AnimatePresence>
                {activeModal === "Changer la photo de profil" && (
                  <motion.div
                    className="sub-modal"
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                  >
                    <label htmlFor="photo-upload" className="custom-upload">
                      Choisir une image
                    </label>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden-input"
                    />
                    {preview && (
                      <img
                        src={preview}
                        alt="preview"
                        className="photo-preview"
                      />
                    )}
                    <button type="button" onClick={handleUploadPhoto}>
                      Enregistrer la photo
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() =>
                    navigate(isAdminPage ? "/homeevents" : "/admin")
                  }
                >
                  {isAdminPage ? (
                    <>
                      <User size={15} />
                      Profil User
                    </>
                  ) : (
                    <>
                      <ShieldUser size={15} />
                      Profil Admin
                    </>
                  )}
                </button>
              )}

              <button
                className={
                  isOnEventPage ? "deconnexion-profil" : "deconnexion-event"
                }
                type="button"
                onClick={handleDeconnexion}
              >
                <LogOut size={15} />
                {isOnEventPage ? "Déconnexion" : "Retour à l'accueil"}
              </button>

              <button
                className="fermer"
                type="button"
                onClick={() => {
                  setIsMainModalOpen(false);
                  setActiveModal(null);
                }}
              >
                Fermer
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Profil;

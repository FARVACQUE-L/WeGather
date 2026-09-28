import { motion } from "framer-motion";
import {
  Crown,
  Search,
  ShieldCheck,
  ShieldMinus,
  ShieldPlus,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import "./AdminRoles.css";

type Admin = {
  user_id: number;
  user_username: string;
  user_mail: string;
  user_profile_picture: string | null;
  user_is_superadmin: number;
};

type UserResult = {
  user_id: number;
  user_username: string;
  user_mail: string;
  user_profile_picture: string | null;
  user_is_admin: number;
};

const API_URL = import.meta.env.VITE_API_URL;

const toast = Swal.mixin({
  toast: true,
  position: "top",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
  customClass: { popup: "toast-error-popup" },
});

function AdminRoles() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [selected, setSelected] = useState<UserResult | null>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);
  // Seuls les superadmins peuvent ajouter ou retirer des admins ; les autres
  // admins voient la liste en lecture seule. Le serveur applique la même règle.
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/auth/authVerif`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setIsSuperAdmin(Boolean(data.isSuperAdmin)))
      .catch(() => setIsSuperAdmin(false));
  }, []);

  const fetchAdmins = useCallback(async () => {
    const res = await fetch(`${API_URL}/api/admin/admins`, {
      credentials: "include",
    });
    if (res.ok) setAdmins(await res.json());
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  // Recherche lancée 300 ms après la dernière frappe, pour ne pas envoyer
  // une requête par caractère tapé.
  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(() => {
      fetch(
        `${API_URL}/api/admin/users/search?q=${encodeURIComponent(trimmed)}`,
        { credentials: "include" },
      )
        .then((res) => (res.ok ? res.json() : []))
        .then(setResults)
        .catch(() => setResults([]));
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  async function handleGrantAdmin() {
    if (!selected) return;

    const res = await fetch(
      `${API_URL}/api/admin/users/${selected.user_id}/admin`,
      { method: "PATCH", credentials: "include" },
    );

    if (!res.ok) {
      toast.fire({
        icon: "error",
        text: "Impossible d'attribuer le rôle administrateur",
      });
      return;
    }

    toast.fire({
      icon: "success",
      text: `${selected.user_username} est maintenant administrateur`,
    });

    const grantedId = selected.user_id;
    setResults((prev) =>
      prev.map((user) =>
        user.user_id === grantedId ? { ...user, user_is_admin: 1 } : user,
      ),
    );
    setSelected(null);
    fetchAdmins();
  }

  async function handleRevokeAdmin(admin: Admin) {
    const { isConfirmed } = await Swal.fire({
      title: "Retirer le rôle administrateur",
      text: `${admin.user_username} n'aura plus accès à l'espace admin.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Retirer",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#a53b22",
    });

    if (!isConfirmed) return;

    const res = await fetch(
      `${API_URL}/api/admin/users/${admin.user_id}/admin`,
      {
        method: "DELETE",
        credentials: "include",
      },
    );

    if (!res.ok) {
      toast.fire({
        icon: "error",
        text: "Impossible de retirer le rôle administrateur",
      });
      return;
    }

    toast.fire({
      icon: "success",
      text: `${admin.user_username} n'est plus administrateur`,
    });

    setResults((prev) =>
      prev.map((user) =>
        user.user_id === admin.user_id ? { ...user, user_is_admin: 0 } : user,
      ),
    );
    fetchAdmins();
  }

  return (
    <motion.div
      className="admin-roles"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.h1
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        Rôles
      </motion.h1>

      <div className={`admin-roles-grid${isSuperAdmin ? "" : " is-read-only"}`}>
        {isSuperAdmin && (
          <section className="admin-roles-card">
            <h2>Ajouter un administrateur</h2>
            <p className="admin-roles-hint">
              Recherchez un utilisateur par pseudo ou par adresse mail.
            </p>

            <div className="admin-roles-search">
              <Search size={18} />
              <input
                type="search"
                placeholder="Pseudo ou adresse mail"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelected(null);
                }}
              />
            </div>

            {query.trim().length >= 2 && results.length === 0 && (
              <p className="admin-roles-empty">Aucun utilisateur trouvé.</p>
            )}

            {results.length > 0 && (
              <ul className="admin-roles-results">
                {results.map((user) => {
                  const isAdmin = Boolean(user.user_is_admin);
                  const isSelected = selected?.user_id === user.user_id;

                  return (
                    <li key={user.user_id}>
                      <button
                        type="button"
                        className={`admin-roles-result${isSelected ? " is-selected" : ""}`}
                        disabled={isAdmin}
                        onClick={() => setSelected(user)}
                      >
                        <img
                          src={`${API_URL}${user.user_profile_picture}`}
                          alt={user.user_username}
                        />
                        <span className="admin-roles-identity">
                          <span className="admin-roles-username">
                            {user.user_username}
                          </span>
                          <span className="admin-roles-mail">
                            {user.user_mail}
                          </span>
                        </span>
                        {isAdmin && (
                          <span className="admin-roles-badge">
                            <ShieldCheck size={14} />
                            Admin
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <button
              type="button"
              className="admin-roles-submit"
              disabled={!selected}
              onClick={handleGrantAdmin}
            >
              <ShieldPlus size={18} />
              {selected
                ? `Ajouter ${selected.user_username} comme administrateur`
                : "Ajouter"}
            </button>
          </section>
        )}

        <section className="admin-roles-card">
          <h2>
            Administrateurs <span>({admins.length})</span>
          </h2>
          <ul className="admin-roles-admins">
            {admins.map((admin) => (
              <li key={admin.user_id}>
                <img
                  src={`${API_URL}${admin.user_profile_picture}`}
                  alt={admin.user_username}
                />
                <span className="admin-roles-identity">
                  <span className="admin-roles-username">
                    {admin.user_username}
                  </span>
                  <span className="admin-roles-mail">{admin.user_mail}</span>
                </span>
                {admin.user_is_superadmin ? (
                  <span className="admin-roles-badge is-super">
                    <Crown size={14} />
                    Superadmin
                  </span>
                ) : (
                  isSuperAdmin && (
                    <button
                      type="button"
                      className="admin-roles-revoke"
                      onClick={() => handleRevokeAdmin(admin)}
                    >
                      <ShieldMinus size={16} />
                      <span>Retirer</span>
                    </button>
                  )
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </motion.div>
  );
}

export default AdminRoles;

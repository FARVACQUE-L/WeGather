import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
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

  // Relu après chaque changement de rôle : un superadmin qui se rétrograde
  // perd aussitôt ses boutons de gestion.
  const fetchCurrentUser = useCallback(() => {
    fetch(`${API_URL}/api/auth/authVerif`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setIsSuperAdmin(Boolean(data.isSuperAdmin)))
      .catch(() => setIsSuperAdmin(false));
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

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

  async function handleChangeSuperAdmin(admin: Admin, promote: boolean) {
    const { isConfirmed } = await Swal.fire({
      title: promote ? "Passer en superadmin" : "Repasser en administrateur",
      text: promote
        ? `${admin.user_username} pourra ajouter et retirer des administrateurs.`
        : `${admin.user_username} ne pourra plus gérer les rôles.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Confirmer",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#a53b22",
    });

    if (!isConfirmed) return;

    const res = await fetch(
      `${API_URL}/api/admin/users/${admin.user_id}/superadmin`,
      { method: promote ? "PATCH" : "DELETE", credentials: "include" },
    );

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      toast.fire({
        icon: "error",
        text: data?.message ?? "Impossible de modifier le rôle",
      });
      return;
    }

    toast.fire({
      icon: "success",
      text: promote
        ? `${admin.user_username} est maintenant superadmin`
        : `${admin.user_username} est de nouveau administrateur`,
    });

    fetchAdmins();
    fetchCurrentUser();
  }

  const superAdmins = admins.filter((admin) => admin.user_is_superadmin);
  const regularAdmins = admins.filter((admin) => !admin.user_is_superadmin);

  function renderAdmin(admin: Admin) {
    const isSuper = Boolean(admin.user_is_superadmin);
    // Le serveur refuse de rétrograder le dernier superadmin : la flèche est
    // désactivée pour ne pas proposer une action vouée à l'échec.
    const isLastSuperAdmin = isSuper && superAdmins.length <= 1;

    return (
      <li key={admin.user_id}>
        <img
          src={`${API_URL}${admin.user_profile_picture}`}
          alt={admin.user_username}
        />
        <span className="admin-roles-identity">
          <span className="admin-roles-username">{admin.user_username}</span>
          <span className="admin-roles-mail">{admin.user_mail}</span>
        </span>
        {isSuperAdmin && (
          <span className="admin-roles-actions">
            <button
              type="button"
              className="admin-roles-arrow"
              aria-label={
                isSuper
                  ? `Repasser ${admin.user_username} en administrateur`
                  : `Passer ${admin.user_username} en superadmin`
              }
              title={
                isLastSuperAdmin
                  ? "Il doit rester au moins un superadmin"
                  : isSuper
                    ? "Repasser en administrateur"
                    : "Passer en superadmin"
              }
              disabled={isLastSuperAdmin}
              onClick={() => handleChangeSuperAdmin(admin, !isSuper)}
            >
              {isSuper ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
            </button>
            {!isSuper && (
              <button
                type="button"
                className="admin-roles-revoke"
                onClick={() => handleRevokeAdmin(admin)}
              >
                <ShieldMinus size={16} />
                <span>Retirer</span>
              </button>
            )}
          </span>
        )}
      </li>
    );
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
            Super administrateurs <span>({superAdmins.length})</span>
          </h2>
          <ul className="admin-roles-admins">{superAdmins.map(renderAdmin)}</ul>

          <h2 className="admin-roles-subtitle">
            Administrateurs <span>({regularAdmins.length})</span>
          </h2>
          {regularAdmins.length > 0 ? (
            <ul className="admin-roles-admins">
              {regularAdmins.map(renderAdmin)}
            </ul>
          ) : (
            <p className="admin-roles-empty">Aucun administrateur.</p>
          )}
        </section>
      </div>
    </motion.div>
  );
}

export default AdminRoles;

import { useEffect, useRef, useState } from "react";

import type { EventData, JoinFormProps } from "../../types/Events";

import "./JoinForm.css";

function JoinForm({ onClose, onEventCreated }: JoinFormProps) {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submitCode = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/events/join`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_link_key: code.trim().toUpperCase(),
          }),
        },
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }

      const newEvent: EventData = await res.json();
      onEventCreated(newEvent, true);
      setCode("");
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    submitCode();
  };

  return (
    <>
      <div className="JoinForm-Body">
        <h2 className="JoinForm-Title" id="modal-title">
          Rejoignez un événement
        </h2>
        <div className="JoinForm-Field">
          <label className="JoinForm-Label" htmlFor="code">
            Pour rejoindre un événement, veuillez renseigner le code événement
            partagé par l'organisateur.
          </label>
          <div className="JoinForm-InputGlobal">
            <input
              ref={inputRef}
              id="code"
              className="JoinForm-Input JoinForm-Input--code"
              type="text"
              name="code"
              placeholder="Ex : ABC123"
              value={code}
              onChange={(e) => {
                setError(null);
                setCode(e.target.value);
              }}
              maxLength={6}
              disabled={isLoading}
            />
            {error && <p className="JoinForm-Error">{error}</p>}
          </div>
        </div>
      </div>
      <div className="JoinForm-Footer">
        <button
          type="button"
          className="JoinForm-ButtonCancel"
          onClick={onClose}
          disabled={isLoading}
        >
          Annuler
        </button>

        <button
          type="button"
          className="JoinForm-ButtonSubmit"
          onClick={handleSubmit}
          disabled={code.trim().length !== 6 || isLoading}
        >
          {isLoading ? "Vérification..." : "Rejoindre"}
        </button>
      </div>
    </>
  );
}

export default JoinForm;

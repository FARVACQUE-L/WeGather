import { useState } from "react";

import type { CreateFormProps, EventData } from "../../types/Events";

import "./CreateForm.css";

function CreateForm({ onClose, onEventCreated }: CreateFormProps) {
  const [form, setForm] = useState({
    title: "",
    dateStart: "",
    dateEnd: "",
    description: "",
    location: "",
  });

  const today = new Date().toISOString().split("T")[0];
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    const formatted =
      name === "dateStart" || name === "dateEnd"
        ? value
        : value.charAt(0).toUpperCase() + value.slice(1);
    setForm((prev) => ({ ...prev, [name]: formatted }));
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/events`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_name: form.title,
          event_date_start: form.dateStart,
          event_date_end: form.dateEnd,
          event_description: form.description,
          event_location: form.location,
          event_picture: `${import.meta.env.VITE_API_URL}/assets/images/logo-wegather.png`,
        }),
      });

      if (!res.ok) throw new Error("Erreur lors de la création");

      const newEvent: EventData = await res.json();
      onEventCreated(newEvent);
      setForm({
        title: "",
        dateStart: "",
        dateEnd: "",
        description: "",
        location: "",
      });
      onClose();
    } catch {
      setError("Une erreur est survenue, veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid =
    form.title &&
    form.dateStart &&
    form.dateEnd &&
    form.description &&
    form.location;
  return (
    <>
      <form className="CreateForm-Body">
        <h2 className="CreateForm-Title" id="modal-title">
          Créez votre événement
        </h2>

        {error && (
          <p className="CreateForm-Error" role="alert">
            {error}
          </p>
        )}

        <div className="CreateForm-Field">
          <label className="CreateForm-Label" htmlFor="title">
            Nom de votre événement
          </label>
          <input
            id="title"
            className="CreateForm-Input"
            type="text"
            name="title"
            placeholder="Ex : Festival de Jazz"
            value={form.title}
            onChange={handleChange}
            maxLength={45}
          />
        </div>

        <div className="CreateForm-Field">
          <div className="CreateForm-DateGlobal">
            <div className="CreateForm-Date">
              <label className="CreateForm-Label" htmlFor="dateStart">
                Date de début
              </label>
              <input
                id="dateStart"
                className="CreateForm-DateInput"
                type="date"
                name="dateStart"
                value={form.dateStart}
                onChange={handleChange}
                min={today}
              />
            </div>
            <div className="CreateForm-Date">
              <label className="CreateForm-Label" htmlFor="dateEnd">
                Date de fin
              </label>
              <input
                id="dateEnd"
                className="CreateForm-DateInput"
                type="date"
                name="dateEnd"
                value={form.dateEnd}
                onChange={handleChange}
                min={form.dateStart || today}
              />
            </div>
          </div>
        </div>

        <div className="CreateForm-Field">
          <label className="CreateForm-Label" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            className="CreateForm-TextArea"
            name="description"
            placeholder="Décrivez votre événement..."
            value={form.description}
            onChange={handleChange}
            rows={4}
            maxLength={255}
          />
          <span className="CreateForm-Counter">
            {form.description.length}/255
          </span>
        </div>

        <div className="CreateForm-Field">
          <label className="CreateForm-Label" htmlFor="location">
            Lieu
          </label>
          <input
            id="location"
            className="CreateForm-Input"
            name="location"
            placeholder="Ex : Paris"
            value={form.location}
            onChange={handleChange}
            maxLength={100}
          />
        </div>
      </form>

      <footer className="CreateForm-Footer">
        <button
          type="button"
          className="CreateForm-ButtonCancel"
          onClick={onClose}
          disabled={isLoading}
        >
          Annuler
        </button>
        <button
          type="button"
          className="CreateForm-ButtonSubmit"
          onClick={handleSubmit}
          disabled={!isFormValid || isLoading}
        >
          {isLoading ? "Création..." : "Créer l'événement"}
        </button>
      </footer>
    </>
  );
}

export default CreateForm;

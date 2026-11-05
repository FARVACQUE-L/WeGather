import { useState } from "react";
import "./BudgetFormModal.css";

type BudgetFormModalProps = {
  title: string;
  submitLabel: string;
  initialName?: string;
  initialPrice?: number;
  onCancel: () => void;
  onSubmit: (name: string, price: number) => void;
};

function BudgetFormModal({
  title,
  submitLabel,
  initialName = "",
  initialPrice,
  onCancel,
  onSubmit,
}: BudgetFormModalProps) {
  const [name, setName] = useState(initialName);
  const [price, setPrice] = useState(
    initialPrice === undefined ? "" : String(initialPrice),
  );
  const [error, setError] = useState("");

  const isEditing = initialPrice !== undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const numericPrice = Number(price);

    if (!trimmedName) {
      setError("Nom obligatoire");
      return;
    }

    if (!numericPrice || numericPrice <= 0) {
      setError("Prix invalide");
      return;
    }

    if (
      isEditing &&
      trimmedName === initialName &&
      numericPrice === Number(initialPrice)
    ) {
      setError("Aucune modification n’a été détectée");
      return;
    }

    onSubmit(trimmedName, numericPrice);
  };

  return (
    <div className="BudgetForm-Overlay">
      <form className="BudgetForm" onSubmit={handleSubmit}>
        <h2 className="BudgetForm-Title">{title}</h2>

        <div className="BudgetForm-Field">
          <label className="BudgetForm-Label" htmlFor="budget-name">
            Nom de la dépense
          </label>
          <input
            id="budget-name"
            className="BudgetForm-Input"
            type="text"
            placeholder="Ex : Courses"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="BudgetForm-Field">
          <label className="BudgetForm-Label" htmlFor="budget-price">
            Prix (€)
          </label>
          <input
            id="budget-price"
            className="BudgetForm-Input"
            type="number"
            step="0.01"
            min="0"
            placeholder="Ex : 42.50"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>

        {error && (
          <p className="BudgetForm-Error" role="alert">
            {error}
          </p>
        )}

        <div className="BudgetForm-Actions">
          <button
            type="button"
            className="BudgetForm-ButtonCancel"
            onClick={onCancel}
          >
            Annuler
          </button>
          <button type="submit" className="BudgetForm-ButtonSubmit">
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

export default BudgetFormModal;

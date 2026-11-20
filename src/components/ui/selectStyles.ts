/**
 * Estilos compartidos para react-select.
 * selectStyles → paleta naranja (#F97316) para formularios de colaboradores.
 * amberSelectStyles → paleta ámbar (#f59e0b) para formularios de owner splits.
 * glassSelectStyles → modales en vidrio cálido; el menú se abre opaco en el
 * body, donde un desenfoque no tendría nada que desenfocar.
 */
export const selectStyles = {
  // Portado al body con z-index alto para que el menú no lo recorten los
  // contenedores con overflow del modal de splits.
  menuPortal: (base: Record<string, unknown>) => ({ ...base, zIndex: 10000 }),
  control: (base: Record<string, unknown>) => ({
    ...base,
    "border": "1px solid #e5e7eb",
    "borderRadius": "8px",
    "padding": "2px",
    "boxShadow": "none",
    "backgroundColor": "white",
    "&:hover": { border: "1px solid #F97316" },
    "&:focus-within": { border: "1px solid #F97316" },
  }),
  option: (
    base: Record<string, unknown>,
    { isSelected, isFocused }: { isSelected: boolean; isFocused: boolean },
  ) => ({
    ...base,
    backgroundColor: isSelected ? "#F97316" : isFocused ? "#fff7ed" : "white",
    color: isSelected ? "white" : "#374151",
    fontSize: "13px",
  }),
  multiValue: (base: Record<string, unknown>) => ({
    ...base,
    backgroundColor: "#fff7ed",
    borderRadius: "6px",
  }),
  multiValueLabel: (base: Record<string, unknown>) => ({
    ...base,
    color: "#c2410c",
    fontWeight: "500",
    fontSize: "12px",
  }),
  multiValueRemove: (base: Record<string, unknown>) => ({
    ...base,
    "color": "#c2410c",
    "&:hover": { backgroundColor: "#F97316", color: "white" },
  }),
  placeholder: (base: Record<string, unknown>) => ({
    ...base,
    fontSize: "13px",
    color: "#9ca3af",
  }),
};

export const amberSelectStyles = {
  menuPortal: (base: Record<string, unknown>) => ({ ...base, zIndex: 10000 }),
  control: (base: Record<string, unknown>) => ({
    ...base,
    "border": "1px solid #e5e7eb",
    "borderRadius": "12px",
    "padding": "4px",
    "boxShadow": "none",
    "&:hover": { border: "1px solid #f59e0b" },
    "&:focus-within": {
      border: "1px solid #f59e0b",
      boxShadow: "0 0 0 3px rgba(245,158,11,0.1)",
    },
  }),
  option: (
    base: Record<string, unknown>,
    { isSelected, isFocused }: { isSelected: boolean; isFocused: boolean },
  ) => ({
    ...base,
    backgroundColor: isSelected ? "#f59e0b" : isFocused ? "#fef3c7" : "white",
    color: isSelected ? "white" : "#374151",
  }),
  multiValue: (base: Record<string, unknown>) => ({
    ...base,
    backgroundColor: "#fef3c7",
    borderRadius: "8px",
  }),
  multiValueLabel: (base: Record<string, unknown>) => ({
    ...base,
    color: "#92400e",
    fontWeight: "500",
  }),
  multiValueRemove: (base: Record<string, unknown>) => ({
    ...base,
    "color": "#92400e",
    "&:hover": { backgroundColor: "#f59e0b", color: "white" },
  }),
};

/**
 * Selector de react-select sobre el vidrio. El menú va a `document.body` por
 * portal, fuera del panel: va opaco en el tono de la noche, no translúcido.
 */
export const glassSelectStyles = {
  menuPortal: (base: Record<string, unknown>) => ({ ...base, zIndex: 10000 }),
  control: (base: Record<string, unknown>) => ({
    ...base,
    "backgroundColor": "rgba(255, 255, 255, 0.06)",
    "border": "1px solid rgba(255, 255, 255, 0.14)",
    "borderRadius": "16px",
    "padding": "4px 6px",
    "boxShadow": "none",
    "fontSize": "12.5px",
    "&:hover": { border: "1px solid rgba(255, 255, 255, 0.24)" },
    "&:focus-within": { border: "1px solid #FF8A3D" },
  }),
  input: (base: Record<string, unknown>) => ({ ...base, color: "#FFFFFF" }),
  option: (
    base: Record<string, unknown>,
    { isSelected, isFocused }: { isSelected: boolean; isFocused: boolean },
  ) => ({
    ...base,
    backgroundColor: isSelected
      ? "#FF5C00"
      : isFocused
        ? "rgba(255, 255, 255, 0.06)"
        : "transparent",
    color: "#FFFFFF",
    fontSize: "12.5px",
  }),
  multiValue: (base: Record<string, unknown>) => ({
    ...base,
    backgroundColor: "rgba(255, 92, 0, 0.16)",
    borderRadius: "12px",
    padding: "1px 3px",
  }),
  multiValueLabel: (base: Record<string, unknown>) => ({
    ...base,
    color: "#FFB48A",
    fontSize: "11.5px",
    fontWeight: 600,
  }),
  multiValueRemove: (base: Record<string, unknown>) => ({
    ...base,
    "color": "#FF8A3D",
    "borderRadius": "12px",
    "&:hover": { backgroundColor: "#FF5C00", color: "white" },
  }),
  placeholder: (base: Record<string, unknown>) => ({
    ...base,
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: "12.5px",
  }),
  indicatorSeparator: (base: Record<string, unknown>) => ({
    ...base,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
  }),
  dropdownIndicator: (base: Record<string, unknown>) => ({ ...base, color: "rgba(255, 255, 255, 0.5)" }),
  clearIndicator: (base: Record<string, unknown>) => ({ ...base, color: "rgba(255, 255, 255, 0.5)" }),
  noOptionsMessage: (base: Record<string, unknown>) => ({ ...base, color: "rgba(255, 255, 255, 0.5)" }),
  loadingMessage: (base: Record<string, unknown>) => ({ ...base, color: "rgba(255, 255, 255, 0.5)" }),
  menu: (base: Record<string, unknown>) => ({
    ...base,
    backgroundColor: "#2B1E17",
    borderRadius: "16px",
    overflow: "hidden",
    border: "1px solid rgba(255, 255, 255, 0.14)",
    boxShadow: "0 20px 44px -12px rgba(0, 0, 0, 0.6)",
  }),
};

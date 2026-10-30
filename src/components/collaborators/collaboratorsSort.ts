/** Órdenes de la lista de colaboradores. El carrusel la recorre en el orden elegido. */
export type CollaboratorSortBy =
  | "pending_desc"
  | "paid_desc"
  | "songs_desc"
  | "name_asc";

export const SORT_LABELS: Record<CollaboratorSortBy, string> = {
  pending_desc: "Mayor saldo por pagar",
  paid_desc: "Más pagado",
  songs_desc: "Más canciones",
  name_asc: "Nombre (A–Z)",
};

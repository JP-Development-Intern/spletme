/* eslint-disable @typescript-eslint/no-explicit-any */
import LocalStorageService from "@/services/localstorage";
import { resolveIsOwner } from "@/utils/music.utils";

/**
 * Qué puede ver alguien que no es el dueño de la canción.
 *
 * Regla de producto: un colaborador o un sello NO ve la mecánica de reparto del
 * owner. No ve su split, ni su porcentaje, ni su monto, ni ninguna frase que
 * explique que el owner cobra primero y que el resto es el pool que se reparte.
 * Para quien no es el owner, el reparto empieza y termina en el pool.
 *
 * Por eso tampoco se le enseña el ingreso de la canción: si viera «neto $1.000»
 * junto a «tu split 100%» y un saldo de $800, la resta cuenta lo que la regla
 * quiere callar. Se omite el dato; nunca se sustituye por otro. Enseñar el pool
 * bajo la etiqueta «ingreso neto» sería darle una cifra falsa sobre el dinero
 * del que cobra, y eso no es ocultar: es mentir.
 *
 * Todo lo que se le muestra —su porcentaje, su monto, su alcance— es cierto.
 *
 * Este módulo es el único sitio donde se decide. Si mañana una vista nueva
 * necesita pintar algo del owner, que pregunte aquí y no reinvente el criterio.
 */

/** La sesión actual, tal y como la guarda el login. */
const currentUser = (): any => LocalStorageService.getItem("user");

/**
 * Si quien mira es el dueño de esta canción. Es la única puerta a los datos del
 * owner: su split, su porcentaje, su monto y el ingreso de la canción.
 */
export const viewerOwnsSong = (song: any, user: any = currentUser()): boolean =>
  resolveIsOwner(song, user);

/**
 * Lo contrario, con nombre propio para que se lea en el sitio donde se usa:
 * quien mira cobra del pool y no debe enterarse de que hay algo antes.
 */
export const viewerIsPoolMember = (song: any, user: any = currentUser()): boolean =>
  !viewerOwnsSong(song, user);

/**
 * El porcentaje que le toca a quien mira, sea cual sea su papel.
 *
 * `song.percetaje` ya viene calculado para quien pregunta —el backend lo saca
 * de su propio split, no del owner—, así que es la fuente buena y se respeta.
 * La búsqueda entre colaboradores queda como respaldo para las respuestas que
 * no traen ese campo. Devuelve `null` cuando quien mira no tiene split.
 */
export function viewerSplitPercentage(song: any, user: any = currentUser()): number | null {
  if (typeof song?.percetaje === "number") return song.percetaje;
  if (viewerOwnsSong(song, user)) return null;

  const ids = [user?.id, user?._id, user?.userId].filter(Boolean).map(String);
  const email = String(user?.email ?? "").trim().toLowerCase();
  const mine = (song?.collaborators ?? []).find((collaborator: any) => {
    const collaboratorIds = [collaborator?._id, collaborator?.id].filter(Boolean).map(String);
    if (collaboratorIds.some((value) => ids.includes(value))) return true;
    return email !== "" && String(collaborator?.email ?? "").trim().toLowerCase() === email;
  });

  const percentage = Number(mine?.split?.percentage ?? 0);
  return percentage > 0 ? percentage : null;
}

/**
 * Lo devengado por quien mira en esta canción. Es lo que la columna de ingresos
 * enseña cuando no puede enseñar el neto, que es dato del dueño.
 */
export function viewerAmount(song: any, user: any = currentUser()): number {
  if (viewerOwnsSong(song, user)) return Number(song?.ownerEarnings ?? 0) || 0;

  const ids = [user?.id, user?._id, user?.userId].filter(Boolean).map(String);
  const email = String(user?.email ?? "").trim().toLowerCase();
  const mine = (song?.collaborators ?? []).find((collaborator: any) => {
    const collaboratorIds = [collaborator?._id, collaborator?.id].filter(Boolean).map(String);
    if (collaboratorIds.some((value) => ids.includes(value))) return true;
    return email !== "" && String(collaborator?.email ?? "").trim().toLowerCase() === email;
  });

  return Number(mine?.amountOwed ?? 0) || 0;
}

/**
 * Si quien mira es el dueño de TODAS las canciones dadas. Un sello mezcla
 * canciones; el total a pagar solo se enseña cuando ninguna es de otro.
 */
export const viewerOwnsAllSongs = (songs: any[], user: any = currentUser()): boolean =>
  songs.length > 0 && songs.every((song) => viewerOwnsSong(song, user));

/**
 * Si quien mira es el titular de la cuenta (no una subcuenta). La lista de
 * sellos solo trae agregados, sin canciones, así que no se puede preguntar por
 * canción: se usa la misma regla de subcuentas de `resolveIsOwner`.
 */
export const viewerIsAccountOwner = (user: any = currentUser()): boolean =>
  Boolean(user) && !user?.parentUserId;

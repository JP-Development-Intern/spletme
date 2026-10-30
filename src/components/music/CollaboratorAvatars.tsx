import { avatarTextColor } from "@/utils/collaborators.utils";
import type { SongCollaborator } from "@/types/music.types";

interface CollaboratorAvatarsProps {
  collaborators?: SongCollaborator[];
  emptyLabel?: string;
}

/** Colores de la paleta de personas; el primero, brasa. Ver `utils/collaborators.utils.ts`. */
const TINTS = ["#FF5C00", "#2FB37E", "#7C5CFF"];

/** Iniciales (hasta 2) a partir del nombre. */
function getInitials(name?: string): string {
  if (!name) return "?";
  return (
    name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0] ?? "")
      .join("")
      .toUpperCase() || "?"
  );
}

/** Pila de avatares de colaboradores (máx. 3 + contador). */
export function CollaboratorAvatars({ collaborators, emptyLabel = "—" }: CollaboratorAvatarsProps) {
  const list = collaborators ?? [];
  if (list.length === 0) {
    return <span className="text-[12.5px] text-white/50">{emptyLabel}</span>;
  }
  const shown = list.slice(0, 3);
  const extra = list.length - shown.length;
  return (
    <div className="flex -space-x-2">
      {shown.map((c, idx) =>
        c.image ? (
          <img
            key={idx}
            src={c.image}
            alt={c.name}
            title={c.name}
            className="h-7 w-7 rounded-full border-2 border-[#2A1A12] object-cover"
          />
        ) : (
          <div
            key={idx}
            title={c.name}
            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#2A1A12]"
            style={{ backgroundColor: TINTS[idx % TINTS.length] }}
          >
            <span className="text-[10px] font-semibold" style={{ color: avatarTextColor(TINTS[idx % TINTS.length]) }}>
              {getInitials(c.name)}
            </span>
          </div>
        ),
      )}
      {extra > 0 && (
        <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#2A1A12] bg-[#3A2A22]">
          <span className="text-[10px] font-semibold text-white/80">+{extra}</span>
        </div>
      )}
    </div>
  );
}

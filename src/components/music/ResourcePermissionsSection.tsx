import { useCallback, useEffect, useState } from "react";
import { ShieldCheck, TriangleAlert, Users } from "lucide-react";
import { PermissionsService } from "@/services/permissions";
import { SwitchTile } from "@/components/music/PermissionsModal";
import type {
  PermissionGrantKey,
  PermissionGrantee,
  PermissionResourceType,
} from "@/types/permissions.types";

interface ResourcePermissionsSectionProps {
  resourceType: PermissionResourceType;
  resourceId: string;
  title?: string;
  subtitle?: string;
  emptyDescription?: string;
}

const VIEW_OPTIONS: { key: PermissionGrantKey; label: string }[] = [
  { key: "viewIncome", label: "Ver ingresos" },
  { key: "viewStreams", label: "Ver streams" },
  { key: "viewCollaborators", label: "Ver colaboradores" },
  { key: "viewDocuments", label: "Ver documentos" },
];

const LABEL_OPTIONS: { key: PermissionGrantKey; label: string }[] = [
  { key: "canEditSplits", label: "Editar splits" },
  { key: "canInviteCollaborators", label: "Invitar colaboradores" },
  { key: "canViewOwnerData", label: "Ver datos del owner" },
];

function getInitials(name: string, email: string) {
  const source = (name || email || "?").trim();
  const parts = source.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

/**
 * Apartado de permisos específico de un recurso (canción, álbum, sello o sello
 * personalizado) para el Owner, en glasmorfismo.
 */
export function ResourcePermissionsSection({
  resourceType,
  resourceId,
  title = "Permisos de acceso",
  subtitle = "Controla qué puede ver y editar cada colaborador o sello",
  emptyDescription = "Cuando invites y acepten participar aquí, podrás ajustar sus permisos.",
}: ResourcePermissionsSectionProps) {
  const [grantees, setGrantees] = useState<PermissionGrantee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPermissions = useCallback(async () => {
    if (!resourceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await PermissionsService.list(resourceType, resourceId);
      setGrantees(data);
    } catch {
      setError("No se pudieron cargar los permisos.");
    } finally {
      setLoading(false);
    }
  }, [resourceType, resourceId]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  const toggle = async (grantee: PermissionGrantee, key: PermissionGrantKey) => {
    const next = !grantee.grants[key];
    const updatedGrants = { ...grantee.grants, [key]: next };
    const previousExplicit = grantee.explicit ? { ...grantee.explicit } : undefined;

    const apply = (value: boolean, explicitOverride?: typeof previousExplicit) =>
      setGrantees((current) =>
        current.map((g) => {
          if (g.userId !== grantee.userId) return g;
          return {
            ...g,
            grants: { ...g.grants, [key]: value },
            ...(g.explicit
              ? { explicit: explicitOverride ?? { ...g.explicit, [key]: value } }
              : {}),
          };
        }),
      );

    setError(null);
    apply(next);
    try {
      await PermissionsService.set(resourceType, resourceId, grantee.userId, updatedGrants);
    } catch {
      apply(!next, previousExplicit);
      setError("No se pudo guardar el cambio de permiso.");
    }
  };

  return (
    <section className="glass overflow-hidden rounded-[28px]">
      <header className="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[13px] bg-[#FF5C00]/[0.16] text-[#FF8A3D]">
            <ShieldCheck className="h-[18px] w-[18px]" />
          </span>
          <div className="flex flex-col gap-0.5">
            <h3 className="font-display text-[19px] font-medium tracking-[-0.005em] text-white">
              {title}
            </h3>
            <p className="text-[12.5px] text-white/65">{subtitle}</p>
          </div>
        </div>
      </header>

      <div className="h-px bg-white/[0.09]" />

      <div className="p-6">
        {error && (
          <div
            role="alert"
            className="mb-4 flex items-center gap-2.5 rounded-[14px] border border-[#E5484D]/30 bg-[#E5484D]/[0.14] px-3.5 py-2.5 text-[12px] font-medium text-[#FF8F92]"
          >
            <TriangleAlert className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-[172px] animate-pulse rounded-[20px] bg-white/[0.06]" />
            ))}
          </div>
        ) : grantees.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-[20px] border border-white/[0.09] bg-white/[0.03] px-6 py-10 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-white/[0.08] text-white/60">
              <Users className="h-5 w-5" />
            </span>
            <p className="text-[13.5px] font-semibold text-white">
              Sin colaboradores ni sellos todavía
            </p>
            <p className="max-w-[360px] text-[12px] text-white/55">{emptyDescription}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {grantees.map((grantee) => {
              const isLabel = grantee.role === "label";
              return (
                <article
                  key={grantee.userId}
                  className="flex flex-col gap-3.5 rounded-[20px] border border-white/[0.09] bg-white/[0.04] p-4"
                >
                  <header className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[12px] font-display text-[12px] font-semibold ${
                          isLabel
                            ? "bg-[#FF5C00]/[0.16] text-[#FF8A3D]"
                            : "border border-white/[0.12] bg-white/[0.08] text-white"
                        }`}
                      >
                        {getInitials(grantee.name, grantee.email)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-white">
                          {grantee.name}
                        </p>
                        <p className="truncate text-[11px] text-white/55">{grantee.email}</p>
                      </div>
                    </div>
                    <span
                      className={`flex-shrink-0 rounded-full px-2.5 py-1 font-mono text-[9.5px] font-semibold tracking-[1.1px] ${
                        isLabel
                          ? "bg-[#FF5C00]/[0.16] text-[#FF9A5C]"
                          : "border border-white/[0.12] bg-white/[0.06] text-white/70"
                      }`}
                    >
                      {isLabel ? "SELLO" : "COLABORADOR"}
                    </span>
                  </header>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {VIEW_OPTIONS.map(({ key, label }) => (
                      <SwitchTile
                        key={key}
                        label={label}
                        checked={Boolean(grantee.grants[key])}
                        inherited={
                          grantee.explicit ? grantee.explicit[key] === undefined : undefined
                        }
                        onChange={() => toggle(grantee, key)}
                      />
                    ))}
                    {isLabel &&
                      LABEL_OPTIONS.map(({ key, label }) => (
                        <SwitchTile
                          key={key}
                          label={label}
                          checked={Boolean(grantee.grants[key])}
                          inherited={
                            grantee.explicit ? grantee.explicit[key] === undefined : undefined
                          }
                          onChange={() => toggle(grantee, key)}
                        />
                      ))}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

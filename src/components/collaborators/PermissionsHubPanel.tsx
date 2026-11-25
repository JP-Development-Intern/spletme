import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Disc3,
  Globe,
  Layers,
  Music,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Tag,
  TriangleAlert,
  Users,
} from "lucide-react";
import { PermissionsService } from "@/services/permissions";
import SongService from "@/services/songs";
import AlbumService from "@/services/albums";
import LabelsService, { type CustomLabel, type Label } from "@/services/labels";
import { PermissionsModal, SwitchTile } from "@/components/music/PermissionsModal";
import { PermissionsDefaultsModal } from "@/components/music/PermissionsDefaultsModal";
import type {
  PermissionGrantKey,
  PermissionGrantee,
  PermissionResourceType,
} from "@/types/permissions.types";

type HubScope = "global" | "songs" | "albums" | "labels";

interface SongRowItem {
  _id: string;
  trackTitle: string;
  artistName?: string;
  isrc?: string;
  spotifyData?: { album?: { images?: Array<{ url?: string }> } };
}

interface AlbumRowItem {
  _id?: string;
  upc: string;
  albumTitle: string;
  artistName?: string;
  totalTracks?: number;
  image?: string;
  coverImage?: Array<Array<{ url?: string }>>;
}

interface ModalTarget {
  resourceType: PermissionResourceType;
  resourceId: string;
  title: string;
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

const SCOPES: { key: HubScope; label: string; icon: React.ReactNode }[] = [
  { key: "global", label: "Globales", icon: <Globe className="h-3.5 w-3.5" /> },
  { key: "songs", label: "Canciones", icon: <Music className="h-3.5 w-3.5" /> },
  { key: "albums", label: "Álbumes", icon: <Disc3 className="h-3.5 w-3.5" /> },
  { key: "labels", label: "Sellos", icon: <Tag className="h-3.5 w-3.5" /> },
];

function getInitials(name: string, email: string) {
  const source = (name || email || "?").trim();
  const parts = source.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

/**
 * Apartado especial del Owner dentro de Colaboradores para gestionar permisos
 * globales (todo el catálogo) e individuales por canción, álbum o sello.
 */
export function PermissionsHubPanel() {
  const [scope, setScope] = useState<HubScope>("global");
  const [search, setSearch] = useState("");
  const [modalTarget, setModalTarget] = useState<ModalTarget | null>(null);
  const [defaultsOpen, setDefaultsOpen] = useState(false);

  // Globales
  const [grantees, setGrantees] = useState<PermissionGrantee[]>([]);
  const [globalLoading, setGlobalLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Canciones
  const [songs, setSongs] = useState<SongRowItem[]>([]);
  const [songsPage, setSongsPage] = useState(1);
  const [songsTotalPages, setSongsTotalPages] = useState(1);
  const [songsLoading, setSongsLoading] = useState(false);

  // Álbumes
  const [albums, setAlbums] = useState<AlbumRowItem[]>([]);
  const [albumsPage, setAlbumsPage] = useState(1);
  const [albumsTotalPages, setAlbumsTotalPages] = useState(1);
  const [albumsLoading, setAlbumsLoading] = useState(false);

  // Sellos
  const [artisticLabels, setArtisticLabels] = useState<Label[]>([]);
  const [customLabels, setCustomLabels] = useState<CustomLabel[]>([]);
  const [labelsLoading, setLabelsLoading] = useState(false);

  const loadGlobals = useCallback(async () => {
    setGlobalLoading(true);
    setGlobalError(null);
    try {
      const data = await PermissionsService.list("all", "*");
      setGrantees(data);
    } catch {
      setGlobalError("No se pudieron cargar los permisos globales.");
    } finally {
      setGlobalLoading(false);
    }
  }, []);

  useEffect(() => {
    if (scope === "global") loadGlobals();
  }, [scope, loadGlobals]);

  useEffect(() => {
    if (scope !== "songs") return;
    let cancelled = false;
    setSongsLoading(true);
    SongService.getSongs({ page: songsPage, limit: 15, q: search.trim() || undefined })
      .then((res) => {
        if (cancelled || !res?.data) return;
        setSongs((res.data.songs ?? []) as SongRowItem[]);
        setSongsTotalPages(Math.max(1, res.data.pagination?.totalPages ?? 1));
      })
      .finally(() => !cancelled && setSongsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [scope, songsPage, search]);

  useEffect(() => {
    if (scope !== "albums") return;
    let cancelled = false;
    setAlbumsLoading(true);
    AlbumService.getAlbums({
      skip: (albumsPage - 1) * 15,
      limit: 15,
      search: search.trim() || undefined,
    })
      .then((res) => {
        if (cancelled || !res.success || !("data" in res)) return;
        const list = Array.isArray(res.data) ? res.data : [];
        setAlbums(list as unknown as AlbumRowItem[]);
        const total = res.pagination?.total ?? list.length;
        setAlbumsTotalPages(Math.max(1, Math.ceil(total / 15)));
      })
      .finally(() => !cancelled && setAlbumsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [scope, albumsPage, search]);

  useEffect(() => {
    if (scope !== "labels") return;
    let cancelled = false;
    setLabelsLoading(true);
    Promise.all([LabelsService.getLabels(), LabelsService.getCustomLabels()])
      .then(([artisticRes, customRes]) => {
        if (cancelled) return;
        setArtisticLabels(artisticRes.data ?? []);
        setCustomLabels(customRes.data ?? []);
      })
      .finally(() => !cancelled && setLabelsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [scope]);

  const handleGlobalToggle = async (grantee: PermissionGrantee, key: PermissionGrantKey) => {
    const next = !grantee.grants[key];
    const updatedGrants = { ...grantee.grants, [key]: next };
    const apply = (value: boolean) =>
      setGrantees((current) =>
        current.map((g) =>
          g.userId === grantee.userId ? { ...g, grants: { ...g.grants, [key]: value } } : g,
        ),
      );
    setGlobalError(null);
    apply(next);
    try {
      await PermissionsService.set("all", "*", grantee.userId, updatedGrants);
    } catch {
      apply(!next);
      setGlobalError("No se pudo guardar el cambio global.");
    }
  };

  const filteredGrantees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return grantees;
    return grantees.filter(
      (g) => g.name?.toLowerCase().includes(q) || g.email?.toLowerCase().includes(q),
    );
  }, [grantees, search]);

  const filteredLabels = useMemo(() => {
    const q = search.trim().toLowerCase();
    const artistic = artisticLabels.filter((l) => l.label && l.label.toLowerCase().includes(q));
    const custom = customLabels.filter((l) => l.name?.toLowerCase().includes(q));
    return { artistic, custom };
  }, [artisticLabels, customLabels, search]);

  return (
    <>
      <section className="glass flex flex-col gap-5 rounded-[28px] p-5 sm:p-6">
        {/* Cabecera del centro de permisos */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[14px] bg-[#FF5C00]/[0.16] text-[#FF8A3D]">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div className="flex flex-col gap-0.5">
              <h2 className="font-display text-[19px] font-medium tracking-[-0.005em] text-white">
                Centro de permisos
              </h2>
              <p className="text-[12.5px] text-white/65">
                Controla qué puede ver y editar cada colaborador o sello en todo tu catálogo o por recurso.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setModalTarget({
                  resourceType: "all",
                  resourceId: "*",
                  title: "Permisos globales (todo tu catálogo)",
                })
              }
              className="glass-control flex items-center gap-2 rounded-full px-4 py-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-white/[0.14]"
            >
              <Globe className="h-3.5 w-3.5 text-[#FF8A3D]" />
              Editar todo el catálogo
            </button>
            <button
              type="button"
              onClick={() => setDefaultsOpen(true)}
              className="glass-control flex items-center gap-2 rounded-full px-4 py-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-white/[0.14]"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-white/75" />
              Plantilla por defecto
            </button>
          </div>
        </div>

        {/* Selector de ámbito + buscador */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="Ámbito de permisos"
            className="flex flex-wrap items-center gap-1 rounded-full bg-black/[0.22] p-1"
          >
            {SCOPES.map((item) => {
              const active = scope === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setScope(item.key);
                    setSongsPage(1);
                    setAlbumsPage(1);
                  }}
                  className={`flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[12px] transition-colors ${
                    active
                      ? "bg-[#F7EDE6]/[0.92] font-semibold text-[#1C1D22]"
                      : "font-medium text-white/70 hover:text-white"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </div>

          <label className="glass-control relative flex w-full items-center gap-2.5 rounded-full px-4 py-2.5 focus-within:ring-2 focus-within:ring-[#FF5C00]/70 sm:w-[280px]">
            <Search className="h-3.5 w-3.5 flex-shrink-0 text-white/50" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSongsPage(1);
                setAlbumsPage(1);
              }}
              placeholder={
                scope === "global"
                  ? "Filtrar persona o sello…"
                  : scope === "songs"
                    ? "Buscar canción…"
                    : scope === "albums"
                      ? "Buscar álbum…"
                      : "Buscar sello…"
              }
              className="w-full border-none bg-transparent p-0 text-[12.5px] text-white placeholder:text-white/50 focus:outline-none focus:ring-0"
            />
          </label>
        </div>

        <div className="h-px bg-white/[0.09]" />

        {/* Contenido según el ámbito */}
        {scope === "global" && (
          <div className="flex flex-col gap-3.5">
            {globalError && (
              <div
                role="alert"
                className="flex items-center gap-2.5 rounded-[14px] border border-[#E5484D]/30 bg-[#E5484D]/[0.14] px-3.5 py-2.5 text-[12px] font-medium text-[#FF8F92]"
              >
                <TriangleAlert className="h-4 w-4 flex-shrink-0" />
                <span>{globalError}</span>
              </div>
            )}

            {globalLoading ? (
              <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
                {[0, 1].map((i) => (
                  <div key={i} className="h-[180px] animate-pulse rounded-[20px] bg-white/[0.06]" />
                ))}
              </div>
            ) : filteredGrantees.length === 0 ? (
              <EmptyScope
                title="Sin colaboradores ni sellos"
                description="Cuando invites personas o sellos a tu catálogo, podrás gestionar sus permisos globales desde aquí."
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {filteredGrantees.map((grantee) => {
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
                            onChange={() => handleGlobalToggle(grantee, key)}
                          />
                        ))}
                        {isLabel &&
                          LABEL_OPTIONS.map(({ key, label }) => (
                            <SwitchTile
                              key={key}
                              label={label}
                              checked={Boolean(grantee.grants[key])}
                              onChange={() => handleGlobalToggle(grantee, key)}
                            />
                          ))}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {scope === "songs" && (
          <div className="flex flex-col gap-3">
            {songsLoading ? (
              <ListSkeleton />
            ) : songs.length === 0 ? (
              <EmptyScope
                title="No hay canciones que mostrar"
                description="Prueba con otro término de búsqueda."
              />
            ) : (
              <>
                <div className="flex flex-col divide-y divide-white/[0.08] overflow-hidden rounded-[20px] border border-white/[0.09] bg-white/[0.03]">
                  {songs.map((song) => {
                    const cover = song.spotifyData?.album?.images?.[0]?.url;
                    return (
                      <div
                        key={song._id}
                        className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-white/[0.04]"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/[0.08]">
                            {cover ? (
                              <img src={cover} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <Music className="h-4 w-4 text-white/45" />
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold text-white">
                              {song.trackTitle}
                            </p>
                            <p className="truncate text-[11px] text-white/55">
                              {song.artistName || "—"}
                              {song.isrc ? ` · ${song.isrc}` : ""}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setModalTarget({
                              resourceType: "song",
                              resourceId: song._id,
                              title: song.trackTitle,
                            })
                          }
                          className="glass-control flex flex-shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold text-white transition-colors hover:bg-white/[0.14]"
                        >
                          <ShieldCheck className="h-3.5 w-3.5 text-[#FF8A3D]" />
                          Permisos
                        </button>
                      </div>
                    );
                  })}
                </div>
                <Pager
                  page={songsPage}
                  totalPages={songsTotalPages}
                  onPrev={() => setSongsPage((p) => Math.max(1, p - 1))}
                  onNext={() => setSongsPage((p) => Math.min(songsTotalPages, p + 1))}
                />
              </>
            )}
          </div>
        )}

        {scope === "albums" && (
          <div className="flex flex-col gap-3">
            {albumsLoading ? (
              <ListSkeleton />
            ) : albums.length === 0 ? (
              <EmptyScope
                title="No hay álbumes que mostrar"
                description="Prueba con otro término de búsqueda."
              />
            ) : (
              <>
                <div className="flex flex-col divide-y divide-white/[0.08] overflow-hidden rounded-[20px] border border-white/[0.09] bg-white/[0.03]">
                  {albums.map((album) => {
                    const cover = album.image ?? album.coverImage?.[0]?.[0]?.url;
                    return (
                      <div
                        key={album.upc || album._id}
                        className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-white/[0.04]"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/[0.08]">
                            {cover ? (
                              <img src={cover} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <Disc3 className="h-4 w-4 text-white/45" />
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold text-white">
                              {album.albumTitle}
                            </p>
                            <p className="truncate text-[11px] text-white/55">
                              {album.artistName || "—"}
                              {album.upc ? ` · UPC ${album.upc}` : ""}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setModalTarget({
                              resourceType: "album",
                              resourceId: album.upc,
                              title: album.albumTitle,
                            })
                          }
                          className="glass-control flex flex-shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold text-white transition-colors hover:bg-white/[0.14]"
                        >
                          <ShieldCheck className="h-3.5 w-3.5 text-[#FF8A3D]" />
                          Permisos
                        </button>
                      </div>
                    );
                  })}
                </div>
                <Pager
                  page={albumsPage}
                  totalPages={albumsTotalPages}
                  onPrev={() => setAlbumsPage((p) => Math.max(1, p - 1))}
                  onNext={() => setAlbumsPage((p) => Math.min(albumsTotalPages, p + 1))}
                />
              </>
            )}
          </div>
        )}

        {scope === "labels" && (
          <div className="flex flex-col gap-4">
            {labelsLoading ? (
              <ListSkeleton />
            ) : filteredLabels.custom.length === 0 && filteredLabels.artistic.length === 0 ? (
              <EmptyScope
                title="No hay sellos que mostrar"
                description="Prueba con otro término de búsqueda."
              />
            ) : (
              <div className="flex flex-col divide-y divide-white/[0.08] overflow-hidden rounded-[20px] border border-white/[0.09] bg-white/[0.03]">
                {filteredLabels.custom.map((label) => (
                  <div
                    key={`custom-${label._id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-white/[0.04]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#FF5C00] text-white">
                        <Layers className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-white">{label.name}</p>
                        <p className="truncate text-[11px] text-white/55">
                          Sello personalizado · {label.stats?.totalSongs ?? 0} canciones
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setModalTarget({
                          resourceType: "customLabel",
                          resourceId: label._id,
                          title: label.name,
                        })
                      }
                      className="glass-control flex flex-shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold text-white transition-colors hover:bg-white/[0.14]"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-[#FF8A3D]" />
                      Permisos
                    </button>
                  </div>
                ))}

                {filteredLabels.artistic.map((label) => (
                  <div
                    key={`artistic-${label._id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-white/[0.04]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#FF5C00]/[0.16] text-[#FF8A3D]">
                        <Tag className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-white">{label.label}</p>
                        <p className="truncate text-[11px] text-white/55">
                          Sello artístico · {label.count} canciones
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setModalTarget({
                          resourceType: "label",
                          resourceId: label.label,
                          title: label.label,
                        })
                      }
                      className="glass-control flex flex-shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold text-white transition-colors hover:bg-white/[0.14]"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-[#FF8A3D]" />
                      Permisos
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {modalTarget && (
        <PermissionsModal
          resourceType={modalTarget.resourceType}
          resourceId={modalTarget.resourceId}
          title={modalTarget.title}
          onClose={() => {
            setModalTarget(null);
            if (scope === "global") loadGlobals();
          }}
        />
      )}

      {defaultsOpen && <PermissionsDefaultsModal onClose={() => setDefaultsOpen(false)} />}
    </>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-[62px] animate-pulse rounded-[16px] bg-white/[0.06]" />
      ))}
    </div>
  );
}

function EmptyScope({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[20px] border border-white/[0.09] bg-white/[0.03] px-6 py-10 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-white/[0.08] text-white/60">
        <Users className="h-5 w-5" />
      </span>
      <p className="text-[13.5px] font-semibold text-white">{title}</p>
      <p className="max-w-[360px] text-[12px] text-white/55">{description}</p>
    </div>
  );
}

function Pager({
  page,
  totalPages,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-end gap-2 pt-1">
      <button
        type="button"
        onClick={onPrev}
        disabled={page <= 1}
        className="glass-control rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold text-white transition-colors hover:bg-white/[0.12] disabled:opacity-40"
      >
        Anterior
      </button>
      <span className="font-mono text-[11.5px] text-white/65">
        {page} / {totalPages}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={page >= totalPages}
        className="glass-control rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold text-white transition-colors hover:bg-white/[0.12] disabled:opacity-40"
      >
        Siguiente
      </button>
    </div>
  );
}

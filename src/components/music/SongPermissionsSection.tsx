import { ResourcePermissionsSection } from "@/components/music/ResourcePermissionsSection";

interface SongPermissionsSectionProps {
  songId: string;
  songTitle?: string;
}

export function SongPermissionsSection({ songId, songTitle }: SongPermissionsSectionProps) {
  return (
    <ResourcePermissionsSection
      resourceType="song"
      resourceId={songId}
      title="Permisos de esta canción"
      subtitle={
        songTitle
          ? `Controla qué ve y hace cada participante en «${songTitle}»`
          : "Controla qué puede ver y editar cada colaborador o sello en esta canción"
      }
      emptyDescription="Cuando invites y acepten participar en esta canción, podrás ajustar sus permisos aquí."
    />
  );
}

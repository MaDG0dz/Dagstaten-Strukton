"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import {
  FolderOpen,
  Upload,
  Trash2,
  ImageIcon,
  ChevronDown,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { compressPhoto } from "@/lib/utils/photo-compress";
import { useSubprojects } from "@/lib/hooks/use-projects";
import {
  useDagstaatPhotos,
  useInsertPhoto,
  useUpdatePhoto,
  useDeletePhoto,
  type DagstaatPhoto,
} from "@/lib/hooks/use-dagstaat";

interface TabFotosProps {
  dagstaatId: string;
  projectId: string;
  date: string;
  isReadOnly: boolean;
  userId: string;
}

/* ── Photo Thumbnail ─────────────────────────────────────────── */

function PhotoThumb({
  photo,
  isReadOnly,
  onUpdateCaption,
  onDelete,
}: {
  photo: DagstaatPhoto;
  isReadOnly: boolean;
  onUpdateCaption: (id: string, caption: string) => void;
  onDelete: (id: string, storagePath: string) => void;
}) {
  const [caption, setCaption] = useState(photo.caption ?? "");
  const supabase = createClient();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const { data } = supabase.storage
    .from("dagstaat-photos")
    .getPublicUrl(photo.storage_path);
  const publicUrl = data?.publicUrl ?? "";

  const saveCaption = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onUpdateCaption(photo.id, caption);
    }, 500);
  }, [caption, onUpdateCaption, photo.id]);

  return (
    <div className="group relative">
      <div className="relative h-20 w-20 overflow-hidden rounded-lg bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={publicUrl}
          alt={photo.file_name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        {!isReadOnly && (
          <button
            onClick={() => onDelete(photo.id, photo.storage_path)}
            className="absolute right-1 top-1 hidden rounded-full bg-black/60 p-1 text-white transition-colors hover:bg-red-600 group-hover:block"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
      {!isReadOnly ? (
        <input
          type="text"
          className="mt-1 w-20 truncate rounded border border-transparent bg-transparent px-0.5 text-[10px] text-slate-500 placeholder:text-slate-300 focus:border-slate-200 focus:outline-none"
          placeholder="Bijschrift"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          onBlur={saveCaption}
        />
      ) : (
        caption && (
          <p className="mt-1 w-20 truncate text-[10px] text-slate-500">
            {caption}
          </p>
        )
      )}
    </div>
  );
}

/* ── Upload Button ───────────────────────────────────────────── */

function UploadButton({
  label,
  uploading,
  onFiles,
}: {
  label: string;
  uploading: boolean;
  onFiles: (files: FileList) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onFiles(e.target.files);
            e.target.value = "";
          }
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
      >
        {uploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Upload className="h-3.5 w-3.5" />
        )}
        {label}
      </button>
    </>
  );
}

/* ── Photo Section Card ──────────────────────────────────────── */

function PhotoSection({
  title,
  description,
  photos,
  isReadOnly,
  uploading,
  onUpload,
  onUpdateCaption,
  onDelete,
}: {
  title: string;
  description?: string;
  photos: DagstaatPhoto[];
  isReadOnly: boolean;
  uploading: boolean;
  onUpload: (files: FileList) => void;
  onUpdateCaption: (id: string, caption: string) => void;
  onDelete: (id: string, storagePath: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2"
        >
          <FolderOpen className="h-5 w-5 text-slate-400" />
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {photos.length}
              </span>
            </div>
            {description && (
              <p className="text-xs text-slate-400">{description}</p>
            )}
          </div>
          {expanded ? (
            <ChevronDown className="ml-1 h-4 w-4 text-slate-400" />
          ) : (
            <ChevronRight className="ml-1 h-4 w-4 text-slate-400" />
          )}
        </button>

        {!isReadOnly && (
          <UploadButton
            label="Uploaden"
            uploading={uploading}
            onFiles={onUpload}
          />
        )}
      </div>

      {expanded && (
        <div className="mt-3">
          {photos.length === 0 ? (
            <div className="flex flex-col items-center rounded-lg border border-dashed border-slate-300 py-6">
              <ImageIcon className="mb-2 h-8 w-8 text-slate-300" />
              <p className="text-xs text-slate-400">Geen foto&apos;s.</p>
              {!isReadOnly && (
                <p className="mt-1 text-[10px] text-slate-400">
                  Klik op &quot;Uploaden&quot; om foto&apos;s toe te voegen.
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {photos.map((photo) => (
                <PhotoThumb
                  key={photo.id}
                  photo={photo}
                  isReadOnly={isReadOnly}
                  onUpdateCaption={onUpdateCaption}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── TabFotos ────────────────────────────────────────────────── */

export function TabFotos({
  dagstaatId,
  projectId,
  date,
  isReadOnly,
  userId,
}: TabFotosProps) {
  const { data: photos = [], isLoading } = useDagstaatPhotos(dagstaatId);
  const { data: subprojects = [] } = useSubprojects(projectId);
  const insertPhoto = useInsertPhoto();
  const updatePhoto = useUpdatePhoto();
  const deletePhoto = useDeletePhoto();

  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);

  // Group photos by subproject
  const hoofdprojectPhotos = photos.filter((p) => !p.subproject_id);
  const photosBySubproject = useMemo(() => {
    const map = new Map<string, DagstaatPhoto[]>();
    for (const sp of subprojects) {
      map.set(
        sp.id,
        photos.filter((p) => p.subproject_id === sp.id)
      );
    }
    return map;
  }, [photos, subprojects]);

  const handleUpload = useCallback(
    async (files: FileList, subprojectId: string | null) => {
      const target = subprojectId ?? "__hoofd__";
      setUploadingTarget(target);

      try {
        const supabase = createClient();

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (!file.type.startsWith("image/")) continue;

          // Compress
          const compressed = await compressPhoto(file);

          // Generate path
          const uuid = crypto.randomUUID();
          const storagePath = `${projectId}/${date}/${uuid}.jpg`;

          // Upload to storage
          const { error: uploadError } = await supabase.storage
            .from("dagstaat-photos")
            .upload(storagePath, compressed, {
              contentType: "image/jpeg",
              upsert: false,
            });

          if (uploadError) {
            console.error("Upload failed:", uploadError);
            continue;
          }

          // Save metadata
          insertPhoto.mutate({
            dagstaat_id: dagstaatId,
            subproject_id: subprojectId,
            storage_path: storagePath,
            file_name: file.name,
            file_size: compressed.size,
            caption: null,
            uploaded_by: userId,
          } as Parameters<typeof insertPhoto.mutate>[0]);
        }
      } catch (err) {
        console.error("Upload error:", err);
      } finally {
        setUploadingTarget(null);
      }
    },
    [dagstaatId, projectId, date, userId, insertPhoto]
  );

  const handleUpdateCaption = useCallback(
    (id: string, caption: string) => {
      updatePhoto.mutate({
        id,
        caption: caption || null,
      } as Parameters<typeof updatePhoto.mutate>[0]);
    },
    [updatePhoto]
  );

  const handleDelete = useCallback(
    async (id: string, storagePath: string) => {
      try {
        const supabase = createClient();
        // Delete from storage
        await supabase.storage.from("dagstaat-photos").remove([storagePath]);
        // Delete metadata
        deletePhoto.mutate(id);
      } catch (err) {
        console.error("Delete failed:", err);
      }
    },
    [deletePhoto]
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-xl bg-slate-100"
          />
        ))}
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold text-slate-900">Foto&apos;s</h2>

      {/* Hoofdproject photos */}
      <PhotoSection
        title="Hoofdproject fotomap"
        description={`Wordt opgeslagen als: ${date}`}
        photos={hoofdprojectPhotos}
        isReadOnly={isReadOnly}
        uploading={uploadingTarget === "__hoofd__"}
        onUpload={(files) => handleUpload(files, null)}
        onUpdateCaption={handleUpdateCaption}
        onDelete={handleDelete}
      />

      {/* Deelproject sections */}
      {subprojects.map((sp) => {
        const spPhotos = photosBySubproject.get(sp.id) ?? [];
        return (
          <PhotoSection
            key={sp.id}
            title={`${sp.code} — ${sp.name}`}
            photos={spPhotos}
            isReadOnly={isReadOnly}
            uploading={uploadingTarget === sp.id}
            onUpload={(files) => handleUpload(files, sp.id)}
            onUpdateCaption={handleUpdateCaption}
            onDelete={handleDelete}
          />
        );
      })}

      {/* Empty state when no subprojects and no photos */}
      {subprojects.length === 0 && photos.length === 0 && (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10">
          <ImageIcon className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-400">
            Nog geen foto&apos;s toegevoegd.
          </p>
        </div>
      )}
    </section>
  );
}

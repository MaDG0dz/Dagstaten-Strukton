"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  useDagstaatNotes,
  useInsertNote,
  useUpdateNote,
  type DagstaatNote,
} from "@/lib/hooks/use-dagstaat";

interface TabNotesProps {
  dagstaatId: string;
  isReadOnly: boolean;
  isManager: boolean;
  userId: string;
}

function NoteEditor({
  title,
  note,
  dagstaatId,
  isPrivate,
  isReadOnly,
  userId,
  onSaved,
}: {
  title: string;
  note: DagstaatNote | undefined;
  dagstaatId: string;
  isPrivate: boolean;
  isReadOnly: boolean;
  userId: string;
  onSaved: () => void;
}) {
  const [content, setContent] = useState(note?.content ?? "");
  const insertNote = useInsertNote();
  const updateNote = useUpdateNote();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Sync when note data loads
  useEffect(() => {
    if (note?.content !== undefined) {
      setContent(note.content);
    }
  }, [note?.content]);

  const save = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (note) {
        // Update existing
        if (content !== note.content) {
          updateNote.mutate(
            { id: note.id, content } as Parameters<typeof updateNote.mutate>[0],
            { onSuccess: onSaved }
          );
        }
      } else if (content.trim()) {
        // Create new
        insertNote.mutate(
          {
            dagstaat_id: dagstaatId,
            content,
            is_private: isPrivate,
            created_by: userId,
          } as Parameters<typeof insertNote.mutate>[0],
          { onSuccess: onSaved }
        );
      }
    }, 500);
  }, [content, note, dagstaatId, isPrivate, userId, insertNote, updateNote, onSaved]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {isPrivate && (
          <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-600">
            Intern
          </span>
        )}
      </div>
      <p className="mb-3 text-xs text-slate-400">
        {isPrivate
          ? "Alleen zichtbaar voor uitvoerders en beheerders."
          : "Verschijnt op de dagstaat PDF."}
      </p>
      <textarea
        rows={5}
        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#e43122] focus:outline-none focus:ring-2 focus:ring-[#e43122]/20 disabled:bg-slate-50 disabled:text-slate-500"
        placeholder={
          isPrivate
            ? "Interne notities schrijven..."
            : "Openbare notities schrijven..."
        }
        value={content}
        disabled={isReadOnly}
        onChange={(e) => setContent(e.target.value)}
        onBlur={save}
      />
    </div>
  );
}

export function TabNotes({
  dagstaatId,
  isReadOnly,
  isManager,
  userId,
}: TabNotesProps) {
  const { data: notes = [], isLoading, refetch } = useDagstaatNotes(dagstaatId);

  const publicNote = notes.find((n) => !n.is_private);
  const privateNote = notes.find((n) => n.is_private);

  const handleSaved = useCallback(() => {
    refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Public notes - visible to everyone */}
      <NoteEditor
        title="Openbare notities"
        note={publicNote}
        dagstaatId={dagstaatId}
        isPrivate={false}
        isReadOnly={isReadOnly}
        userId={userId}
        onSaved={handleSaved}
      />

      {/* Private notes - only for managers */}
      {isManager && (
        <NoteEditor
          title="Interne notities"
          note={privateNote}
          dagstaatId={dagstaatId}
          isPrivate={true}
          isReadOnly={isReadOnly}
          userId={userId}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

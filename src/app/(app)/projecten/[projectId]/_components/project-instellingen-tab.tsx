"use client";

import { TemplatesSection } from "./templates-section";
import { ActivitiesSection } from "./activities-section";

interface ProjectInstellingenTabProps {
  projectId: string;
}

export function ProjectInstellingenTab({ projectId }: ProjectInstellingenTabProps) {
  return (
    <div className="space-y-8">
      <TemplatesSection projectId={projectId} />
      <ActivitiesSection projectId={projectId} />
    </div>
  );
}

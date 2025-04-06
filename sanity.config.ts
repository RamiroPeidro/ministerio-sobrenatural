"use client";

/**
 * This configuration is used to for the Sanity Studio that's mounted on the `/app/studio/[[...tool]]/page.tsx` route
 */

import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";

// Go to https://www.sanity.io/docs/api-versioning to learn how API versioning works
import { apiVersion, dataset, projectId } from "./sanity/env";
import { schema } from "./sanity/schemaTypes";
import { structure } from "./sanity/structure";
import { presentationTool } from "sanity/presentation";
import { attendanceExport } from "./sanity/plugins/attendance-export";
import { meetingsDashboard } from "./sanity/plugins/meetings-dashboard";

export default defineConfig({
  basePath: "/studio",
  projectId,
  dataset,
  // Add and edit the content schema in the './sanity/schemaTypes' folder
  schema,
  plugins: [
    structureTool({ structure }),
    // Vision is for querying with GROQ from inside the Studio
    // https://www.sanity.io/docs/the-vision-plugin
    visionTool({ defaultApiVersion: apiVersion }),
    presentationTool({
      previewUrl: {
        previewMode: {
          enable: "/api/draft-mode/enable",
        },
      },
    }),
    // Plugin personalizado para exportar asistencia
    attendanceExport(),
    // Dashboard para gestión de clases y reuniones
    meetingsDashboard(),
  ],
  beta: {
    create: {
      startInCreateEnabled: true,
      fallbackStudioOrigin: "lms-papafam.sanity.studio",
    },
  },
});

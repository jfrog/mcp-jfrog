import { z } from "zod";

export const JFrogWorkerReadinessSchema = z.object({
  code: z.string(),
});

export const WorkersList = z.object({
  workers: z.array(
    z.object({
      key: z.string(),
      application: z.string(),
      description: z.string(),
      enabled: z.boolean(),
      sourceCode: z.string(),
      action: z.string(),
      filterCriteria: z
        .object({
          artifactFilterCriteria: z.object({
            repoKeys: z.array(z.string()),
          }),
        })
        .optional(),
      secrets: z.array(z.any()).optional(),
      shared: z.boolean(),
      debug: z.boolean(),
      projectKey: z.string().optional(),
      currentVersion: z
        .object({
          modifiedAt: z.number(),
          modifiedBy: z.string(),
        })
        .optional(),
    })
  ),
});

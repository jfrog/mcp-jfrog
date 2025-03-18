import { z } from "zod";

  export const JFrogEnvironmentSchema = z.object({
    id: z.string().describe("Environment ID"),
    name: z.string().describe("Environment name")
  });

  export const JFrogProjectUsageSchema = z.object({
    project_key: z.string().describe("Project key"),
    project_name: z.string().describe("Project name")
  });

  export const JFrogEnvironmentDetailsSchema = z.object({
    environment: JFrogEnvironmentSchema,
    used_in_projects: z.array(JFrogProjectUsageSchema),
    repos: z.array(z.string()).describe("List of repositories in this environment"),
    roles: z.array(z.string()).describe("List of roles available in this environment")
  });

  export const JFrogEnvironmentNamesSchema = z.array(
    z.object({
      name: z.string().describe("Environment name")
    })
  );

  export const JFrogEnvironmentsResponseSchema = z.object({
    environments: z.array(JFrogEnvironmentDetailsSchema)
  });

  export const JFrogProjectSchema = z.object({
    display_name: z.string().describe("Display name of the project"),
    description: z.string().describe("Project description"),
    admin_privileges: z.object({
      manage_members: z.boolean().describe("Whether admin can manage members"),
      manage_resources: z.boolean().describe("Whether admin can manage resources"),
      index_resources: z.boolean().describe("Whether admin can index resources")
    }),
    storage_quota_bytes: z.number().describe("Storage quota in bytes"),
    soft_limit: z.boolean().describe("Whether soft limit is enabled"),
    storage_quota_email_notification: z.boolean().describe("Whether storage quota email notifications are enabled"),
    project_key: z.string().describe("Unique key of the project")
  });

  export const CreateProjectSchema = z.object({
    display_name: z.string().describe("Display name of the project"),
    description: z.string().describe("Description of the project"),
    admin_privileges: z.object({
      manage_members: z.boolean().describe("Whether project admins can manage members"),
      manage_resources: z.boolean().describe("Whether project admins can manage resources"),
      index_resources: z.boolean().describe("Whether project admins can index resources")
    }).describe("Administrative privileges for the project"),
    storage_quota_bytes: z.number().describe("Storage quota in bytes (-1 for unlimited)"),
    project_key: z.string().describe("Unique identifier for the project, Project key must start with a lowercase letter and only contain lowercase letters")
  });
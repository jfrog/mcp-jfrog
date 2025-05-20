import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { jfrogRequest } from "../common/utils.js";

// Schema definitions
const ResourceTargetSchema = z.object({
  include_patterns: z.array(z.string()),
  exclude_patterns: z.array(z.string())
});

const ResourceActionsSchema = z.object({
  users: z.record(z.array(z.enum([
    'READ',
    'WRITE',
    'ANNOTATE',
    'DELETE',
    'DISTRIBUTE',
    'MANAGE'
  ]))),
  groups: z.record(z.array(z.enum([
    'READ',
    'WRITE',
    'ANNOTATE',
    'DELETE',
    'DISTRIBUTE',
    'MANAGE'
  ]))).optional()
});

const ArtifactResourceSchema = z.object({
  actions: ResourceActionsSchema,
  targets: z.record(ResourceTargetSchema)
});

const ReleaseBundleResourceSchema = z.object({
  actions: ResourceActionsSchema,
  targets: z.record(ResourceTargetSchema)
});

const BuildResourceSchema = z.object({
  actions: ResourceActionsSchema,
  targets: z.record(ResourceTargetSchema)
});

const PermissionTargetSchema = z.object({
  name: z.string(),
  resources: z.object({
    artifact: ArtifactResourceSchema.optional(),
    release_bundle: ReleaseBundleResourceSchema.optional(),
    build: BuildResourceSchema.optional()
  }),
  created_by: z.string().optional(),
  modified_by: z.string().optional()
});

const PermissionListSchema = z.object({
  permissions: z.array(z.object({
    name: z.string(),
    uri: z.string()
  })),
  cursor: z.string().optional()
});

// API Functions
export async function getAllPermissionTargets(cursor?: string, limit?: number) {
  const params = new URLSearchParams();
  if (cursor) params.append('cursor', cursor);
  if (limit) params.append('limit', limit.toString());
  
  const response = await jfrogRequest(`/access/api/v2/permissions${params.toString() ? `?${params.toString()}` : ''}`, {
    method: "GET",
  });
  return PermissionListSchema.parse(response);
}

export async function getPermissionTarget(name: string) {
  const response = await jfrogRequest(`/access/api/v2/permissions/${name}`, {
    method: "GET",
  });
  return PermissionTargetSchema.parse(response);
}

export async function createPermissionTarget(permissionTarget: z.infer<typeof PermissionTargetSchema>) {
  const response = await jfrogRequest("/access/api/v2/permissions", {
    method: "POST",
    body: permissionTarget
  });
  return PermissionTargetSchema.parse(response);
}

export async function updatePermissionTarget(name: string, permissionTarget: z.infer<typeof PermissionTargetSchema>) {
  const response = await jfrogRequest(`/access/api/v2/permissions/${name}`, {
    method: "PUT",
    body: permissionTarget
  });
  return PermissionTargetSchema.parse(response);
}

export async function deletePermissionTarget(name: string) {
  await jfrogRequest(`/access/api/v2/permissions/${name}`, {
    method: "DELETE",
  });
  return { success: true };
}

// Resource type specific operations
export async function getPermissionResource(name: string, resourceType: 'artifact' | 'release_bundle' | 'build') {
  const response = await jfrogRequest(`/access/api/v2/permissions/${name}/${resourceType}`, {
    method: "GET",
  });
  switch (resourceType) {
    case 'artifact':
      return ArtifactResourceSchema.parse(response);
    case 'release_bundle':
      return ReleaseBundleResourceSchema.parse(response);
    case 'build':
      return BuildResourceSchema.parse(response);
  }
}

export async function updatePermissionResource(
  name: string, 
  resourceType: 'artifact' | 'release_bundle' | 'build',
  resource: z.infer<typeof ArtifactResourceSchema> | z.infer<typeof ReleaseBundleResourceSchema> | z.infer<typeof BuildResourceSchema>
) {
  const response = await jfrogRequest(`/access/api/v2/permissions/${name}/${resourceType}`, {
    method: "PATCH",
    body: resource
  });
  switch (resourceType) {
    case 'artifact':
      return ArtifactResourceSchema.parse(response);
    case 'release_bundle':
      return ReleaseBundleResourceSchema.parse(response);
    case 'build':
      return BuildResourceSchema.parse(response);
  }
}

export async function replacePermissionResource(
  name: string, 
  resourceType: 'artifact' | 'release_bundle' | 'build',
  resource: z.infer<typeof ArtifactResourceSchema> | z.infer<typeof ReleaseBundleResourceSchema> | z.infer<typeof BuildResourceSchema>
) {
  const response = await jfrogRequest(`/access/api/v2/permissions/${name}/${resourceType}`, {
    method: "PUT",
    body: resource
  });
  switch (resourceType) {
    case 'artifact':
      return ArtifactResourceSchema.parse(response);
    case 'release_bundle':
      return ReleaseBundleResourceSchema.parse(response);
    case 'build':
      return BuildResourceSchema.parse(response);
  }
}

export async function deletePermissionResource(name: string, resourceType: 'artifact' | 'release_bundle' | 'build') {
  await jfrogRequest(`/access/api/v2/permissions/${name}/${resourceType}`, {
    method: "DELETE",
  });
  return { success: true };
}

/* Tools Section */

const listPermissionTargetsTool = {
  name: "jfrog_list_permission_targets",
  description: "Get a list of all permission targets in the JFrog platform",
  inputSchema: zodToJsonSchema(z.object({
    cursor: z.string().optional().describe("Cursor for pagination"),
    limit: z.number().optional().describe("Limit the number of results")
  })),
  outputSchema: zodToJsonSchema(PermissionListSchema),
  handler: async (args: any) => {
    return await getAllPermissionTargets(args.cursor, args.limit);
  }
};

const getPermissionTargetTool = {
  name: "jfrog_get_permission_target",
  description: "Get detailed information about a specific permission target",
  inputSchema: zodToJsonSchema(z.object({
    name: z.string().describe("The name of the permission target to retrieve")
  })),
  outputSchema: zodToJsonSchema(PermissionTargetSchema),
  handler: async (args: any) => {
    return await getPermissionTarget(args.name);
  }
};

const createPermissionTargetTool = {
  name: "jfrog_create_permission_target",
  description: "Create a new permission target in the JFrog platform",
  inputSchema: zodToJsonSchema(PermissionTargetSchema),
  outputSchema: zodToJsonSchema(PermissionTargetSchema),
  handler: async (args: any) => {
    return await createPermissionTarget(args);
  }
};

const updatePermissionTargetTool = {
  name: "jfrog_update_permission_target",
  description: "Update an existing permission target in the JFrog platform",
  inputSchema: zodToJsonSchema(z.object({
    name: z.string().describe("The name of the permission target to update"),
    target: PermissionTargetSchema.omit({ name: true })
  })),
  outputSchema: zodToJsonSchema(PermissionTargetSchema),
  handler: async (args: any) => {
    const { name, target } = args;
    return await updatePermissionTarget(name, { name, ...target });
  }
};

const deletePermissionTargetTool = {
  name: "jfrog_delete_permission_target",
  description: "Delete a permission target from the JFrog platform",
  inputSchema: zodToJsonSchema(z.object({
    name: z.string().describe("The name of the permission target to delete")
  })),
  outputSchema: zodToJsonSchema(z.object({
    success: z.boolean()
  })),
  handler: async (args: any) => {
    return await deletePermissionTarget(args.name);
  }
};

// Resource type specific tools
const getPermissionResourceTool = {
  name: "jfrog_get_permission_resource",
  description: "Get details of a specific resource type within a permission target",
  inputSchema: zodToJsonSchema(z.object({
    name: z.string().describe("The name of the permission target"),
    resourceType: z.enum(['artifact', 'release_bundle', 'build']).describe("The type of resource to retrieve")
  })),
  outputSchema: zodToJsonSchema(z.union([ArtifactResourceSchema, ReleaseBundleResourceSchema, BuildResourceSchema])),
  handler: async (args: any) => {
    return await getPermissionResource(args.name, args.resourceType);
  }
};

const updatePermissionResourceTool = {
  name: "jfrog_update_permission_resource",
  description: "Update a specific resource type within a permission target",
  inputSchema: zodToJsonSchema(z.object({
    name: z.string().describe("The name of the permission target"),
    resourceType: z.enum(['artifact', 'release_bundle', 'build']).describe("The type of resource to update"),
    resource: z.union([ArtifactResourceSchema, ReleaseBundleResourceSchema, BuildResourceSchema])
  })),
  outputSchema: zodToJsonSchema(z.union([ArtifactResourceSchema, ReleaseBundleResourceSchema, BuildResourceSchema])),
  handler: async (args: any) => {
    return await updatePermissionResource(args.name, args.resourceType, args.resource);
  }
};

const replacePermissionResourceTool = {
  name: "jfrog_replace_permission_resource",
  description: "Replace a specific resource type within a permission target",
  inputSchema: zodToJsonSchema(z.object({
    name: z.string().describe("The name of the permission target"),
    resourceType: z.enum(['artifact', 'release_bundle', 'build']).describe("The type of resource to replace"),
    resource: z.union([ArtifactResourceSchema, ReleaseBundleResourceSchema, BuildResourceSchema])
  })),
  outputSchema: zodToJsonSchema(z.union([ArtifactResourceSchema, ReleaseBundleResourceSchema, BuildResourceSchema])),
  handler: async (args: any) => {
    return await replacePermissionResource(args.name, args.resourceType, args.resource);
  }
};

const deletePermissionResourceTool = {
  name: "jfrog_delete_permission_resource",
  description: "Delete a specific resource type from a permission target",
  inputSchema: zodToJsonSchema(z.object({
    name: z.string().describe("The name of the permission target"),
    resourceType: z.enum(['artifact', 'release_bundle', 'build']).describe("The type of resource to delete")
  })),
  outputSchema: zodToJsonSchema(z.object({
    success: z.boolean()
  })),
  handler: async (args: any) => {
    return await deletePermissionResource(args.name, args.resourceType);
  }
};

export const PermissionsTools = [
  listPermissionTargetsTool,
  getPermissionTargetTool,
  createPermissionTargetTool,
  updatePermissionTargetTool,
  deletePermissionTargetTool,
  getPermissionResourceTool,
  updatePermissionResourceTool,
  replacePermissionResourceTool,
  deletePermissionResourceTool
]; 

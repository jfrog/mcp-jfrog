import {RepositoryTools} from "./repositories.js";
import {BuildsTools} from "./builds.js";
import { RuntimeTools } from "./runtime.js";
import { ReleaseLifecycleTools } from "./release_lifecycle.js";  
import { AccessTools } from "./access.js";
import { MissionControlTools } from "./mission_control.js";
import { AQLTools } from "./aql.js";
import { CatalogTools } from "./catalog.js";
import { CurationTools } from "./curation.js";
import { PermissionsTools } from "./permissions.js";
import { ArtifactSecurityTools } from "./security.js";

// Tools that mutate Artifactory state. Excluded when JFROG_READ_ONLY_MODE=true.
const WRITE_TOOL_NAMES = new Set([
  "jfrog_set_folder_property",
  "jfrog_create_local_repository",
  "jfrog_create_remote_repository",
  "jfrog_create_virtual_repository",
  "jfrog_create_project",
  "jfrog_create_permission_target",
  "jfrog_update_permission_target",
  "jfrog_delete_permission_target",
  "jfrog_update_permission_resource",
  "jfrog_replace_permission_resource",
  "jfrog_delete_permission_resource",
  "jfrog_create_release_bundle",
  "jfrog_promote_release_bundle",
  "jfrog_distribute_release_bundle",
]);

const allTools = [
  ...RepositoryTools,
  ...BuildsTools,
  ...RuntimeTools,
  ...AccessTools,
  ...AQLTools,
  ...CatalogTools,
  ...CurationTools,
  ...PermissionsTools,
  ...ArtifactSecurityTools,
];

const readOnlyMode = process.env.JFROG_READ_ONLY_MODE === "true";

const allowlistRaw = process.env.JFROG_TOOLS?.trim();
const allowlist = allowlistRaw
  ? new Set(allowlistRaw.split(",").map((s: string) => s.trim()).filter(Boolean))
  : null;

export const tools = allTools.filter(tool => {
  if (readOnlyMode && WRITE_TOOL_NAMES.has(tool.name)) return false;
  if (allowlist !== null && !allowlist.has(tool.name)) return false;
  return true;
});

// A function that given a tool name, executes the handler with the arguments and returns the result
export async function executeTool(toolName: string, args: any) {
  const tool = tools.find(t => t.name === toolName);
  if (!tool) {
    throw new Error(`Tool ${toolName} not found`);
  }
  return await tool.handler(args);
}

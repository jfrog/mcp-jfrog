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

export const tools =[
  ...RepositoryTools,
  ...BuildsTools,
  ...RuntimeTools,
  ...AccessTools,
  ...AQLTools,
  ...CatalogTools,
  ...CurationTools,
  ...PermissionsTools
];

// A function that given a tool name, executes the handler with the arguments and returns the result
export async function executeTool(toolName: string, args: any) {
  const tool = tools.find(t => t.name === toolName);
  if (!tool) {
    throw new Error(`Tool ${toolName} not found`);
  }
  return await tool.handler(args);
}

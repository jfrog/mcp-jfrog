import { z } from "zod";
import { zodToJsonSchema } from 'zod-to-json-schema';
import { jfrogRequest } from "../common/utils.js";
import * as accessSchemas from '../schemas/access.js';

  export async function getAllEnvironments() {
    const response = await jfrogRequest("/access/api/v1/environments", {
      method: "GET",
    });
     
    return accessSchemas.JFrogEnvironmentNamesSchema.parse(response);
  }

  export async function getAllProjects() {
    const response = await jfrogRequest("/access/api/v1/projects", {
      method: "GET",
    });
     
    return z.array(accessSchemas.JFrogProjectSchema).parse(response);
  }

  export async function createProject(project: z.infer<typeof accessSchemas.CreateProjectSchema>) {
    const response = await jfrogRequest("/access/api/v1/projects", {
      method: "POST",
      body: project
    });
     
    return accessSchemas.CreateProjectSchema.parse(response);
  }

  export async function getSpecificProjectInformation(projectKey: string) {
    const response = await jfrogRequest(`/access/api/v1/projects/${projectKey}`, {
      method: "GET",
    });
     
    return accessSchemas.JFrogProjectSchema.parse(response);
  }

  /* Tools Section */

  const getAllEnvironmentsTool = {
    name: "jfrog_list_environments",
    description: "Get a list of all environments types (e.g. dev, prod, etc.) in the JFrog platform with their details",
    inputSchema: zodToJsonSchema(z.object({})),
    outputSchema: zodToJsonSchema(z.object({})),
    handler: async (args: any) => {
      return await getAllEnvironments();
    }
  }

  const listAllProjectsTool = {
    name: "jfrog_list_projects",
    description: "Get a list of all projects in the JFrog platform with their details",
    inputSchema: zodToJsonSchema(z.object({})),
    outputSchema: zodToJsonSchema(z.object({})),
    handler: async (args: any) => {
      return await getAllProjects();
    }
  }

  const createProjectTool = {
    name: "jfrog_create_project",
    description: "Create a new project in the JFrog platform",
    inputSchema: zodToJsonSchema(accessSchemas.CreateProjectSchema),
    outputSchema: zodToJsonSchema(accessSchemas.CreateProjectSchema),
    handler: async (args: any) => {
      return await createProject(args);
    }
  }

  const getSpecificProjectTool = {
    name: "jfrog_get_specific_project",
    description: "Get detailed information about a specific project in the JFrog platform",
    inputSchema: zodToJsonSchema(z.object({
      project_key: z.string().describe("The unique key of the project to retrieve")
    })),
    outputSchema: zodToJsonSchema(accessSchemas.JFrogProjectSchema),
    handler: async (args: any) => {
      return await getSpecificProjectInformation(args.project_key);
    }
  }

  /* End of Tools creation Section */ 

  export const AccessTools = [
    getAllEnvironmentsTool,
    listAllProjectsTool,
    createProjectTool,
    getSpecificProjectTool
  ]
  
import { z } from "zod";
import { zodToJsonSchema } from 'zod-to-json-schema';
import { jfrogRequest } from "../common/utils.js";
import { 
  CreateLocalRepoSchema, 
  CreateRemoteRepoSchema, 
  CreateVirtualRepoSchema, 
  ListRepositoriesParamsSchema, 
  JFrogRepositoryCreateResponseSchema,
  JFrogPlatformReadinessSchema,
  defaultModels,
  SetFolderPropertySchema,
  ListRepositoriesResponseSchema } from "../schemas/repositories.js";


  /* Api Calls Section */

  export async function checkPlatformReadiness() {
    const response = await jfrogRequest("/artifactory/api/v1/system/readiness", {
      method: "GET",
    });
     
    return JFrogPlatformReadinessSchema.parse(response);
  }


  export type CreateLocalRepositoryOptions = z.infer<typeof CreateLocalRepoSchema>;
  export async function createLocalRepository(options: CreateLocalRepositoryOptions) {
    console.error('Starting createLocalRepository');
    const response = await jfrogRequest(`/artifactory/api/repositories/${options.key}`, {
      method: "PUT",
      body: options
    });
    
     console.log(response);
    return JFrogRepositoryCreateResponseSchema.parse(response);
  }

  export async function setFolderProperty(folderPath: string, properties: Record<string, string>, recursive: boolean = false) {
    // Convert properties object to query string format
    const propsQuery = Object.entries(properties)
      .map(([key, value]) => `${key}=${value}`)
      .join(';');

    const url = `/artifactory/api/storage/${folderPath}?properties=${propsQuery}&recursive=${recursive ? 1 : 0}`;

    const response = await jfrogRequest(url, {
      method: "PUT"
    });

    return response;
  }

  export async function listRepositories(params?: z.infer<typeof ListRepositoriesParamsSchema>) {
    let url = '/artifactory/api/repositories';
    
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.type) queryParams.append('type', params.type);
      if (params.packageType) queryParams.append('packageType', params.packageType);
      if (params.project) queryParams.append('project', params.project);
      
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    const response = await jfrogRequest(url, {
      method: "GET"
    });

    return ListRepositoriesResponseSchema.parse(response);
  }

  export async function createRemoteRepository(options: z.infer<typeof CreateRemoteRepoSchema>) {
    // If packageType is provided but URL is not, use default URL from packageType defaults
    if (options.packageType && !options.url) {
      options.url = defaultModels[options.packageType] || "";
    }

    const response = await jfrogRequest(`/artifactory/api/repositories/${options.key}`, {
      method: "PUT",
      body: options
    });
     
    return JFrogRepositoryCreateResponseSchema.parse(response);
  }

  export async function createVirtualRepository(options: z.infer<typeof CreateVirtualRepoSchema>) {
    const response = await jfrogRequest(`/artifactory/api/repositories/${options.key}`, {
      method: "PUT",
      body: options
    });
     
    return JFrogRepositoryCreateResponseSchema.parse(response);
  }

  /* End of Api Calls Section */


  /* Tools Section */
  
const checkJfrogAvailabilityTool = {
  name: "jfrog_check_availability",
  description: "Check if JFrog platform is ready and functioning or not",
  inputSchema: zodToJsonSchema(z.object({}))
}

const setFolderPropertyTool = {
  name: "jfrog_set_folder_property",
  description: "Set properties on a folder in Artifactory, with optional recursive application",
  inputSchema: zodToJsonSchema(SetFolderPropertySchema)
}

const createLocalRepositoryTool = {
  name: "jfrog_create_local_repository",
  description: "Create a new local repository in artifactroy",
  inputSchema: zodToJsonSchema(CreateLocalRepoSchema)
}

const createRemoteRepositoryTool = {
  name: "jfrog_create_remote_repository",
  description: "Create a new remote repository in Artifactory to proxy external package registries",
  inputSchema: zodToJsonSchema(CreateRemoteRepoSchema)
}

const createVirtualRepositoryTool = {
  name: "jfrog_create_virtual_repository",
  description: "Create a new virtual repository in Artifactory that aggregates multiple repositories",
  inputSchema: zodToJsonSchema(CreateVirtualRepoSchema)
}

const listRepositoriesTool = {
  name: "jfrog_list_repositories",
  description: "List all repositories in Artifactory with optional filtering by type, package type, and project",
  inputSchema: zodToJsonSchema(ListRepositoriesParamsSchema)
}

export const RepositoryTools =[ 
  checkJfrogAvailabilityTool,
  createLocalRepositoryTool,
  createRemoteRepositoryTool,
  createVirtualRepositoryTool,
  setFolderPropertyTool,
  listRepositoriesTool
]
 
/* End of Tools creation Section */
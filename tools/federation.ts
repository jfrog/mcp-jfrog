import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { jfrogRequest } from "../common/utils.js";
import * as buildsSchemas from "../schemas/builds.js";
import * as federationSchemas from "../schemas/federation.js";


export async function getAllBuilds() {
  const response = await jfrogRequest("/artifactory/api/build", {
    method: "GET",
  });
     
  return buildsSchemas.JFrogBuildsListSchema.parse(response);
}


export async function getSpecificBuild(buildName: string, project?: string) {
  const url = project 
    ? `/artifactory/api/build/${buildName}?project=${project}`
    : `/artifactory/api/build/${buildName}`;

  const response = await jfrogRequest(url, {
    method: "GET",
  });
     
  return buildsSchemas.JFrogBuildDetailsSchema.parse(response);
}

export async function getFederationStatus() {
  const response = await jfrogRequest("/artifactory/api/federation/status/stateList", {
    method: "GET",
  });
     
  return federationSchemas.FederationStateResponseSchema.parse(response);
}

export async function getSpecificRepoFederationState(repoKey: string) {
  const encodedRepoKey = encodeURIComponent(repoKey);
  
  const response = await jfrogRequest(`/artifactory/api/federation/status/repoState/${encodedRepoKey}/binaries`, {
    method: "GET",
  });
     
  return federationSchemas.SpecificRepoFederationStateSchema.parse(response);
}

/* Tools Section */

const getFederationStatusTool = {
  name: "jfrog_get_federation_status",
  description: "Get the status of all federations in the JFrog platform",
  inputSchema: zodToJsonSchema(z.object({})),
  handler: async () => {
    return await getFederationStatus();
  }
};

const getSpecificRepoFederationStateTool = {
  name: "jfrog_get_specific_repo_federation_state",
  description: "Get the federation state for a specific repository",
  inputSchema: zodToJsonSchema(
    z.object({
      repoKey: z.string().describe("Repository key")
    })
  ),
  handler: async (args: any) => {
    const { repoKey } = args;
    return await getSpecificRepoFederationState(repoKey);
  }
};

/* End of Tools creation Section */ 


export const FederationTools = [
  getFederationStatusTool,
  getSpecificRepoFederationStateTool
];
  
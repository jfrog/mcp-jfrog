import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { jfrogRequest } from "../common/utils.js";
import * as buildsSchemas from "../schemas/builds.js";


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



/* Tools Section */

const getSpecificBuildTool = {
  name: "jfrog_get_specific_build",
  description: "Get details for a specific build by name, optionally scoped to a project",
  inputSchema: zodToJsonSchema(buildsSchemas.GetSpecificBuildSchema),
  //outputSchema: zodToJsonSchema(buildsSchemas.JFrogBuildDetailsSchema),
  handler: async (args: any) => {
    const parsedArgs = buildsSchemas.GetSpecificBuildSchema.parse(args);
    return await getSpecificBuild(parsedArgs.buildName, parsedArgs.project);
  }
};
  
const getAllBuildsTool = {
  name: "jfrog_list_builds",
  description: "return a list of all my build in the jfrog platform",
  inputSchema: zodToJsonSchema(z.object({})),
  ////outputSchema: zodToJsonSchema(buildsSchemas.JFrogBuildsListSchema),
  handler: async () => {
    return await getAllBuilds();
  }
};
/* End of Tools creation Section */ 

export const BuildsTools = [
  getAllBuildsTool,
  getSpecificBuildTool
];
  
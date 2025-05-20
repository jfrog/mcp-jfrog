import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { jfrogRequest } from "../common/utils.js";
import * as release_lifecycleSchemas from "../schemas/release_lifecycle.js";


/* Api Calls Section */   

  type CreateReleaseBundleOptions = z.infer<typeof release_lifecycleSchemas.CreateReleaseBundleSchema>;
export async function createReleaseBundle(releaseBundle: CreateReleaseBundleOptions  ) {
  const response = await jfrogRequest("/lifecycle/api/v2/release_bundle?project=default&async=false", {
    method: "POST",
    body: releaseBundle
  });
     
  return release_lifecycleSchemas.JFrogReleaseBundleResponseSchema.parse(response);
}

export async function getReleaseBundle(rbv2_name: string, project = "default") {
  const response = await jfrogRequest(`/lifecycle/api/v2/release_bundle/records/${rbv2_name}?project=${project}`, {
    method: "GET",
  });
     
  return release_lifecycleSchemas.JFrogReleaseBundleVersionSchema.parse(response);
}

  type DistributeReleaseBundleOptions = z.infer<typeof release_lifecycleSchemas.DistributeReleaseBundleSchema>;
export async function distributeReleaseBundle(options: DistributeReleaseBundleOptions) {
  const response = await jfrogRequest(`/lifecycle/api/v2/distribution/distribute/${options.name}/${options.version}?repository_key=${options.repository_key}`, {
    method: "POST",
    body: options
  });

  return release_lifecycleSchemas.JFrogDistributionResponseSchema.parse(response);
}

  type PromoteReleaseBundleOptions = z.infer<typeof release_lifecycleSchemas.PromoteReleaseBundleSchema>;
  
export async function promoteReleaseBundle(options: PromoteReleaseBundleOptions) {
  const queryParams = new URLSearchParams({
    async: options.async.toString(),
    operation: options.operation
  });

  const response = await jfrogRequest(
    `/lifecycle/api/v2/promotion/records/${options.name}/${options.version}?${queryParams}`,
    {
      method: "POST",
      body: release_lifecycleSchemas.PromoteReleaseBundleBodySchema.parse(options)
    }
  );
    
  return release_lifecycleSchemas.JFrogPromotionResponseSchema.parse(response);
}


/* End of Api Calls Section */



/* Tools Section */

const promoteReleaseBundleTool = {
  name: "jfrog_promote_release_bundle",
  description: "Promote a release bundle version by copying or moving its contents",
  inputSchema: zodToJsonSchema(release_lifecycleSchemas.PromoteReleaseBundleSchema),
  outputSchema: zodToJsonSchema(release_lifecycleSchemas.JFrogReleaseBundleResponseSchema),
  handler: async (args: any) => {
    const parsedArgs = release_lifecycleSchemas.PromoteReleaseBundleSchema.parse(args);
    return await promoteReleaseBundle(parsedArgs);
  }
};

const getSpecificReleaseBundleTool = {
  name: "jfrog_get_specific_release_bundle",
  description: "Get a list of all version of a specific release bundle",
  inputSchema: zodToJsonSchema(release_lifecycleSchemas.GetSpecificReleaseBundleSchema),
  outputSchema: zodToJsonSchema(release_lifecycleSchemas.JFrogReleaseBundleVersionSchema),
  handler: async (args: any) => {
    const parsedArgs = release_lifecycleSchemas.GetSpecificReleaseBundleSchema.parse(args);
    return await getReleaseBundle(parsedArgs.rbv2_name, parsedArgs.project);
  }
};

const createReleaseBundleTool = {
  name: "jfrog_create_release_bundle",
  description: "create a release bundle in the jfrog platform",
  inputSchema: zodToJsonSchema(release_lifecycleSchemas.CreateReleaseBundleSchema),
  // outputSchema: zodToJsonSchema(release_lifecycleSchemas.CreateReleaseBundleResponseSchema),
  handler: async (args: any) => {
    const parsedArgs = release_lifecycleSchemas.CreateReleaseBundleSchema.parse(args);
    return await createReleaseBundle(parsedArgs);
  }
};

const distributeReleaseBundleTool = {
  name: "jfrog_distribute_release_bundle",
  description: "Distribute a release bundle to a target environment",
  inputSchema: zodToJsonSchema(release_lifecycleSchemas.DistributeReleaseBundleSchema),
  // outputSchema: zodToJsonSchema(release_lifecycleSchemas.DistributeReleaseBundleResponseSchema),
  handler: async (args: any) => {
    const parsedArgs = release_lifecycleSchemas.DistributeReleaseBundleSchema.parse(args);
    return await distributeReleaseBundle(parsedArgs);
  }
};
/* End of Tools creation Section */ 

export const ReleaseLifecycleTools = [
  createReleaseBundleTool,
  promoteReleaseBundleTool,
  distributeReleaseBundleTool,
  getSpecificReleaseBundleTool
];

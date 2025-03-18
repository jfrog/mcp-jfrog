import { z } from "zod";
import { zodToJsonSchema } from 'zod-to-json-schema';
import { buildUrl, jfrogRequest } from "../common/utils.js";
import { 
  getAllRuntimeClustersSchema, 
  getRuntimeClusterSchema, 
  JFrogRuntimeClusterDetailedSchema, 
  JFrogRuntimeImagesResponseSchema,
   ListRunningImagesSchema,
   JFrogRuntimeClustersListResponseSchema  } from "../schemas/runtime.js";



/* End of Schema Section */

/* Api Calls Section */   

export async function getRuntimeCluster(clusterId: number | string) {
  const response = await jfrogRequest(`/runtime/api/v1/clusters/${clusterId}/`,{
    method: "GET"
  });
  return JFrogRuntimeClusterDetailedSchema.parse(response);
}

export async function getAllRuntimeClusters(limit:number) {
  const response = await jfrogRequest("/runtime/api/v1/clusters",{
    method: "POST",
    body: {
      limit
    }
  });
   
  return JFrogRuntimeClustersListResponseSchema.parse(response);
}

export async function getRunningImages(params: z.infer<typeof ListRunningImagesSchema>) {
  const queryString = new URLSearchParams({
    num_of_rows: params.num_of_rows.toString(),
    statistics: params.statistics.toString(),
    timePeriod: params.timePeriod,
    filters: params.filters,
    page_num: params.page_num.toString()
  }).toString();

  const response = await jfrogRequest(`/runtime/api/v1/live/images?${queryString}`, {
    method: "GET"
  });
   
  return JFrogRuntimeImagesResponseSchema.parse(response);
}

/* End of Api Calls Section */

/* Tools Section */
const getAllRuntimeClustersTool = {
  name: "jfrog_list_runtime_clusters",
  description: "return a list of all my runtime clusters in the jfrog platform",
  inputSchema: zodToJsonSchema(getAllRuntimeClustersSchema)
}

const getRuntimeClusterTool = {
  name: "jfrog_get_runtime_specific_cluster", 
  description: "return a runtime cluster by id",
  inputSchema: zodToJsonSchema(getRuntimeClusterSchema)
}

const listRunningImagesTool = {
  name: "jfrog_list_running_images",
  description: "List all running container images across runtime clusters with their security and operational status",
  inputSchema: zodToJsonSchema(ListRunningImagesSchema)
}

/* End of Tools creation Section */ 

export const RuntimeTools = [
  getAllRuntimeClustersTool,
  getRuntimeClusterTool,
  listRunningImagesTool
]
  
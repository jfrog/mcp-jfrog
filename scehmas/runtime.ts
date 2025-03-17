import { z } from "zod";

/* Schema Section */

// Get all runtime clusters
export const getAllRuntimeClustersSchema = z.object({
    limit: z.number().int().default(50).describe("The maximum number of clusters to return"),
    next_key: z.string().optional().describe("The next key to use for pagination")
  });
  
  // Get a specific runtime cluster           
  export const getRuntimeClusterSchema = z.object({
    clusterId: z.number().int().describe("The ID of the cluster to retrieve")
  });
  
   
    export const JFrogRuntimeClusterNodeSchema = z.object({
      architecture: z.string().describe("CPU architecture of the node"),
      hostname: z.string().describe("Hostname of the node"),
      id: z.number().int().describe("Unique identifier for the node"),
      internal_dns: z.string().describe("Internal DNS name of the node"),
      internal_ip: z.string().describe("Internal IP address of the node"),
      monitored_at: z.string().describe("Timestamp when the node was last monitored"),
      name: z.string().describe("Name of the node"),
      region: z.string().describe("Region where the node is deployed"),
      sensor_installed: z.boolean().describe("Whether the sensor is installed on the node"),
      sensor_last_updated: z.string().describe("Timestamp when the sensor was last updated"),
      sensor_version: z.string().describe("Version of the installed sensor"),
      status: z.string().describe("Current status of the node")
    });
  
    export const JFrogRuntimeClusterDetailedSchema = z.object({
      cluster: z.object({
        controller_last_updated: z.string().describe("Date of last controller update"),
        controller_status: z.enum(["running", "stopped"]).describe("Status of the cluster controller"),
        controller_version: z.string().describe("Version of the cluster controller"),
        disabled_nodes_count: z.number().int().describe("Number of disabled nodes"),
        failed_nodes_count: z.number().int().describe("Number of failed nodes"),
        failed_to_install_nodes_count: z.number().int().describe("Number of nodes that failed installation"),
        id: z.number().int().describe("Unique identifier for the cluster"),
        monitored_at: z.string().describe("Timestamp when monitoring started"),
        name: z.string().describe("Name of the cluster"),
        nodes: z.array(JFrogRuntimeClusterNodeSchema).describe("List of nodes in the cluster"),
        nodes_count: z.number().int().describe("Total number of nodes"),
        provider: z.string().describe("Cloud provider"),
        regions: z.array(z.string()).describe("Regions where the cluster is deployed"),
        running_nodes_count: z.number().int().describe("Number of running nodes")
      })
    });
  
  export const JFrogRuntimeImageVulnsSchema = z.object({
    critical: z.number().int().describe("Number of critical vulnerabilities"),
    high: z.number().int().describe("Number of high vulnerabilities"),
    imageTag: z.string().describe("Image tag"),
    isScannedByXray: z.boolean().describe("Whether image was scanned by Xray"),
    low: z.number().int().describe("Number of low vulnerabilities"),
    medium: z.number().int().describe("Number of medium vulnerabilities"),
    total: z.number().int().describe("Total number of vulnerabilities"),
    unknown: z.number().int().describe("Number of unknown vulnerabilities")
  });
  
  export const JFrogRuntimeImageSchema = z.object({
    cloudProviders: z.array(z.string()).describe("List of cloud providers where image is running"),
    clustersCount: z.number().int().describe("Number of clusters running this image"),
    name: z.string().describe("Name of the image"),
    registry: z.string().describe("Registry where image is stored"),
    repositoryPath: z.string().describe("Repository path of the image"),
    riskiestTag: z.string().describe("Tag with highest risk"),
    riskiestTagRisks: z.array(z.string()).describe("List of risks for riskiest tag"),
    riskiestTagVulns: JFrogRuntimeImageVulnsSchema.describe("Vulnerability information for riskiest tag"),
    risks: z.array(z.string()).describe("List of risks for the image"),
    status: z.string().describe("Current status of the image"),
    vulnerabilitiesPerVersion: z.array(z.any()).describe("Vulnerabilities broken down by version"),
    workloadsCount: z.number().int().describe("Number of workloads using this image")
  });
  
  export const JFrogRuntimeClusterSchema = z.object({
    monitored_at: z.string().describe("Timestamp when the monitoring of cluster started"),
    id: z.union([z.string(), z.number().int()]).describe("Unique identifier for the cluster in the system"),
    name: z.string().describe("The name of the cluster"),
    controller_version: z.string().describe("Version of the cluster controller"),
    controller_status: z.enum(["running", "stopped"]).describe("Status of the cluster controller"),
    controller_last_updated: z.string().describe("Date of last update"),
    provider: z.string().describe("The cloud provider where the cluster is hosted"),
    regions: z.array(z.string()).describe("List of regions in which the cluster is deployed"),
    nodes_count: z.number().int().describe("The total number of nodes in the cluster"),
    running_nodes_count: z.number().int().describe("The number of nodes currently running"),
    failed_nodes_count: z.number().int().describe("The number of nodes that have failed"),
    failed_to_install_nodes_count: z.number().int().describe("The number of nodes that failed to install"),
    disabled_nodes_count: z.number().int().describe("The number of nodes that are currently disabled")
  })

  export const JFrogRuntimeStatisticSchema = z.object({
    actions: z.array(z.object({
      payload: z.string(),
      type: z.string()
    })).describe("Available actions for this statistic"),
    key: z.string().describe("Statistic key"),
    value: z.string().describe("Statistic value")
  });
  
  export const JFrogRuntimeImagesResponseSchema = z.object({
    images: z.array(JFrogRuntimeImageSchema).describe("List of running images"),
    statistics: z.array(JFrogRuntimeStatisticSchema).describe("Statistics about the images"),
    totalCount: z.number().int().describe("Total number of images")
  });
  
  export const ListRunningImagesSchema = z.object({
    num_of_rows: z.number().int().default(100).describe("Number of rows to return"),
    statistics: z.boolean().default(true).describe("Whether to include statistics"),
    timePeriod: z.string().default("now").describe("Time period to query"),
    filters: z.string().default("").describe("Filters to apply"),
    page_num: z.number().int().default(1).describe("Page number")
  });

  export const JFrogRuntimeClustersListResponseSchema = z.object({
    total_count: z.number().int().describe("The total number of clusters that match the filter query"),
    pagination: z.object({limit:z.number().default(10)}).describe("Pagination info for the request"), // Note: Pagination object structure not specified
    clusters: z.array(JFrogRuntimeClusterSchema).describe("A list of cluster objects containing details of each cluster")
  });

  export type JFrogRuntimeClustersListResponseSchema = z.infer<typeof JFrogRuntimeClustersListResponseSchema>;
import { z } from "zod";

// Schema for federation member info
export const FederationMemberInfoSchema = z.object({
  url: z.string().describe("URL of the federation member"),
  repoKey: z.string().describe("Repository key of the federation member"),
  aggregatedStatus: z.string().describe("Status of the federation member"),
  supported: z.boolean().describe("Whether the federation is supported"),
  disabled: z.boolean().describe("Whether the federation member is disabled"),
  inLag: z.boolean().describe("Whether the federation member is lagging")
});

// Schema for federation entity
export const FederationSchema = z.object({
  localRepoKey: z.string().describe("Local repository key"),
  memberInfoList: z.array(FederationMemberInfoSchema).describe("List of federation members"),
  priority: z.string().describe("Priority of the federation")
});

// Schema for federation state response
export const FederationStateResponseSchema = z.object({
  federations: z.array(FederationSchema).describe("List of federations")
}); 

// Schema for binaries tasks info
export const BinariesTasksInfoSchema = z.object({
  inProgressTasks: z.number().describe("Number of in-progress tasks"),
  failingTasks: z.number().describe("Number of failing tasks")
});

// Schema for specific repo federation state
export const SpecificRepoFederationStateSchema = z.object({
  repoKey: z.string().describe("Repository key"),
  binariesTasksInfo: BinariesTasksInfoSchema.describe("Information about binary tasks")
}); 



import { z } from "zod";

export const GetCurationPackageStatusInputSchema = z.object({
  packageType: z.enum(["pypi", "npm", "maven", "golang", "nuget", "huggingface", "rubygems"]).describe("The type of package."),
  packageName: z.string().describe("The name of the package, as it appears in the package repository."),
  packageVersion: z.string().describe("The version of the package, as it appears in the package repository.")
});

export const GetCurationPackageStatusOutputSchema = z.object({
  status: z.enum(["approved", "blocked", "inconclusive"]).describe("The curation status of the package."),
  details: z.string().optional().describe("Additional details about the curation status."),
  repositories: z.array(z.object({
    action: z.string(),
    repo_name: z.string(),
    reason: z.string(),
    policies: z.array(z.object({
      condition_name: z.string(),
      policy_name: z.string(),
      explanation: z.string(),
      remediation: z.string()
    })).optional()
  })).optional().describe("Information about the repositories if IsRepoInformation is true.")
});

export type GetCurationPackageStatusInput = z.infer<typeof GetCurationPackageStatusInputSchema>;
export type GetCurationPackageStatusOutput = z.infer<typeof GetCurationPackageStatusOutputSchema>; 
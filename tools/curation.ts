import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { jfrogRequest } from "../common/utils.js";
import {
  GetCurationPackageStatusInputSchema,
  GetCurationPackageStatusOutputSchema,
  GetCurationPackageStatusInput,
  GetCurationPackageStatusOutput
} from "../schemas/curation.js";

// Define the expected response structure
interface CurationStatusResponse {
    summary: {
        total_approved: number;
        total_blocked: number;
    };
}

export async function getCurationPackageStatus(options: GetCurationPackageStatusInput): Promise<GetCurationPackageStatusOutput> {
  const response = await jfrogRequest(
    "xray/api/v1/curation/package_status/all_repos",
    {
      method: "POST",
      body: JSON.stringify({
        packageType: options.packageType,
        packageName: options.packageName,
        packageVersion: options.packageVersion
      })
    }
  ) as CurationStatusResponse & { repositories: any[] };

  const totalApproved = response.summary.total_approved;
  const totalBlocked = response.summary.total_blocked;

  const isRepoInformation = true;

  const status = totalApproved > 0 && totalBlocked === 0 ? "approved" : totalApproved === 0 && totalBlocked > 0 ? "blocked" : "inconclusive";
  const details = totalApproved > 0 && totalBlocked === 0 ? "The package is approved in all repositories." : totalApproved === 0 && totalBlocked > 0 ? "The package is blocked in all repositories." : "The package has mixed curation status across repositories.";

  if (isRepoInformation) {
    return {
      status,
      details,
      repositories: response.repositories
    };
  }

  return { status, details };
}

const getCurationPackageStatusTool = {
  name: "jfrog_get_package_curation_status",
  description: "Useful for checking the curation status of a specific package version. Returns one of the following statuses: approved, blocked, inconclusive.",
  inputSchema: zodToJsonSchema(GetCurationPackageStatusInputSchema),
  outputSchema: zodToJsonSchema(GetCurationPackageStatusOutputSchema),
  handler: async (args: any) => {
    const parsedArgs = GetCurationPackageStatusInputSchema.parse(args);
    return await getCurationPackageStatus(parsedArgs);
  }
};

export const CurationTools = [
  getCurationPackageStatusTool
]; 
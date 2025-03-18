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
                packageType: options.package_type,
                packageName: options.package_name,
                packageVersion: options.package_version
            })
        }
    ) as CurationStatusResponse;

    const totalApproved = response.summary.total_approved;
    const totalBlocked = response.summary.total_blocked;

    if (totalApproved > 0 && totalBlocked === 0) {
        return { status: "approved", details: "The package is approved in all repositories." };
    } else if (totalApproved === 0 && totalBlocked > 0) {
        return { status: "blocked", details: "The package is blocked in all repositories." };
    } else {
        return { status: "inconclusive", details: "The package has mixed curation status across repositories." };
    }
}

const getCurationPackageStatusTool = {
    name: "jfrog_get_package_curation_status",
    description: "Useful for checking the curation status of a specific package version. Returns one of the following statuses: approved, blocked, inconclusive.",
    inputSchema: zodToJsonSchema(GetCurationPackageStatusInputSchema),
    outputSchema: zodToJsonSchema(GetCurationPackageStatusOutputSchema),
};

export const CurationTools = [
    getCurationPackageStatusTool
]; 
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { jfrogRequest } from "../common/utils.js";
import { 
  GetArtifactsSummaryInput,
  GetArtifactsSummaryInputSchema,
  GetArtifactsSummaryOutputSchema,
  ArtifactsSummarySchema,
  ArtifactsSummaryOutput
}   from "../schemas/security.js";

/* Api Calls Section */

export async function getArtifactSummary(paths: GetArtifactsSummaryInput): Promise<ArtifactsSummaryOutput> {
  const full_paths = paths.paths.map(el => "default/" + el);
  const response: any = await jfrogRequest(
    "xray/api/v1/summary/artifact",
    {
      method: "POST",
      body: JSON.stringify({
        paths: full_paths,
      })
    }
  );

  // Debugging: Log the raw response
  console.log("Raw response from JFrog Xray API:", GetArtifactsSummaryOutputSchema.parse(response));

  // Validate response before parsing
  if (!response || !response.artifacts || response.artifacts.length === 0) {
    console.warn("Invalid or missing data in API response:", response);
    return { artifacts_summary: [] };
  }

  const apiResult =  GetArtifactsSummaryOutputSchema.parse(response);
  const severities_map = new Map<string, Array<number>>();

  for (const artifact of apiResult.artifacts) {
    const artifact_severities = [0, 0, 0, 0, 0];
    if (artifact.issues) {
      for (const issue of artifact.issues) {
        switch (issue.severity) {
        case "Critical":
            artifact_severities![0]++;
          break;
        case "High":
            artifact_severities![1]++;
          break;
        case "Medium":
            artifact_severities![2]++;
          break;
        case "Low":
            artifact_severities![3]++;
          break;
        case "Unknown":
            artifact_severities![4]++;
          break;
        }
      }
    }
    severities_map.set(artifact.general.path, artifact_severities);
  }

  const artifacts_summary = apiResult.artifacts.map((artifact) => {
    return {
      artifact_name: artifact.general.path,
      artifact_issue_count: artifact.issues ? artifact.issues.length : 0,
      artifact_critical_count: severities_map.get(artifact.general.path)![0],
      artifact_high_count: severities_map.get(artifact.general.path)![1],
      artifact_medium_count: severities_map.get(artifact.general.path)![2],
      artifact_low_count: severities_map.get(artifact.general.path)![3],
      artifact_unknown_count: severities_map.get(artifact.general.path)![4],
    };
  });
  return { artifacts_summary: artifacts_summary };
}

/* End of Api Calls Section */


/* Tools Section */

const getArtifactsSummaryTool = {
  name: "jfrog_get_artifacts_summary",
  description: "Get the summary of artifacts, one or many",
  inputSchema: zodToJsonSchema(GetArtifactsSummaryInputSchema),
  outputSchema: zodToJsonSchema(ArtifactsSummarySchema),
  handler: async (args: any) => {
    const parsedArgs = GetArtifactsSummaryInputSchema.parse(args);
    return await getArtifactSummary(parsedArgs);
  }
};

/* End of Tools creation Section */

export const ArtifactSecurityTools = [
  getArtifactsSummaryTool
];
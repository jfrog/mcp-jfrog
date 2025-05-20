/* Schema Section */

import { z } from "zod";

export const JFrogBuildSourceSchema = z.object({
  build_name: z.string().describe("Name of the build"),
  build_number: z.string().describe("Number (run) of the build"),
  build_started: z.string().optional().describe("Timestamp when the build was created (ISO 8601 format)"),
  build_repository: z.string().optional().default("artifactory-build-info").describe("Repository key of the build"),
  include_dependencies: z.boolean().optional().default(false).describe("Whether to include build dependencies in the Release Bundle")
});

export const CreateReleaseBundleSchema = z.object({
  release_bundle_name: z.string().describe("Name of the Release Bundle"),
  release_bundle_version: z.string().describe("Version of the Release Bundle"),
  skip_docker_manifest_resolution: z.boolean().optional().default(false).describe("Whether to skip Docker manifest resolution"),
  source_type: z.literal("builds").optional().default("builds").describe("Type of source for the Release Bundle"),
  source: z.object({
    builds: z.array(JFrogBuildSourceSchema).describe("Array of build sources to include which specified by the user")
  })
});

export const JFrogReleaseBundleResponseSchema = z.object({
  repository_key: z.string().describe("Repository key where the Release Bundle is stored"),
  release_bundle_name: z.string().describe("Name of the created Release Bundle"),
  release_bundle_version: z.string().describe("Version of the created Release Bundle"), 
  created: z.string().describe("Timestamp when the Release Bundle was created (ISO 8601 format)")
});

export const JFrogReleaseBundleVersionItemSchema = z.object({
  status: z.string().describe("Status of the release bundle version"),
  repository_key: z.string().describe("Repository key where the Release Bundle is stored"),
  release_bundle_name: z.string().describe("Name of the Release Bundle"),
  release_bundle_version: z.string().describe("Version of the Release Bundle"),
  service_id: z.string().describe("Service ID of the Artifactory instance"),
  created_by: z.string().describe("Username of the creator"),
  created: z.string().describe("Timestamp when the Release Bundle was created (ISO 8601 format)")
});

export const JFrogReleaseBundleVersionSchema = z.object({
  release_bundles: z.array(JFrogReleaseBundleVersionItemSchema).describe("List of release bundle versions"),
  total: z.number().describe("Total number of release bundle versions"),
  limit: z.number().describe("Maximum number of items per page"),
  offset: z.number().describe("Offset from the first result")
});

export const GetSpecificReleaseBundleSchema = z.object({
  rbv2_name: z.string().describe("Name of the Release Bundle"),
  project: z.string().optional().default("default").describe("Project key")
});

export const PromoteReleaseBundleSchema = z.object({
  name: z.string().describe("Name of the Release Bundle to promote"),
  version: z.string().describe("Version of the Release Bundle to promote"),
  async: z.boolean().optional().default(true).describe("Whether to run promotion asynchronously"),
  operation: z.enum(["copy", "move"]).optional().default("move").describe("How to perform the promotion - copy (default) or move"),
  environment: z.string().describe("Target environment for promotion"),
  included_repository_keys: z.array(z.string()).default([]).describe("List of repository keys to include in promotion"),
  excluded_repository_keys: z.array(z.string()).default([]).describe("List of repository keys to exclude from promotion")
});

export const JFrogPromotionResponseSchema = z.object({
  repository_key: z.string().describe("Repository key where the Release Bundle is stored"),
  release_bundle_name: z.string().describe("Name of the promoted Release Bundle"),
  release_bundle_version: z.string().describe("Version of the promoted Release Bundle"),
  environment: z.string().describe("Target environment for promotion"),
  included_repository_keys: z.array(z.string()).describe("List of repository keys included in promotion"),
  excluded_repository_keys: z.array(z.string()).describe("List of repository keys excluded from promotion"),
  created: z.string().describe("Timestamp when the promotion was created (ISO 8601 format)"),
  created_millis: z.number().describe("Timestamp when the promotion was created in milliseconds")
});

export const PromoteReleaseBundleBodySchema = z.object({
  environment: z.string().describe("Target environment for promotion"),
  included_repository_keys: z.array(z.string()).default([]).describe("List of repository keys to include in promotion"),
  excluded_repository_keys: z.array(z.string()).default([]).describe("List of repository keys to exclude from promotion")
}); 

export const JFrogDistributionRuleSchema = z.object({
  site_name: z.string().default("*").describe("Name of the distribution target site. Use '*' for all sites")
});

export const JFrogPathMappingSchema = z.object({
  input: z.string().describe("Input regex pattern for path mapping"),
  output: z.string().describe("Output pattern for path mapping")
});

export const JFrogDistributionModificationsSchema = z.object({
  default_path_mapping_by_last_promotion: z.boolean().optional().default(false)
    .describe("Whether to use repositories from last promotion as path mapping"),
  mappings: z.array(JFrogPathMappingSchema).optional()
    .describe("Array of input/output regex mapping pairs for artifact paths")
});

export const DistributeReleaseBundleSchema = z.object({
  name: z.string().describe("Name of the Release Bundle to distribute"),
  version: z.string().describe("Version of the Release Bundle to distribute"),
  project: z.string().optional().describe("Project key"),
  repository_key: z.string().optional().default("release-bundles-v2").describe("Repository key"),
  auto_create_missing_repositories: z.boolean().optional().default(true)
    .describe("Whether to automatically create missing repositories on distribution targets"),
  distribution_rules: z.array(JFrogDistributionRuleSchema).optional().default([{site_name: "*"}])
    .describe("Rules defining which distribution targets to include"),
  modifications: JFrogDistributionModificationsSchema.optional()
    .describe("Optional path mapping specifications for artifacts on distribution targets")
});

export const JFrogDistributionSiteSchema = z.object({
  name: z.string().describe("Name of the Edge node target"),
  service_id: z.string().describe("Unique identifier of the Artifactory instance"),
  type: z.string().describe("Destination target device type")
});

export const JFrogDistributionResponseSchema = z.object({
  id: z.number().describe("ID number of the distribution operation"),
  sites: z.array(JFrogDistributionSiteSchema).describe("Array of destination target details")
});

/* End of Schema Section */   
import { z } from "zod";

/* Schema Section */

export const JFrogXrayArtifactSummaryErrrosSchema = z.object({
  identifier: z.string().describe("Unique identifier for the error"),
  error: z.string().optional().nullable().describe("Description of the error"),
});

export const JFrogXrayGeneralObjectSchema = z.object({
  component_id: z.string().describe("Unique identifier for the component"),
  name: z.string().describe("Name of the artifact"),
  path: z.string().describe("Path to the artifact"),
  pkg_type: z.string().describe("Package type of the artifact"),
  sha256: z.string().describe("SHA-256 checksum of the artifact"),
});

export const JFrogXrayCVE = z.object({
  cve: z.string().describe("Common Vulnerabilities and Exposures identifier"),
  cwe: z.array(z.string()).optional().nullable().describe("Common Weakness Enumeration identifier array associated with the CVE"),
  cvss_v2: z.string().optional().nullable().describe("CVSS score of the CVE version 2"),
  cvss_v3: z.string().optional().nullable().describe("CVSS score of the CVE version 3"),
});

export const JFrogXraySeverityReason = z.object({
  name: z.string().nullable().optional().describe("The reason for the severity assessment."),
  description: z.string().optional().nullable().describe("Detailed explanation supporting the severity assessment."),
  is_positive: z.boolean().optional().nullable().describe("Indicates whether the reason contributes positively to the severity assessment."),
});

export const JFrogXrayExtendedInformation = z.object({
  short_description: z.string().optional().nullable().describe("Short description of the issue, markdown supported"),
  full_description: z.string().optional().nullable().describe("Full description of the issue, markdown supported"),
  jfrog_research_severity: z.string().optional().nullable().describe("Severity of the issue according to JFrog research"),
  jfrog_research_severity_reasons: z.array(JFrogXraySeverityReason).optional().nullable().describe("Reasons for the severity assigned by JFrog research"),
  remediation: z.string().optional().nullable().describe("Remediation steps for the issue, markdown supported"),
});

export const JFrogXrayEvidence = z.object({
  column_names: z.array(z.string()).describe("Names of the columns in the evidence"),
  rows: z.array(z.array(z.array(z.string()))).describe("Rows of evidence data, each containing specific details about the issue"),
});

export const JFrogXrayDetails = z.object({
  file_path: z.string().describe("File path or location where the issue was detected"),
  details: z.string().describe("Detailed information about the applicability of the issue"),
});

export const JFrogXrayApplicability = z.object({
  scanner_available: z.boolean().describe("Indicates whether a scanner is available to check the applicability of the issue"),
  component_id: z.string().describe("Identifier for the component or environment where the issue is applicable"),
  source_comp_id: z.string().describe("Identifier for the source component or environment where the issue was detected"),
  cve_id: z.string().describe("Identifier for the Common Vulnerability and Exposure (CVE) associated with the issue"),
  scan_status: z.number().describe("Status of the scan (e.g., 1 for succssful, 0 for unsuccessful)"),
  applicability: z.boolean().describe("Indicates whether the issue is applicable to the specified component or environment"),
  scanner_explanation: z.string().describe("Explanation provided by the scanner regarding the applicability check"),
  evidence: z.array(JFrogXrayEvidence).describe("Evidence or additional information related to the applicability check"),
  info: z.string().describe("Additional information related to the applicability check"),
  details: z.array(JFrogXrayDetails).describe("Additional details or notes regarding the applicability of the issue")
});

export const FrogXrayApplicabilityDetails = z.object({
  component_id: z.string().describe("Unique identifier for the component"),
  source_comp_id: z.string().describe("Component id of the vulnerable package"),
  vulnerability_id: z.string().describe("Unique identifier for the vulnerability, CVE id"),
  result: z.enum(["not_scanned", "scanned", "applicable", "not_applicable", "undetermined", "rescan_required", "upgrade_required", "not_covered"]).describe("Contextual Analysis result."),
});

export const JFrogXrayIssueSchema = z.object({
  issue_id: z.string().describe("Unique identifier for the issue"),
  summary: z.string().describe("Summary of the issue"),
  description: z.string().optional().describe("Description of the issue"),
  issue_type: z.enum(["security", "license", "operational risk"]).describe("Type of the issue"),
  severity: z.enum(["Low", "Medium", "High", "Critical", "Unknown"]),
  provider: z.string().optional().nullable().describe("Provider of the issue"),
  cves: z.array(JFrogXrayCVE).optional().nullable().describe("List of CVEs associated with the issue"),
  created: z.string().optional().nullable().describe("Creation date of the issue in format YYYY-MM-DDYHH:mm:ss.SSSS"),
  impact_path: z.array(z.string()).optional().nullable().describe("List of paths impacted by the issue"),
  applicability: z.array(JFrogXrayApplicability).optional().nullable().describe("Array of applicability details about the issue"),
  applicability_details: z.array(FrogXrayApplicabilityDetails).optional().nullable().describe("Array of applicability details about the issue"),
  component_physical_paths: z.array(z.string()).optional().nullable().describe("List of physical paths of the component"),
  extended_information: JFrogXrayExtendedInformation.optional().nullable().describe("Extended information about the issue"),
});

export const JFrogXrayLicenseSchema = z.object({
  name: z.string().describe("Name of the license"),
  full_name: z.string().optional().nullable().describe("Full name of the license"),
  more_info_url: z.array(z.string()).optional().nullable().describe("Array of URLs providing more information about the license"),
  components: z.array(z.string()).describe("Array of components covered by the license"),
});

export const JFrogXrayOPRiskSchema = z.object({
  component_id: z.string().describe("Unique identifier for the component"),
  risk: z.string().optional().nullable().describe("Level of risk associated with the component"),
  risk_reason: z.string().optional().nullable().describe("Reason for the risk assessment"),
  is_eol: z.boolean().optional().nullable().describe("Indicates whether the component is End of Life (EOL)"),
  eol_message: z.string().optional().nullable().describe("Message related to the EOL status"),
  latest_version: z.string().optional().nullable().describe("Latest version of the component"),
  newer_versions: z.number().optional().nullable().describe("Number of newer versions available for the component"),
  cadence: z.number().optional().nullable().describe("Update cadence of the component"),
  commits: z.number().optional().nullable().describe("Number of commits made to the component"),
  committers: z.number().optional().nullable().describe("Number of committers involved in the component"),
  released: z.string().optional().nullable().describe("Timestamp indicating when the component was released"),
});

export const JFrogXrayArtifactsSummarySchema = z.object({
  general: JFrogXrayGeneralObjectSchema,
  issues: z.array(JFrogXrayIssueSchema).optional().nullable().describe("List of security issues related to the artifact"),
  licenses: z.array(JFrogXrayLicenseSchema).optional().nullable().describe("List of license issues related to the artifact"),
  operational_risks: z.array(JFrogXrayOPRiskSchema).optional().nullable().describe("List of operational risk issues related to the artifact"),
  error: z.string().optional().nullable().describe("Description of the error"),
});

export const GetArtifactsSummaryOutputSchema = z.object({
  artifacts: z.array(JFrogXrayArtifactsSummarySchema).describe("List summaries of artifacts"),
  errors: z.array(JFrogXrayArtifactSummaryErrrosSchema).optional().nullable().describe("List summary errors of artifacts summary"),
});

export const GetArtifactsSummaryInputSchema = z.object({
  paths: z.array(z.string()).describe("List of full paths of the artifacts, the full path should include the repositotiry name"),
});

export const ArtifactsSummaryIssuesTLDRSchema = z.object({
  artifact_name: z.string().describe("Name of the artifact"),
  artifact_issue_count: z.number().describe("Number of issues found in the artifact"),
  artifact_critical_count: z.number().describe("Number of critical issues found in the artifact"),
  artifact_high_count: z.number().describe("Number of high issues found in the artifact"),
  artifact_medium_count: z.number().describe("Number of medium issues found in the artifact"),
  artifact_low_count: z.number().describe("Number of low issues found in the artifact"),
  artifact_unknown_count: z.number().describe("Number of unknown issues found in the artifact"),
});

export const ArtifactsSummarySchema = z.object({
  artifacts_summary: z.array(ArtifactsSummaryIssuesTLDRSchema).describe("Number of issues found in the artifacts per artifact"),
});

export type GetArtifactsSummaryInput = z.infer<typeof GetArtifactsSummaryInputSchema>;
export type GetArtifactsSummaryOutput = z.infer<typeof GetArtifactsSummaryOutputSchema>;
export type ArtifactsSummaryOutput = z.infer<typeof ArtifactsSummarySchema>;
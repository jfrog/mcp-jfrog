import { z } from "zod";

const JFrogCatalogSupportedPackageTypes = [
    "pypi",
    "npm",
    "maven",
    "golang",
    "nuget",
    "huggingface",
    "rubygems"
] as const;

// Request Schemas
export const JFrogPackageSchema = z.object({
    type: z.enum(JFrogCatalogSupportedPackageTypes).describe("The type of package."),
    name: z.string().describe("The name of the package, as it appears in the package repository.")
});

export const JFrogPackageVersionSchema = JFrogPackageSchema.extend({
    version: z.string().default("latest").describe("The version of the package, as it appears in the package repository. Default value is 'latest'.")
});

// Response Schemas
export const JFrogCatalogLicenseInfoResponseSchema = z.object({
    expression: z.string().describe("SPDX license expression for this package.")
});

export const JFrogCatalogPackageVersionResponseSchema = z.object({
    version: z.string().describe("The version of the package, as it appears in the package repository."),
    published: z.string().describe("A timestamp of when this version was published."),
    licenseInfo: JFrogCatalogLicenseInfoResponseSchema.optional().describe("License information about this package.")
});

export const JFrogCatalogPackageVersionDetailResponseSchema = z.object({
    version: z.string(),
    published: z.string(),
    licenseInfo: JFrogCatalogLicenseInfoResponseSchema.optional()
});

export const JFrogCatalogPackageResponseSchema = z.object({
    name: z.string(),
    description: z.string(),
    vcsUrl: z.string(),
    homepage: z.string(),
    latestVersion: JFrogCatalogPackageVersionDetailResponseSchema.optional(),
    version: JFrogCatalogPackageVersionDetailResponseSchema.optional(),
    licenseInfo: JFrogCatalogLicenseInfoResponseSchema.optional(),
    versions: z.object({
        edges: z.array(z.object({
            node: JFrogCatalogPackageVersionDetailResponseSchema
        }))
    }).optional(),
    securityInfo: z.union([
        z.object({
            maliciousInfo: z.union([
                z.object({
                    knownToBeMalicious: z.boolean()
                }),
                z.null()
            ])
        }),
        z.null()
    ]).optional()
});

export const JFrogCatalogGraphQLResponseSchema = z.object({
    data: z.object({
        package: JFrogCatalogPackageResponseSchema.optional()
    }).optional()
});

export const JFrogCatalogVulnerabilityResponseSchema = z.object({
    name: z.string().describe("The identifier of the vulnerability."),
    description: z.string().describe("A description of the vulnerability."),
    severity: z.enum(["Critical", "High", "Medium", "Low", "Unknown"]).describe("The severity level of the vulnerability.")
});

export const JFrogCatalogPackageVersionVulnerabilitiesSchema = JFrogPackageVersionSchema.extend({
    pageSize: z.number().default(10).describe("Number of vulnerabilities to return per page."),
    pageCount: z.number().default(1).describe("Number of pages to return.")
});

export const JFrogCatalogVulnerabilityInfoSchema = z.object({
    name: z.string().describe("The identifier of the vulnerability (e.g. CVE ID)."),
    description: z.string().describe("A description of the vulnerability."),
    severity: JFrogCatalogVulnerabilityResponseSchema.shape.severity,
    vulnerablePackages: z.array(JFrogPackageVersionSchema).describe("List of packages affected by this vulnerability.")
});

export const JFrogCatalogVulnerabilityQuerySchema = z.object({
    cve_id: z.string().describe("The CVE ID or vulnerability identifier to look up."),
    pageSize: JFrogCatalogPackageVersionVulnerabilitiesSchema.shape.pageSize,
    pageCount: JFrogCatalogPackageVersionVulnerabilitiesSchema.shape.pageCount
});

// Type exports
export type JFrogPackageSchema = z.infer<typeof JFrogPackageSchema>;
export type JFrogPackageVersionSchema = z.infer<typeof JFrogPackageVersionSchema>;
export type JFrogCatalogLicenseInfoResponseSchema = z.infer<typeof JFrogCatalogLicenseInfoResponseSchema>;
export type JFrogCatalogPackageVersionResponseSchema = z.infer<typeof JFrogCatalogPackageVersionResponseSchema>;
export type JFrogCatalogPackageVersionDetailResponseSchema = z.infer<typeof JFrogCatalogPackageVersionDetailResponseSchema>;
export type JFrogCatalogPackageResponseSchema = z.infer<typeof JFrogCatalogPackageResponseSchema>;
export type JFrogCatalogGraphQLResponseSchema = z.infer<typeof JFrogCatalogGraphQLResponseSchema>;
export type JFrogCatalogVulnerabilityResponseSchema = z.infer<typeof JFrogCatalogVulnerabilityResponseSchema>;
export type JFrogCatalogPackageVersionVulnerabilitiesSchema = z.infer<typeof JFrogCatalogPackageVersionVulnerabilitiesSchema>;
export type JFrogCatalogVulnerabilityInfoSchema = z.infer<typeof JFrogCatalogVulnerabilityInfoSchema>;
export type JFrogCatalogVulnerabilityQuerySchema = z.infer<typeof JFrogCatalogVulnerabilityQuerySchema>;
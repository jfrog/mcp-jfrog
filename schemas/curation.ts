import { z } from "zod";

// Define the input schema for the tool
export const GetCurationPackageStatusInputSchema = z.object({
    package_type: z.enum(["pypi", "npm", "maven", "golang", "nuget", "huggingface", "rubygems"]).describe("The type of package."),
    package_name: z.string().describe("The name of the package, as it appears in the package repository."),
    package_version: z.string().describe("The version of the package, as it appears in the package repository."),
});

// Define the output schema for the tool
export const GetCurationPackageStatusOutputSchema = z.object({
    status: z.enum(["approved", "blocked", "inconclusive"]).describe("The curation status of the package."),
    details: z.string().optional().describe("Additional details about the curation status."),
});

// Type exports
export type GetCurationPackageStatusInput = z.infer<typeof GetCurationPackageStatusInputSchema>;
export type GetCurationPackageStatusOutput = z.infer<typeof GetCurationPackageStatusOutputSchema>; 
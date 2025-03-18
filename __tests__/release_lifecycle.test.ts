import { CreateReleaseBundleSchema, PromoteReleaseBundleSchema } from "../schemas/release_lifecycle.js";

describe("Release Lifecycle Schemas", () => {
  describe("CreateReleaseBundleSchema", () => {
    it("should validate a valid release bundle creation request", () => {
      const validInput = {
        release_bundle_name: "test-bundle",
        release_bundle_version: "1.0.0",
        source: {
          builds: [{
            build_name: "test-build",
            build_number: "1"
          }]
        }
      };

      const result = CreateReleaseBundleSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          release_bundle_name: "test-bundle",
          release_bundle_version: "1.0.0",
          skip_docker_manifest_resolution: false,
          source_type: "builds",
          source: {
            builds: [{
              build_name: "test-build",
              build_number: "1",
              build_repository: "artifactory-build-info",
              include_dependencies: false
            }]
          }
        });
      }
    });

    it("should reject invalid release bundle creation request", () => {
      const invalidInput = {
        release_bundle_name: "test-bundle",
        // missing required release_bundle_version
        source: {
          builds: []
        }
      };

      const result = CreateReleaseBundleSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe("PromoteReleaseBundleSchema", () => {
    it("should validate a valid promotion request", () => {
      const validInput = {
        name: "test-bundle",
        version: "1.0.0",
        environment: "production"
      };

      const result = PromoteReleaseBundleSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          name: "test-bundle",
          version: "1.0.0",
          environment: "production",
          async: true,
          operation: "copy",
          included_repository_keys: [],
          excluded_repository_keys: []
        });
      }
    });

    it("should reject invalid promotion request", () => {
      const invalidInput = {
        name: "test-bundle",
        // missing required version
        environment: "production"
      };

      const result = PromoteReleaseBundleSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });
}); 
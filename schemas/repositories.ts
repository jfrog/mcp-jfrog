/* Schema Section */
import { z } from "zod";
export const PackageTypeEnum = z.enum([
  "bower", "cargo", "chef", "cocoapods", "composer", "conan", "cran", 
  "debian", "docker", "Npm", "gems", "gitlfs", "go", "gradle", "helm", "ivy", 
  "maven", "nuget", "opkg", "p2", "pub", "puppet", "pypi", "rpm", "sbt", 
  "swift", "terraform", "vagrant", "yum", "generic", "alpine", "conda", "helmoci", 
  "huggingfaceml", "ansible", "oci"
]).describe("Package type of the repository");
  
export const BaseRepositorySchema = z.object({
  key: z.string().describe("the key of the repository"),
  rclass: z.enum([
    "local", "remote", "virtual", "federated"
  ]).describe("The repository type"),
  packageType: PackageTypeEnum,
  projectKey: z.string().optional().describe("Project key to assign the repository to"),
  environments: z.array(z.string()).optional().describe("Environments to assign the repository to"),
  description: z.string().optional().describe("Repository description")
});
  
export const CreateLocalRepoSchema = BaseRepositorySchema.extend({
  rclass: z.literal("local").describe("The repository type")
});
  
export const CreateRepositoryOptionsSchema = z.object({
  name: z.string().describe("Repository name"),
  description: z.string().optional().describe("Repository description"),
  private: z.boolean().optional().describe("Whether the repository should be private"),
  autoInit: z.boolean().optional().describe("Initialize with README.md"),
});
  
export const RepositoryTypeEnum = z.enum(["local", "remote", "virtual", "federated", "distribution"])
  .describe("Type of repository");
  
export const JFrogRepositoryCreateResponseSchema = z.string();
  
export const ListRepositoriesParamsSchema = z.object({
  type: RepositoryTypeEnum.optional().describe("Filter repositories by type"),
  packageType: PackageTypeEnum.optional().describe("Filter repositories by package type"),
  project: z.string().optional().describe("Filter repositories by project key")
});
  
export const RepositoryInfoSchema = z.object({
  key: z.string().describe("Repository key"),
  type: z.string().describe("Repository type"),
  description: z.string().optional().describe("Repository description"),
  url: z.string().describe("Repository URL"),
  packageType: z.string().describe("Package type of the repository")
});
  
export const ListRepositoriesResponseSchema = z.array(RepositoryInfoSchema);
  
export const VcsTypeEnum = z.enum(["GIT"]).default("GIT");
export const VcsGitProviderEnum = z.enum([
  "GITHUB", "GITHUBENTERPRISE", "BITBUCKET", "OLDSTASH", "STASH", "ARTIFACTORY", "CUSTOM"
]).default("GITHUB");
  
export const RemoteChecksumPolicyEnum = z.enum([
  "generate-if-absent", "fail", "ignore-and-generate", "pass-thru"
]).default("generate-if-absent");
  
export const ContentSyncSchema = z.object({
  enabled: z.boolean().default(false),
  statistics: z.object({
    enabled: z.boolean().default(false)
  }),
  properties: z.object({
    enabled: z.boolean().default(false)
  }),
  source: z.object({
    originAbsenceDetection: z.boolean().default(false)
  })
});

export const SetFolderPropertySchema = z.object({
  folderPath: z.string().describe("Path to the folder where properties should be set"),
  properties: z.record(z.string()).describe("Key-value pairs of properties to set"),
  recursive: z.boolean().default(false).describe("Whether to apply properties recursively to sub-folders")
});
  
export const defaultModels: Record<string, string> = {
  alpine: "http://dl-cdn.alpinelinux.org/alpine",
  ansible: "https://galaxy.ansible.com",
  bower: "https://github.com/",
  cargo: "https://index.crates.io/",
  chef: "https://supermarket.chef.io",
  cocoapods: "https://github.com/",
  composer: "https://github.com/",
  conan: "https://center.conan.io/",
  conda: "https://repo.anaconda.com/pkgs/main",
  cran: "https://cran.r-project.org/",
  debian: "http://archive.ubuntu.com/ubuntu/",
  docker: "https://registry-1.docker.io/",
  gems: "https://rubygems.org/",
  gitlfs: "https://github.com/",
  go: "https://gocenter.io/",
  gradle: "https://repo1.maven.org/maven2/",
  helm: "https://repo.chartcenter.io/",
  helmoci: "https://registry-1.docker.io/",
  huggingfaceml: "https://huggingface.co",
  ivy: "https://repo1.maven.org/maven2/",
  maven: "https://repo1.maven.org/maven2/",
  npm: "https://registry.npmjs.org",
  nuget: "https://www.nuget.org/",
  oci: "https://registry-1.docker.io/",
  opkg: "",
  p2: "",
  pub: "https://pub.dartlang.org",
  puppet: "https://forgeapi.puppetlabs.com/",
  pypi: "https://files.pythonhosted.org",
  rpm: "",
  sbt: "https://repo1.maven.org/maven2/",
  swift: "",
  terraform: "https://github.com/",
  vagrant: "",
  yum: "http://mirror.centos.org/centos/",
  generic: ""
};
  
export const CreateRemoteRepoSchema = BaseRepositorySchema.extend({
  rclass: z.literal("remote").describe("The repository type"),
  url: z.string().describe("URL to the remote repository"),
  username: z.string().optional().describe("Remote repository username"),
  password: z.string().optional().describe("Remote repository password"),
  proxy: z.string().optional().describe("Proxy key from Artifactory"),
  disableProxy: z.boolean().default(false),
  notes: z.string().optional().describe("Internal notes"),
  includesPattern: z.string().default("**/*"),
  excludesPattern: z.string().default(""),
  repoLayoutRef: z.string().optional(),
  remoteRepoLayoutRef: z.string().default(""),
  remoteRepoChecksumPolicyType: RemoteChecksumPolicyEnum,
  handleReleases: z.boolean().default(true),
  handleSnapshots: z.boolean().default(true),
  maxUniqueSnapshots: z.number().default(0),
  suppressPomConsistencyChecks: z.boolean().default(false),
  hardFail: z.boolean().default(false),
  offline: z.boolean().default(false),
  blackedOut: z.boolean().default(false),
  storeArtifactsLocally: z.boolean().default(true),
  socketTimeoutMillis: z.number().default(15000),
  localAddress: z.string().optional(),
  retrievalCachePeriodSecs: z.number().default(7200),
  missedRetrievalCachePeriodSecs: z.number().default(1800),
  unusedArtifactsCleanupPeriodHours: z.number().default(0),
  assumedOfflinePeriodSecs: z.number().default(300),
  fetchJarsEagerly: z.boolean().default(false),
  fetchSourcesEagerly: z.boolean().default(false),
  shareConfiguration: z.boolean().default(false),
  synchronizeProperties: z.boolean().default(false),
  blockMismatchingMimeTypes: z.boolean().default(true),
  xrayIndex: z.boolean().default(false),
  propertySets: z.array(z.string()).optional(),
  allowAnyHostAuth: z.boolean().default(false),
  enableCookieManagement: z.boolean().default(false),
  enableTokenAuthentication: z.boolean().default(false),
  forceNugetAuthentication: z.boolean().default(false),
  forceP2Authentication: z.boolean().default(false),
  forceConanAuthentication: z.boolean().default(false),
  metadataRetrievalTimeoutSecs: z.number().default(60),
  gitRegistryUrl: z.string().default("https://github.com/rust-lang/crates.io-index"),
  composerRegistryUrl: z.string().default("https://packagist.org"),
  pyPIRegistryUrl: z.string().default("https://pypi.org"),
  vcsType: VcsTypeEnum,
  vcsGitProvider: VcsGitProviderEnum,
  vcsGitDownloadUrl: z.string().default(""),
  bypassHeadRequests: z.boolean().default(false),
  clientTlsCertificate: z.string().default(""),
  externalDependenciesEnabled: z.boolean().default(false),
  externalDependenciesPatterns: z.array(z.string()).optional(),
  downloadRedirect: z.boolean().default(false),
  cdnRedirect: z.boolean().default(false),
  feedContextPath: z.string().optional(),
  downloadContextPath: z.string().optional(),
  v3FeedUrl: z.string().optional(),
  listRemoteFolderItems: z.boolean().default(false),
  contentSynchronisation: ContentSyncSchema.optional(),
  blockPushingSchema1: z.boolean().default(false),
  priorityResolution: z.boolean().default(false),
  disableUrlNormalization: z.boolean().default(false)
});
  
export const CreateVirtualRepoSchema = BaseRepositorySchema.extend({
  rclass: z.literal("virtual").describe("The repository type"),
  repositories: z.array(z.string()).describe("List of repository keys to include in the virtual repository"),
  description: z.string().optional().describe("The virtual repository public description"),
  notes: z.string().optional().describe("Some internal notes"),
  includesPattern: z.string().default("**/*").describe("Pattern to define artifacts to include"),
  excludesPattern: z.string().default("").describe("Pattern to define artifacts to exclude"),
  repoLayoutRef: z.string().optional().describe("Repository layout reference"),
  debianTrivialLayout: z.boolean().default(false).describe("Whether to use trivial layout for Debian repositories"),
  debianDefaultArchitectures: z.string().optional().describe("Default architectures for Debian repositories"),
  artifactoryRequestsCanRetrieveRemoteArtifacts: z.boolean().default(false),
  keyPair: z.string().optional().describe("Key pair used for signing"),
  pomRepositoryReferencesCleanupPolicy: z.enum([
    "discard_active_reference",
    "discard_any_reference",
    "nothing"
  ]).default("discard_active_reference"),
  defaultDeploymentRepo: z.string().optional().describe("Default deployment repository"),
  optionalIndexCompressionFormats: z.array(z.enum(["bz2", "lzma", "xz"])).optional(),
  forceMavenAuthentication: z.boolean().default(false).describe("Force authentication for Maven repositories"),
  externalDependenciesEnabled: z.boolean().default(false).describe("Enable external dependencies (Bower, npm, Go)"),
  externalDependenciesPatterns: z.array(z.string()).optional().describe("Patterns for external dependencies"),
  externalDependenciesRemoteRepo: z.string().optional().describe("Remote repository for external dependencies"),
  primaryKeyPairRef: z.string().optional().describe("Primary GPG key pair reference"),
  secondaryKeyPairRef: z.string().optional().describe("Secondary GPG key pair reference")
});

export const CreateFederatedRepoSchema = BaseRepositorySchema.extend({
  rclass: z.literal("federated").describe("The repository type"),
  members: z.array(z.object({
    url: z.string().describe("Full URL to ending with the repositoryName. Typically follows pattern: {baseUrl}/artifactory/{repoKey} where repoKey matches the primary repository key"),
    enabled: z.boolean().default(true).describe("Represents the active state of the federated member.")
  })).optional().describe("List of federated members. Members typically have the same repository key as the primary repository but on different Artifactory instances. URL format: {baseUrl}/artifactory/{repoKey} where repoKey should match the primary repository key for consistency"),
  description: z.string().optional().describe("The federated repository public description"),
  proxy: z.string().optional().describe("Proxy key"),
  disableProxy: z.boolean().default(false),
  notes: z.string().optional().describe("Some internal notes"),
  includesPattern: z.string().default("**/*").describe("Pattern to define artifacts to include"),
  excludesPattern: z.string().default("").describe("Pattern to define artifacts to exclude"),
  repoLayoutRef: z.string().default("maven-2-default").describe("Repository layout reference"),
  debianTrivialLayout: z.boolean().default(false).describe("Whether to use trivial layout for Debian repositories"),
  checksumPolicyType: z.enum([
    "client-checksums",
    "server-generated-checksums"
  ]).default("client-checksums"),
  handleReleases: z.boolean().default(true),
  handleSnapshots: z.boolean().default(true),
  maxUniqueSnapshots: z.number().default(0),
  maxUniqueTags: z.number().default(0),
  snapshotVersionBehavior: z.enum([
    "unique",
    "non-unique", 
    "deployer"
  ]).default("unique"),
  suppressPomConsistencyChecks: z.boolean().default(false),
  blackedOut: z.boolean().default(false),
  xrayIndex: z.boolean().default(false),
  propertySets: z.array(z.string()).optional(),
  archiveBrowsingEnabled: z.boolean().default(false),
  calculateYumMetadata: z.boolean().default(false),
  yumRootDepth: z.number().default(0),
  dockerApiVersion: z.string().default("V2"),
  enableFileListsIndexing: z.boolean().default(false),
  optionalIndexCompressionFormats: z.array(z.enum(["bz2", "lzma", "xz"])).optional(),
  downloadRedirect: z.boolean().default(false),
  cdnRedirect: z.boolean().default(false).describe("Applies to Artifactory Cloud Only"),
  blockPushingSchema1: z.boolean().default(false),
  primaryKeyPairRef: z.string().optional().describe("Primary GPG key pair reference"),
  secondaryKeyPairRef: z.string().optional().describe("Secondary GPG key pair reference"),
  priorityResolution: z.boolean().default(false).describe("Applies to all repository types excluding CocoaPods, Git LFS, NuGet V2, Opkg, RPM, Rust, Vagrant and VCS repositories")
});
  
export const JFrogPlatformReadinessSchema= z.object({
  code: z.string()
});

export type JFrogPlatformReadinessSchema = z.infer<typeof JFrogPlatformReadinessSchema>;

/* End of Schema Section */
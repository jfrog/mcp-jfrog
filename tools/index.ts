import {RepositoryTools} from "./repositories.js"
import {BuildsTools} from "./builds.js"
import { RuntimeTools } from "./runtime.js"
import { ReleaseLifecycleTools } from "./release_lifecycle.js"  
import { AccessTools } from "./access.js"
import { MissionControlTools } from "./mission_control.js"
import { AQLTools } from "./aql.js"
import { CatalogTools } from "./catalog.js"

export const tools =[
  ...RepositoryTools,
  ...BuildsTools,
  ...RuntimeTools,
  ...ReleaseLifecycleTools,
  ...AccessTools,
  ...MissionControlTools,
  ...AQLTools,
  ...CatalogTools
]
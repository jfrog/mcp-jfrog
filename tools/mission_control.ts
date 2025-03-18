import { z } from "zod";
import { zodToJsonSchema } from 'zod-to-json-schema';
import { jfrogRequest } from "../common/utils.js";
import * as mission_controlSchemas from '../schemas/mission_control.js';


export async function getAllJPDInstances() {
  const response = await jfrogRequest("/mc/api/v1/jpds", {
    method: "GET",
  });
   
  return mission_controlSchemas.JFrogJPDInstancesResponseSchema.parse(response);
}


export const JFrogEnvironmentDetailsSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  type: z.string()
});


/* Tools Section */

const getAllJPDInstancesTool = {
  name: "jfrog_list_associated_instances",
  description: "get all JFrog Platform Deployment (JPD) instances associated with the current JFrog Platform",
  inputSchema: zodToJsonSchema(z.object({})),
  outputSchema: zodToJsonSchema(mission_controlSchemas.JFrogJPDInstancesResponseSchema),
  handler: async (args: any) => {
    return await getAllJPDInstances();
  }
}

/* End of Tools creation Section */ 

export const MissionControlTools = [
  getAllJPDInstancesTool,
  
]
  
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { jfrogRequest } from "../common/utils.js";
import { JFrogWorkerReadinessSchema } from "../schemas/workers.js";
import { WorkersList } from "../schemas/workers.js";

async function fetchWorkersList() {
  const response = await jfrogRequest("/worker/api/v1/workers", {
    method: "GET",
  });
     
  return WorkersList.parse(response);
}

async function checkWorkerReadiness() {
  const response = await jfrogRequest("/worker/api/v1/system/liveness", {
    method: "GET",
  });
     
  return JFrogWorkerReadinessSchema.parse(response);
}

const getWorkerLiveliness = {
  name: "jfrog_get_worker_liveliness",
  description: "Useful for checking the liveliness of a worker status. Returns OK when the worker is alive.",
  inputSchema: zodToJsonSchema(z.object({})),
  outputSchema: zodToJsonSchema(JFrogWorkerReadinessSchema),
  handler: async () => {
    return await checkWorkerReadiness();
  }
};

const getWorkerList = {
  name: "jfrog_get_worker_list",
  description: "Useful for getting the list of workers.",
  inputSchema: zodToJsonSchema(z.object({})),
  outputSchema: zodToJsonSchema(WorkersList),
  handler: async () => {
    return await fetchWorkersList();
  }
};

export const WorkerTools = [
  getWorkerLiveliness,
  getWorkerList
];
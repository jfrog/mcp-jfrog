import { z } from "zod";

export const JFrogLicenseSchema = z.object({
  expired: z.boolean(),
  license_hash: z.string(),
  licensed_to: z.string(),
  type: z.string(),
  valid_through: z.string()
});
  
export const JFrogLocationSchema = z.object({
  city_name: z.string(),
  country_code: z.string(),
  latitude: z.number(),
  longitude: z.number()
});
  
export const JFrogServiceStatusSchema = z.object({
  code: z.string()
});
  
export const JFrogServiceSchema = z.object({
  status: JFrogServiceStatusSchema,
  type: z.string()
});
  
export const JFrogStatusSchema = z.object({
  code: z.string(),
  message: z.string(),
  warnings: z.array(z.string())
});
  
export const JFrogJPDInstanceSchema = z.object({
  id: z.string(),
  licenses: z.array(JFrogLicenseSchema),
  location: JFrogLocationSchema,
  name: z.string(),
  services: z.array(JFrogServiceSchema),
  status: JFrogStatusSchema,
  tags: z.array(z.string()),
  url: z.string()
});
  
export const JFrogJPDInstancesResponseSchema = z.array(JFrogJPDInstanceSchema);

/* End of Schema Section */   
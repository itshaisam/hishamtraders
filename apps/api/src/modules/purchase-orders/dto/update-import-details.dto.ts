import { z } from 'zod';

export const updateImportDetailsSchema = z.object({
  containerNo: z.string()
    .regex(/^[A-Z0-9-/]*$/i, 'Container number must only contain alphanumeric characters, hyphens, and forward slashes')
    .optional(),
  shipDate: z.string()
    .or(z.date())
    .transform(val => {
      if (typeof val === 'string') {
        return new Date(val);
      }
      return val;
    })
    .pipe(z.date())
    .optional(),
  arrivalDate: z.string()
    .or(z.date())
    .transform(val => {
      if (typeof val === 'string') {
        return new Date(val);
      }
      return val;
    })
    .pipe(z.date())
    .optional(),
});

export type UpdateImportDetailsRequest = z.infer<typeof updateImportDetailsSchema>;

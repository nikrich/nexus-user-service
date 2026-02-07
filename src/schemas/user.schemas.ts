import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

export const batchIdsSchema = z.object({
  ids: z.string().min(1, 'ids parameter is required'),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

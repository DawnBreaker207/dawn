import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './data/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    layout: z.string().nullable().optional(),
    summary: z.string().optional(),
    draft: z.boolean().default(false),
    images: z.array(z.string()).default([]),
  }),
});

const authors = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './data/authors' }),
  schema: z.object({
    name: z.string(),
    avatar: z.string(),
    occupation: z.string().optional(),
    company: z.string().nullable().optional(),
    email: z.string().optional(),
    twitter: z.string().optional(),
    linkedin: z.string().optional(),
    github: z.string().optional(),
  }),
});

export const collections = { blog, authors };
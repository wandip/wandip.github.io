import { defineCollection, z } from "astro:content";

const projectLinks = z.object({
  live: z.string().url().optional(),
  source: z.string().url().optional(),
  notes: z.string().url().optional()
});

const projects = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    why: z.string(),
    domain: z.array(z.string()),
    status: z.string(),
    stack: z.array(z.string()),
    featured: z.number(),
    links: projectLinks.default({}),
    date: z.coerce.date().optional()
  })
});

const writing = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    type: z.enum(["Essay", "AI Note", "Paper Walkthrough", "Fiction", "Business Note"]),
    date: z.coerce.date(),
    abstract: z.string(),
    tags: z.array(z.string()).default([]),
    readingTime: z.string()
  })
});

const reading = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    source: z.string(),
    theme: z.string(),
    takeaway: z.string(),
    related: z.string().optional()
  })
});

const signals = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    category: z.string(),
    year: z.string(),
    description: z.string(),
    link: z.string().url().optional()
  })
});

export const collections = { projects, writing, reading, signals };

import * as z from "zod";

const VideoFormSchema = z.object({
    title: z.string().min(1, "Title is required").max(100, "Title cannot exceed 100 characters"),
    description: z
        .string()
        .min(1, "Description is required")
        .max(300, "Description cannot exceed 300 characters"),
    category: z.string().min(1, "Category is required"),
    // tags: z.string(z.array(z.string())).optional(),
    tags: z
        .string()
        .optional()
        .transform((val) => {
            if (!val) return []; // Return empty array if no value
            try {
                const parsedTags = JSON.parse(val); // Parse the string
                return Array.isArray(parsedTags) ? parsedTags : []; // Return as array if valid
            } catch {
                return []; // Return empty array on parse error
            }
        }),
});

const VideoMetaDataFormSchema = z.object({
    title: z.string().min(1, "Title is required").max(100, "Title cannot exceed 100 characters"),
    description: z
        .string()
        .min(1, "Description is required")
        .max(300, "Description cannot exceed 300 characters"),
    category: z.string().min(1, "Category is required"),
    tags: z.array(z.string()).optional(),
    isPublished: z.boolean().default(true),
});

const VideoUpdateFormSchema = z.object({
    title: z.string().min(1, "Title is required").max(100, "Title cannot exceed 100 characters"),
    description: z
        .string()
        .min(1, "Description is required")
        .max(300, "Description cannot exceed 300 characters"),
    tags: z.array(z.string()).optional(),
});

export { VideoFormSchema, VideoMetaDataFormSchema, VideoUpdateFormSchema };

import * as z from 'zod';

const EditProfileFormSchema = z.object({
    firstName: z.string().min(1, 'Name is required'),
    lastName: z.string().min(1, 'Name is required'),
    bio: z
        .string()
        .min(1, 'Bio is required')
        .max(200, 'Bio cannot exceed 200 characters'),
    city: z.string().min(1, 'City is required'),
    gender: z.enum(['male', 'female', 'others']).optional(),
    birthday: z
        .string()
        .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Invalid date format')
        .optional(),
    websites: z.array(z.string().url('Invalid URL format')).optional(),
    socials: z.record(z.string().url('Invalid URL format')).optional(),
});

export { EditProfileFormSchema };

import * as z from 'zod';

const PasswordFormat = z
    .string()
    .min(1, 'Password is required')
    .max(15, 'Password cannot exceed 15 characters')
    .regex(/(?=.*[A-Z])/, 'Password must contain one uppercase letter required')
    .regex(/(?=.*[a-z])/, 'Password must contain one lowercase letter required')
    .regex(/(?=.*[0-9])/, 'Password must contain one digit one number required')
    .regex(
        /(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/,
        'Password must contain one special character required'
    );

const LoginFormSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, 'Password is required'),
});

const RegisterFormSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    username: z.string().min(1, 'Username is required'),
    email: z.string().email(),
    password: PasswordFormat,
});

const EmailVerificationFormSchema = z.object({
    email: z.string().email(),
    otpCode: z.string().min(6, 'OTP code is required'),
});

const ForgotPasswordFormSchema = z.object({
    email: z.string().email(),
});

const ResetPasswordFormSchema = z.object({
    password: z.string().min(1, 'Password is required'),
    confirmPassword: z.string().min(1, 'Confirm Password is required'),
});

const ChangePasswordFormSchema = z.object({
    oldPassword: z.string().min(1, 'Old Password is required'),
    newPassword: PasswordFormat,
    confirmPassword: z.string().min(1, 'Confirm Password is required'),
});

export {
    LoginFormSchema,
    RegisterFormSchema,
    EmailVerificationFormSchema,
    ForgotPasswordFormSchema,
    ResetPasswordFormSchema,
    ChangePasswordFormSchema,
};


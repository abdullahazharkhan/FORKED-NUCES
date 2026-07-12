import { z } from "zod";

export const MAX_PASSWORD_INPUT_LENGTH = 256;

export const nuEmailSchema = z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address")
    .refine(
        (value) => value.endsWith("@nu.edu.pk"),
        "Only @nu.edu.pk email addresses are allowed"
    );

export const newPasswordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(
        MAX_PASSWORD_INPUT_LENGTH,
        `Password must be ${MAX_PASSWORD_INPUT_LENGTH} characters or fewer`
    );

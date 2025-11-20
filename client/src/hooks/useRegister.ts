"use client"

import { useMutation, UseMutationResult, UseMutationOptions } from '@tanstack/react-query'
import { registerUser } from '../lib/api'

type RegisterPayload = { full_name: string; nu_email: string; password: string }
type RegisterResult = any

export function useRegister(
  options?: any
): UseMutationResult<RegisterResult, unknown, RegisterPayload, unknown> {
return useMutation<RegisterResult, unknown, RegisterPayload, unknown>(
    {
      mutationFn: (payload: RegisterPayload) => registerUser(payload),
      ...(options as any),
    } as any
)
}

export default useRegister

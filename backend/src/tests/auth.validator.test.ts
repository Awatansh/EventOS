import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema } from '../modules/auth/auth.schema';

describe('Auth Zod Validation Schemas', () => {
  describe('registerSchema', () => {
    it('should successfully validate a strong, correct payload', () => {
      const payload = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'StrongPassword123'
      };
      
      const result = registerSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should reject passwords that do not contain uppercase, lowercase, and numbers', () => {
      const payload = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'weakpassword'
      };
      
      const result = registerSchema.safeParse(payload);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        const errorMessages = result.error.errors.map(e => e.message);
        expect(errorMessages).toContain('Password must contain at least one uppercase letter');
        expect(errorMessages).toContain('Password must contain at least one digit');
      }
    });

    it('should reject short passwords', () => {
      const payload = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'A1a'
      };
      
      const result = registerSchema.safeParse(payload);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Password must be at least 8 characters');
      }
    });

    it('should reject invalid emails', () => {
      const payload = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'StrongPassword123'
      };
      
      const result = registerSchema.safeParse(payload);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Invalid email address');
      }
    });
  });

  describe('loginSchema', () => {
    it('should successfully validate a correct payload', () => {
      const payload = {
        email: 'john.doe@example.com',
        password: 'Password123'
      };
      
      const result = loginSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should enforce required fields', () => {
      const payload = {};
      
      const result = loginSchema.safeParse(payload);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        const errorFields = result.error.errors.map(e => e.path[0]);
        expect(errorFields).toContain('email');
        expect(errorFields).toContain('password');
      }
    });
  });
});

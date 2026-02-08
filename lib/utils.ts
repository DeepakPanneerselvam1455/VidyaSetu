
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function checkPasswordStrength(password: string) {
  let score = 0;
  if (!password) {
    return { score: 0, level: 'none' as const, text: '' };
  }

  // Very weak for short passwords
  if (password.length > 0 && password.length < 8) {
      return { score: 1, level: 'very weak' as const, text: 'Very Weak' };
  }

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);

  const diversity = (hasLower ? 1 : 0) + (hasUpper ? 1 : 0) + (hasNumber ? 1 : 0) + (hasSymbol ? 1 : 0);
  
  if (diversity >= 2) score++;
  if (diversity >= 3) score++;
  if (diversity >= 4) score++;
  
  let level: 'none' | 'very weak' | 'weak' | 'medium' | 'strong' | 'very strong';
  let text: string;
  switch (score) {
    case 0:
      level = 'none';
      text = '';
      break;
    case 1:
      level = 'very weak';
      text = 'Very Weak';
      break;
    case 2:
      level = 'weak';
      text = 'Weak';
      break;
    case 3:
      level = 'medium';
      text = 'Medium';
      break;
    case 4:
      level = 'strong';
      text = 'Strong';
      break;
    case 5:
      level = 'very strong';
      text = 'Very Strong';
      break;
    default:
      level = 'none';
      text = '';
  }

  return { score, level, text };
}

import { validateEmail, validatePassword, validateName } from './utils';

export interface ValidationErrors {
  [key: string]: string | null;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: ValidationErrors;
}

// Login form validation
export function validateLoginForm(email: string, password: string): FormValidationResult {
  const errors: ValidationErrors = {};

  if (!email.trim()) {
    errors.email = 'Email is required';
  } else if (!validateEmail(email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!password) {
    errors.password = 'Password is required';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Registration form validation
export function validateRegistrationForm(
  name: string,
  email: string,
  password: string,
  confirmPassword: string
): FormValidationResult {
  const errors: ValidationErrors = {};

  if (!name.trim()) {
    errors.name = 'Full name is required';
  } else if (!validateName(name)) {
    errors.name = 'Name must be between 2 and 100 characters';
  }

  if (!email.trim()) {
    errors.email = 'Email is required';
  } else if (!validateEmail(email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!password) {
    errors.password = 'Password is required';
  } else {
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      errors.password = passwordValidation.errors[0];
    }
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Course creation validation
export function validateCourseForm(data: {
  title: string;
  description: string;
  topics: string;
}): FormValidationResult {
  const errors: ValidationErrors = {};

  if (!data.title.trim()) {
    errors.title = 'Course name is required';
  } else if (data.title.length < 3) {
    errors.title = 'Course name must be at least 3 characters';
  } else if (data.title.length > 200) {
    errors.title = 'Course name must not exceed 200 characters';
  }

  if (!data.description.trim()) {
    errors.description = 'Course description is required';
  } else if (data.description.length < 10) {
    errors.description = 'Description must be at least 10 characters';
  } else if (data.description.length > 2000) {
    errors.description = 'Description must not exceed 2000 characters';
  }

  if (!data.topics.trim()) {
    errors.topics = 'At least one topic is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Quiz creation validation
export function validateQuizForm(data: {
  title: string;
  description?: string;
  difficulty: string;
}): FormValidationResult {
  const errors: ValidationErrors = {};

  if (!data.title.trim()) {
    errors.title = 'Quiz title is required';
  } else if (data.title.length < 3) {
    errors.title = 'Quiz title must be at least 3 characters';
  } else if (data.title.length > 200) {
    errors.title = 'Quiz title must not exceed 200 characters';
  }

  if (data.description && data.description.length > 1000) {
    errors.description = 'Description must not exceed 1000 characters';
  }

  if (!data.difficulty) {
    errors.difficulty = 'Difficulty level is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// User creation validation (admin)
export function validateUserCreationForm(data: {
  name: string;
  email: string;
  password: string;
  role: string;
}): FormValidationResult {
  const errors: ValidationErrors = {};

  if (!data.name.trim()) {
    errors.name = 'Full name is required';
  } else if (!validateName(data.name)) {
    errors.name = 'Name must be between 2 and 100 characters';
  }

  if (!data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!validateEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!data.password) {
    errors.password = 'Password is required';
  } else {
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.valid) {
      errors.password = passwordValidation.errors[0];
    }
  }

  if (!data.role) {
    errors.role = 'Role is required';
  } else if (!['student', 'mentor', 'admin'].includes(data.role)) {
    errors.role = 'Invalid role selected';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Profile update validation
export function validateProfileForm(data: {
  name: string;
  dob?: string;
  contact?: string;
}): FormValidationResult {
  const errors: ValidationErrors = {};

  if (!data.name.trim()) {
    errors.name = 'Full name is required';
  } else if (!validateName(data.name)) {
    errors.name = 'Name must be between 2 and 100 characters';
  }

  if (data.contact && data.contact.trim()) {
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
    if (!phoneRegex.test(data.contact.replace(/\s/g, ''))) {
      errors.contact = 'Please enter a valid phone number';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Forum thread validation
export function validateForumThreadForm(data: {
  title: string;
  content: string;
}): FormValidationResult {
  const errors: ValidationErrors = {};

  if (!data.title.trim()) {
    errors.title = 'Thread title is required';
  } else if (data.title.length < 5) {
    errors.title = 'Title must be at least 5 characters';
  } else if (data.title.length > 200) {
    errors.title = 'Title must not exceed 200 characters';
  }

  if (!data.content.trim()) {
    errors.content = 'Thread content is required';
  } else if (data.content.length < 10) {
    errors.content = 'Content must be at least 10 characters';
  } else if (data.content.length > 5000) {
    errors.content = 'Content must not exceed 5000 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Forum post validation
export function validateForumPostForm(content: string): FormValidationResult {
  const errors: ValidationErrors = {};

  if (!content.trim()) {
    errors.content = 'Post content is required';
  } else if (content.length < 5) {
    errors.content = 'Post must be at least 5 characters';
  } else if (content.length > 5000) {
    errors.content = 'Post must not exceed 5000 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Mentorship request validation
export function validateMentorshipRequestForm(message: string): FormValidationResult {
  const errors: ValidationErrors = {};

  if (!message.trim()) {
    errors.message = 'Please provide a message explaining why you want mentorship';
  } else if (message.length < 20) {
    errors.message = 'Message must be at least 20 characters';
  } else if (message.length > 1000) {
    errors.message = 'Message must not exceed 1000 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Tutoring session validation
export function validateTutoringSessionForm(data: {
  title: string;
  description: string;
  scheduledAt: string;
}): FormValidationResult {
  const errors: ValidationErrors = {};

  if (!data.title.trim()) {
    errors.title = 'Session title is required';
  } else if (data.title.length < 5) {
    errors.title = 'Title must be at least 5 characters';
  } else if (data.title.length > 200) {
    errors.title = 'Title must not exceed 200 characters';
  }

  if (!data.description.trim()) {
    errors.description = 'Session description is required';
  } else if (data.description.length < 10) {
    errors.description = 'Description must be at least 10 characters';
  } else if (data.description.length > 1000) {
    errors.description = 'Description must not exceed 1000 characters';
  }

  if (!data.scheduledAt) {
    errors.scheduledAt = 'Session date and time is required';
  } else {
    const scheduledDate = new Date(data.scheduledAt);
    const now = new Date();
    if (scheduledDate <= now) {
      errors.scheduledAt = 'Session must be scheduled in the future';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

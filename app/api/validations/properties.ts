import {isValid as isValidUlid} from 'ulid'
export type ValidationError = {
  status: number;
  message: string;
};

export type ValidationResponse = ValidationError | undefined;

export const validatePassword = (password: string): ValidationResponse => {
  // Password must be at least 8 characters long, contain at least one uppercase letter,
  // one lowercase letter, one number, and one special character.

  if (password.length < 8) {
    return {
      status: 400,
      message:
        "Password must be at least 8 characters.",
    };
  }
};

export const validateUsername = (username: string): ValidationResponse => {
  // Username must be at least 3 characters long and can only contain alphanumeric characters and underscores.
  if (!username) {
    return {
      status: 400,
      message: "Username is required.",
    };
  }
  if (username.length < 3) {
    return {
      status: 400,
      message: "Username must be at least 3 characters long.",
    };
  }
  if (username.length > 20) {
    return {
      status: 400,
      message: "Username must not exceed 20 characters.",
    };
  }
  const usernameRegex = /^[a-zA-Z0-9_]{3,}$/;
  if (!usernameRegex.test(username)) {
    return {
      status: 400,
      message:
        "Username must be at least 3 characters long and can only contain alphanumeric characters and underscores.",
    };
  }
};

export const validateUlidKey = (ulidKey: string): ValidationResponse => {
  // Validate that the ulidKey is a valid ULID
  if (!ulidKey) {
    return {
      status: 400,
      message: "ULID key is required.",
    };
  }
  if (!isValidUlid(ulidKey)) {
    return {
      status: 400,
      message: "Invalid ULID key format.",
    };
  }
}

export const validateUserKey = (userKey: string): ValidationResponse => {
  // The key should be a URL base64-encoded string with max length of 64 characters.
  if (!userKey) {
    return {
      status: 400,
      message: "User key is required.",
    };
  }
  if (userKey.length > 64) {
    return {
      status: 400,
      message: "User key must not exceed 64 characters.",
    };
  }
  const userKeyRegex = /^[a-zA-Z0-9_-]{1,64}$/;
  if (!userKeyRegex.test(userKey)) {
    return {
      status: 400,
      message:
        "User key must be a valid URL base64-encoded string with a maximum length of 64 characters.",
    };
  }
}

export const validateContent = (content: string): ValidationResponse => {
  // Content must not be empty and should not exceed 280 characters.
  if (!content) {
    return {
      status: 400,
      message: "Content is required.",
    };
  }
  if (content.length > 280) {
    return {
      status: 400,
      message: "Content must not exceed 500 characters.",
    };
  }
}
export class UserNotFoundError extends Error {
  constructor(emailOrId: string) {
    super(`User ${emailOrId} not found`);
    this.name = 'UserNotFoundError';
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid credentials');
    this.name = 'InvalidCredentialsError';
  }
}

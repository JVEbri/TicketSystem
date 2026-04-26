export type UserRole = 'USER';

export type UserProps = {
  id: string;
  email: string;
  password: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export class User {
  private readonly _id: string;
  private readonly _email: string;
  private readonly _password: string | null;
  private _displayName: string | null;
  private _avatarUrl: string | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: UserProps) {
    this._id = props.id;
    this._email = props.email;
    this._password = props.password;
    this._displayName = props.displayName;
    this._avatarUrl = props.avatarUrl;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  get id() {
    return this._id;
  }
  get email() {
    return this._email;
  }
  get password() {
    return this._password;
  }
  get displayName() {
    return this._displayName;
  }
  get avatarUrl() {
    return this._avatarUrl;
  }
  get createdAt() {
    return this._createdAt;
  }
  get updatedAt() {
    return this._updatedAt;
  }

  isLocal(): boolean {
    return this._password !== null;
  }

  updateProfile(displayName: string, avatarUrl?: string): void {
    this._displayName = displayName;
    if (avatarUrl) {
      this._avatarUrl = avatarUrl;
    }
    this._updatedAt = new Date();
  }

  toProps(): UserProps {
    return {
      id: this._id,
      email: this._email,
      password: this._password,
      displayName: this._displayName,
      avatarUrl: this._avatarUrl,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}

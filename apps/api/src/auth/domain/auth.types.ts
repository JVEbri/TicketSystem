export type AuthenticatedUser = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export type TokenPayload = {
  sub: string;
  email: string;
  displayName?: string;
};

export type AuthMode = 'local' | 'keycloak';

export type TokenInput = {
  id: string;
  email: string;
  displayName?: string;
};

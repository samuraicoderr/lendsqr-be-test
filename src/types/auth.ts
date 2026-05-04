export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isEmailVerified: boolean;
  isTwoFactorEnabled: boolean;
  isAdmin: boolean;
};

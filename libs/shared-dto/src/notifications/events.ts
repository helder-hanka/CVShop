export interface UserSellerRegisteredEvent {
  userId: string;
  email: string;
  verifyUrl: string;
  // Optionnel DEV UNIQUEMENT (voir env INCLUDE_PASSWORD_IN_EMAIL)
  plainPassword?: string;
}

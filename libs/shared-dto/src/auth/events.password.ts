export interface ForgotPasswordEvent {
  userId: string;
  email: string;
  resetUrl: string;
}

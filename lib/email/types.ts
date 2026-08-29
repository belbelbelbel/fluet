export type NotificationType =
  | "approval_verification_code"
  | "approval_requested"
  | "approval_approved"
  | "approval_changes_requested"
  | "approval_rejected"
  | "task_assigned"
  | "clients_assigned"
  | "team_invitation";

export interface NotificationEmailData {
  clientName?: string;
  platform?: string;
  scheduledFor?: string;
  content?: string;
  approvalLink?: string;
  expiresAt?: string;
  comment?: string;
  editLink?: string;
  taskType?: string;
  assignedToName?: string;
  description?: string;
  dueDate?: string;
  taskLink?: string;
  /** Team invite */
  inviterName?: string;
  inviteLink?: string;
  role?: string;
  /** Approval identity verification */
  code?: string;
  codeTtlMinutes?: number;
  /** Verified email of whoever made the decision, proves it was the client */
  decidedByEmail?: string;
  /** Client assignment */
  clientNames?: string[];
  dashboardLink?: string;
}

export interface SendNotificationResult {
  success: boolean;
  sent: boolean;
  message?: string;
  messageId?: string;
  error?: string;
}

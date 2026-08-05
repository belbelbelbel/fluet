export type NotificationType =
  | "approval_requested"
  | "approval_approved"
  | "approval_changes_requested"
  | "approval_rejected"
  | "task_assigned";

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
}

export interface SendNotificationResult {
  success: boolean;
  sent: boolean;
  message?: string;
  messageId?: string;
  error?: string;
}

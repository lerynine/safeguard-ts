import { ReportStatus, UserRole } from './constants/enums';

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
}

export interface Report {
  id: number;
  date: string;
  description: string;
  suggestion: string;
  status: ReportStatus;
  photoUrl?: string;
  findingType: string;
  estimationDate?: string;
  plannedAction?: string;
  closedAt?: string;
}

export interface BPOUpdateData {
  estimationDate?: string;
  plannedAction?: string;
  handlingReport?: string;
}
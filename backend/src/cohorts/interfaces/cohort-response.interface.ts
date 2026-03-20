export interface AdminCohortResponse {
  id: string;
  name: string;
  description?: string;
  inviteCode: string;
  inviteLink: string;
  courseIds: string[];
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
  accessKey?: string;
}

export interface StudentCohortResponse {
  id: string;
  name: string;
  description?: string;
  inviteCode: string;
  courseIds: string[];
  joinedAt: Date;
  joinedBy: 'link' | 'key';
}

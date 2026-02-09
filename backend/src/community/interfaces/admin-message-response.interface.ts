export interface AdminMessageResponse {
  id: string;
  subject: string;
  message: string;
  student: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
}

export interface StudentMessageResponse {
  id: string;
  subject: string;
  message: string;
  createdAt: Date;
}

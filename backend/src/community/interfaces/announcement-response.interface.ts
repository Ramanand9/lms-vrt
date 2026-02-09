export interface AnnouncementResponse {
  id: string;
  title: string;
  message: string;
  postedBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

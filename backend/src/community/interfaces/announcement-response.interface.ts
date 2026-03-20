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

export interface AnnouncementEmailDeliveryResponse {
  enabled: boolean;
  attempted: number;
  sent: number;
  failed: number;
}

export interface CreateAnnouncementResponse {
  announcement: AnnouncementResponse;
  emailDelivery: AnnouncementEmailDeliveryResponse;
}

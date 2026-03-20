export interface CourseMaterialResponse {
  title: string;
  url: string;
}

export interface CourseSubsectionResponse {
  title: string;
  description?: string;
  videoUrl: string;
  materials: CourseMaterialResponse[];
}

export interface CourseSectionResponse {
  title: string;
  description?: string;
  subsections: CourseSubsectionResponse[];
}

export interface CourseResponse {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  price: number;
  sections: CourseSectionResponse[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

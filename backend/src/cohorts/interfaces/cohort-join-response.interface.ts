export interface CohortJoinResponse {
  message: string;
  alreadyMember: boolean;
  allocatedCourses: number;
  cohort: {
    id: string;
    name: string;
    description?: string;
    inviteCode: string;
  };
}

export interface RotateCohortKeyResponse {
  cohortId: string;
  accessKey: string;
}

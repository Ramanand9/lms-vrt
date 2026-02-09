import { Role } from '../../common/enums/role.enum';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

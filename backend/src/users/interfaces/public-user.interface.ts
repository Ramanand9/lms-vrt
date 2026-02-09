import { Role } from '../../common/enums/role.enum';

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

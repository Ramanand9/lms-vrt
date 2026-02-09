import { Role } from '../../common/enums/role.enum';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: Role;
}

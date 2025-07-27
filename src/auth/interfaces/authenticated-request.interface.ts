import { User } from 'src/database/schema';

export interface IAuthenticatedRequest extends Request {
  user: Omit<User, 'password'>;
}

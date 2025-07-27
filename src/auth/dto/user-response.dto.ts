import { users } from '../../database/schema';

export class UserResponseDto {
  id: number;
  username: string;
  email: string;
  fullName: string;
  createdAt: Date | null;

  constructor(entity: typeof users.$inferSelect) {
    this.id = entity.id;
    this.username = entity.username;
    this.email = entity.email;
    this.fullName = entity.fullName;
    this.createdAt = entity.createdAt;
  }
}

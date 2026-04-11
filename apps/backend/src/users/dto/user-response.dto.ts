// users/dto/user-response.dto.ts

import { User } from 'generated/prisma/client';

export class UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  city: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isOnboarded: boolean;
  creditBalance: number;
  profileScore: number;
  avgRating: number | null;
  avgPedagogy: number | null;
  avgPunctuality: number | null;
  avgCommunication: number | null;
  sessionsCompleted: number;
  hasBadgeFiable: boolean;
  createdAt: Date;

  constructor(user: User) {
    this.id = user.id;
    this.email = user.email;
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.city = user.city;
    this.bio = user.bio;
    this.avatarUrl = user.avatarUrl;
    this.isOnboarded = user.isOnboarded;
    this.creditBalance = user.creditBalance;
    this.profileScore = user.profileScore;
    this.avgRating = user.avgRating ? Number(user.avgRating) : null;
    this.avgPedagogy = user.avgPedagogy ? Number(user.avgPedagogy) : null;
    this.avgPunctuality = user.avgPunctuality
      ? Number(user.avgPunctuality)
      : null;
    this.avgCommunication = user.avgCommunication
      ? Number(user.avgCommunication)
      : null;
    this.sessionsCompleted = user.sessionsCompleted;
    this.hasBadgeFiable = user.hasBadgeFiable;
    this.createdAt = user.createdAt;
  }
}

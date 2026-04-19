import { apiClient } from '@/lib/api/api-client';
import type { UserMe } from '@/types/api';

export async function updateProfile(dto: Partial<UserMe>) {
  const res = await apiClient.patch<{ message: string; user: UserMe }>('/users/me', dto);
  return res.data;
}

export async function addSkill(dto: { skillId: string; type: string; level: string }) {
  const res = await apiClient.post('/users/me/skills', dto);
  return res.data;
}

export async function updateSkillLevel(userSkillId: string, level: string) {
  const res = await apiClient.patch(`/users/me/skills/${userSkillId}`, { level });
  return res.data;
}

export async function removeSkill(userSkillId: string) {
  const res = await apiClient.delete(`/users/me/skills/${userSkillId}`);
  return res.data;
}

export async function searchSkills(q: string) {
  const res = await apiClient.get<{ id: string; name: string; category: string }[]>(
    `/skills/search?q=${encodeURIComponent(q)}`,
  );
  return res.data;
}

export async function getUserProfile() {
  const res = await apiClient.get<UserMe>('/users/me');
  return res.data;
}

import type { User, ClaimHistory, ApiResponse } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

export const api = {
  // Get all users with rankings
  async getUsers(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/users`);
    const data: ApiResponse<User[]> = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch users');
    }
    return data.data;
  },

  // Claim points for a user
  async claimPoints(userId: string): Promise<{ points: number }> {
    const response = await fetch(`${API_BASE_URL}/claims/claim-points`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });
    const data: ApiResponse<{ points: number }> = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to claim points');
    }
    return data.data;
  },

  // Get user's claim history
  async getClaimHistory(): Promise<ClaimHistory[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/claims/history`);
      const data: ApiResponse<ClaimHistory[]> = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch claim history');
      }
      // Ensure we always return an array
      return Array.isArray(data.data) ? data.data : [];
    } catch (error) {
      console.error('Error fetching claim history:', error);
      return [];
    }
  },
};

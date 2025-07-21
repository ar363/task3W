import { useState, useEffect } from 'react';
import type { User } from '../types';
import { api } from '../services/api';
import { socketService } from '../services/socket';

export const Leaderboard = () => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const userData = await api.getUsers();
        setUsers(userData);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    // Initial fetch
    fetchUsers();

    // Setup WebSocket listeners
    const socket = socketService.getSocket();
    
    socket.on('pointsClaimed', () => {
      fetchUsers(); // Refresh the leaderboard when points are claimed
    });

    return () => {
      socket.off('pointsClaimed');
    };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <h2 className="px-6 py-4 text-lg font-semibold border-b">Leaderboard</h2>
      <div className="divide-y">
        {users.map((user) => (
          <div
            key={user._id}
            className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center space-x-4">
              <span className={`
                w-6 h-6 flex items-center justify-center rounded-full
                ${user.rank === 1 ? 'bg-yellow-400' :
                  user.rank === 2 ? 'bg-gray-300' :
                  user.rank === 3 ? 'bg-amber-600' :
                  'bg-gray-100'}
              `}>
                {user.rank}
              </span>
              <span className="font-medium">{user.name}</span>
            </div>
            <span className="text-gray-600">{user.totalPoints} points</span>
          </div>
        ))}
      </div>
    </div>
  );
};

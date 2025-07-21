import { useState, useEffect } from 'react';
import type { User } from '../types';
import { api } from '../services/api';

interface UserSelectProps {
  onUserSelect: (user: User) => void;
  selectedUser?: User;
}

export const UserSelect = ({ onUserSelect, selectedUser }: UserSelectProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const userData = await api.getUsers();
        setUsers(userData);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 text-left bg-white border rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {selectedUser ? selectedUser.name : 'Select a user'}
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg">
          {users.map((user) => (
            <button
              key={user._id}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
              onClick={() => {
                onUserSelect(user);
                setIsOpen(false);
              }}
            >
              {user.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

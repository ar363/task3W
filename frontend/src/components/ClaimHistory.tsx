import { useState, useEffect } from 'react';
import type { ClaimHistory } from '../types';
import { api } from '../services/api';
import { socketService } from '../services/socket';

export const ClaimHistoryList = () => {
  const [history, setHistory] = useState<ClaimHistory[]>([]);
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const historyData = await api.getClaimHistory();
        // Ensure historyData is an array
        setHistory(Array.isArray(historyData) ? historyData : []);
      } catch (error) {
        console.error('Error fetching claim history:', error);
        setHistory([]); // Set empty array on error
      }
    };

    // Initial fetch
    fetchHistory();

    // Setup WebSocket listeners
    const socket = socketService.getSocket();
    
    socket.on('newClaim', (newClaim: ClaimHistory) => {
      setHistory(prev => Array.isArray(prev) ? [newClaim, ...prev] : [newClaim]);
    });

    return () => {
      socket.off('newClaim');
    };
  }, []);

  // Ensure history is an array before slicing
  const paginatedHistory = Array.isArray(history) ? history.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  ) : [];

  const totalPages = Math.ceil(history.length / itemsPerPage);

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <h2 className="px-6 py-4 text-lg font-semibold border-b">Claim History</h2>
      <div className="divide-y">
        {paginatedHistory.map((claim) => (
          <div
            key={claim._id}
            className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
          >
            <div>
              <span className="font-medium">{claim.userName}</span>
              <span className="text-gray-500 ml-2">claimed</span>
              <span className="font-medium ml-2">{claim.points} points</span>
            </div>
            <span className="text-sm text-gray-500">
              {new Date(claim.timestamp).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
      
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t flex justify-between items-center">
          <button
            className="px-3 py-1 rounded border hover:bg-gray-50 disabled:opacity-50"
            onClick={() => setPage(p => p - 1)}
            disabled={page === 1}
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            className="px-3 py-1 rounded border hover:bg-gray-50 disabled:opacity-50"
            onClick={() => setPage(p => p + 1)}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

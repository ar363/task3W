import { useState, useEffect } from "react"
import { Crown, Trophy, Star, Coins, Sparkles, Award, Zap } from "lucide-react"
import { Button } from "./components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select"
import { Card, CardContent } from "./components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar"
import { Badge } from "./components/ui/badge"
import Pusher from "pusher-js"
import type { User } from "./types/index.ts"
import type { ClaimHistory } from "./types/index.ts"
import './App.css'

interface LocalUser {
  id: string
  name: string
  avatar: string
  points: number
  rank: number
}

interface PointHistory {
  id: string
  userId: string
  userName: string
  pointsAwarded: number
  timestamp: Date
  totalPointsAfter: number
}

const initialUsers: LocalUser[] = [
  { id: "1", name: "Alex Johnson", avatar: "/placeholder.svg?height=80&width=80", points: 1650, rank: 1 },
  { id: "2", name: "Sarah Chen", avatar: "/placeholder.svg?height=80&width=80", points: 1420, rank: 2 },
  { id: "3", name: "Mike Rodriguez", avatar: "/placeholder.svg?height=80&width=80", points: 1180, rank: 3 },
  { id: "4", name: "Emma Wilson", avatar: "/placeholder.svg?height=80&width=80", points: 950, rank: 4 },
  { id: "5", name: "David Kim", avatar: "/placeholder.svg?height=80&width=80", points: 820, rank: 5 },
  { id: "6", name: "Lisa Thompson", avatar: "/placeholder.svg?height=80&width=80", points: 690, rank: 6 },
  { id: "7", name: "James Brown", avatar: "/placeholder.svg?height=80&width=80", points: 580, rank: 7 },
  { id: "8", name: "Anna Davis", avatar: "/placeholder.svg?height=80&width=80", points: 470, rank: 8 },
  { id: "9", name: "Tom Wilson", avatar: "/placeholder.svg?height=80&width=80", points: 360, rank: 9 },
  { id: "10", name: "Grace Lee", avatar: "/placeholder.svg?height=80&width=80", points: 250, rank: 10 },
  { id: "11", name: "Marcus Johnson", avatar: "/placeholder.svg?height=80&width=80", points: 220, rank: 11 },
  { id: "12", name: "Priya Patel", avatar: "/placeholder.svg?height=80&width=80", points: 200, rank: 12 },
  { id: "13", name: "Chris Wong", avatar: "/placeholder.svg?height=80&width=80", points: 180, rank: 13 },
  { id: "14", name: "Maya Singh", avatar: "/placeholder.svg?height=80&width=80", points: 160, rank: 14 },
  { id: "15", name: "Ryan Miller", avatar: "/placeholder.svg?height=80&width=80", points: 140, rank: 15 },
]

export default function App() {
  const [users, setUsers] = useState<LocalUser[]>(initialUsers)
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [pointHistory, setPointHistory] = useState<PointHistory[]>([])
  const [isClaimingPoints, setIsClaimingPoints] = useState(false)
  const [lastClaimedPoints, setLastClaimedPoints] = useState<number | null>(null)
  const [showAllUsers, setShowAllUsers] = useState(false)

  // Load users from backend on component mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users`)
        const result = await response.json()
        
        if (result.success && result.data) {
          const convertedUsers = result.data.map((user: User, index: number) => ({
            id: user._id,
            name: user.name,
            avatar: user.avatar || "/placeholder.svg?height=80&width=80",
            points: user.totalPoints || 0,
            rank: index + 1
          }))
          setUsers(convertedUsers)
        }
      } catch (error) {
        console.error('Error loading users:', error)
        // Fallback to initial users if API fails
      }
    }

    const loadClaimHistory = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/claims/history`)
        const result = await response.json()
        
        if (result.success && result.data && result.data.history) {
          const convertedHistory = result.data.history.map((claim: ClaimHistory) => ({
            id: claim._id,
            userId: claim.userId,
            userName: claim.userName,
            pointsAwarded: claim.pointsAwarded,
            timestamp: new Date(claim.timestamp),
            totalPointsAfter: claim.totalPointsAfter,
          }))
          setPointHistory(convertedHistory)
        }
      } catch (error) {
        console.error('Error loading claim history:', error)
      }
    }
    
    loadUsers()
    loadClaimHistory()
  }, [])

  // Pusher setup - only for backup/sync, not primary updates
  useEffect(() => {
    const pusher = new Pusher(import.meta.env.VITE_PUSHER_KEY, {
      cluster: import.meta.env.VITE_PUSHER_CLUSTER,
    })

    const channel = pusher.subscribe("leaderboard-channel")

    // Disable real-time leaderboard updates since we're doing optimistic updates
    // channel.bind("leaderboard-update", (data: User[]) => {
    //   const convertedUsers = data.map((user, index) => ({
    //     id: user._id,
    //     name: user.name,
    //     avatar: user.avatar || "/placeholder.svg?height=80&width=80",
    //     points: user.totalPoints || 0,
    //     rank: index + 1
    //   }))
    //   setUsers(convertedUsers)
    // })

    // Keep claim updates as backup in case optimistic update fails
    channel.bind("claim-update", (data: ClaimHistory) => {
      // Only update if we don't already have this claim in our optimistic updates
      setPointHistory((prev) => {
        const exists = prev.some(entry => 
          entry.userId === data.userId && 
          Math.abs(entry.timestamp.getTime() - new Date(data.timestamp).getTime()) < 5000
        )
        if (!exists) {
          const historyEntry: PointHistory = {
            id: data._id,
            userId: data.userId,
            userName: data.userName,
            pointsAwarded: data.pointsAwarded,
            timestamp: new Date(data.timestamp),
            totalPointsAfter: data.totalPointsAfter,
          }
          return [historyEntry, ...prev]
        }
        return prev
      })
    })

    return () => {
      channel.unbind_all()
      pusher.unsubscribe("leaderboard-channel")
      pusher.disconnect()
    }
  }, [])

  const formatPoints = (points: number | undefined | null): string => {
    if (points == null || points === undefined) {
      return "0"
    }
    if (points >= 1000) {
      return `${(points / 1000).toFixed(1)}k`
    }
    return points.toString()
  }

  const claimPoints = async () => {
    if (!selectedUserId) return

    setIsClaimingPoints(true)
    
    // Find the user we're updating
    const selectedUser = users.find(u => u.id === selectedUserId)
    if (!selectedUser) {
      setIsClaimingPoints(false)
      return
    }

    // Generate random points (same logic as backend)
    const pointsToAward = Math.floor(Math.random() * 91) + 10 // 10-100 points
    
    // OPTIMISTIC UPDATE - Update UI immediately
    const updatedUsers = users.map(user => {
      if (user.id === selectedUserId) {
        return {
          ...user,
          points: user.points + pointsToAward
        }
      }
      return user
    })
    
    // Sort users by points and update ranks
    const sortedUsers = [...updatedUsers].sort((a, b) => b.points - a.points)
    const rankedUsers = sortedUsers.map((user, index) => ({
      ...user,
      rank: index + 1
    }))
    
    // Update users state immediately
    setUsers(rankedUsers)
    
    // Add to history immediately
    const newHistoryEntry: PointHistory = {
      id: `temp-${Date.now()}`, // Temporary ID
      userId: selectedUserId,
      userName: selectedUser.name,
      pointsAwarded: pointsToAward,
      timestamp: new Date(),
      totalPointsAfter: selectedUser.points + pointsToAward,
    }
    setPointHistory(prev => [newHistoryEntry, ...prev])
    setLastClaimedPoints(pointsToAward)
    setSelectedUserId("")
    
    try {
      // Make API call to backend (but don't wait for it to update UI)
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/claims/claim-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUserId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to claim points')
      }

      const result = await response.json()
      
      if (!result.success) {
        // If backend fails, revert the optimistic update
        console.error('Backend failed:', result.message)
        // Reload data to get the correct state
        window.location.reload()
      }
      // If successful, the backend data might be slightly different but that's fine
      // The real-time updates will eventually sync everything
    } catch (error) {
      console.error('Error claiming points:', error)
      // Revert optimistic update on error
      window.location.reload()
    }

    setIsClaimingPoints(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950">
      {/* Clean Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]"></div>

      <div className="relative">
        {/* Header Section */}
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="p-4 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full shadow-2xl">
              <Crown className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-6xl font-black bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent mb-4">
            ELITE ARENA
          </h1>
          <p className="text-slate-400 text-xl font-medium">Champions Leaderboard</p>

          {lastClaimedPoints && (
            <div className="mt-8">
              <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-4 text-xl font-bold shadow-xl animate-pulse">
                <Zap className="w-6 h-6 mr-2" />+{lastClaimedPoints} Points Awarded!
              </Badge>
            </div>
          )}
        </div>

        <div className="max-w-6xl mx-auto px-6 space-y-12">
          {/* Control Panel */}
          <Card className="bg-slate-900/80 backdrop-blur-sm border-slate-700 shadow-2xl">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-6 items-end">
                <div>
                  <label className="block text-slate-300 text-lg font-semibold mb-4">Select Champion</label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger className="h-14 bg-slate-800 border-slate-600 text-slate-200 text-lg">
                      <SelectValue placeholder="Choose a warrior..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id} className="text-slate-200 focus:bg-slate-700">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
                                {user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{user.name}</span>
                            <Badge variant="outline" className="border-amber-500 text-amber-400">
                              {formatPoints(user.points)}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={claimPoints}
                  disabled={!selectedUserId || isClaimingPoints}
                  className="h-14 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900 font-bold text-lg shadow-xl transition-all duration-200 hover:scale-105"
                >
                  {isClaimingPoints ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Award className="w-5 h-5" />
                      <span>AWARD POINTS</span>
                    </div>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Champions Podium */}
          <Card className="bg-slate-900/80 backdrop-blur-sm border-slate-700 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 p-6">
              <h2 className="text-3xl font-black text-center text-slate-900">🏆 HALL OF CHAMPIONS 🏆</h2>
            </div>

            <CardContent className="p-12">
              <div className="grid grid-cols-3 gap-8 items-end">
                {/* 2nd Place */}
                {users[1] && (
                  <div className="text-center">
                    <div className="mb-6">
                      <div className="relative inline-block">
                        <Avatar className="w-20 h-20 ring-4 ring-slate-400 shadow-xl">
                          <AvatarImage src={users[1].avatar || "/placeholder.svg"} alt={users[1].name} />
                          <AvatarFallback className="bg-gradient-to-br from-slate-500 to-slate-600 text-white font-bold text-xl">
                            {users[1].name
                              .split(" ")
                              .map((n) => n.charAt(0))
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-slate-500 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold">2</span>
                        </div>
                      </div>
                    </div>
                    <h3 className="font-bold text-slate-200 text-lg mb-2">{users[1].name}</h3>
                    <div className="flex items-center justify-center space-x-1 mb-6">
                      <Coins className="w-5 h-5 text-amber-400" />
                      <span className="font-bold text-xl text-slate-200">{formatPoints(users[1].points)}</span>
                    </div>
                    <div className="w-full h-20 bg-gradient-to-t from-slate-600 to-slate-400 rounded-t-lg flex items-center justify-center shadow-lg">
                      <Trophy className="w-8 h-8 text-white" />
                    </div>
                  </div>
                )}

                {/* 1st Place */}
                {users[0] && (
                  <div className="text-center">
                    <div className="mb-8">
                      <div className="relative inline-block">
                        <Avatar className="w-28 h-28 ring-6 ring-amber-400 shadow-2xl">
                          <AvatarImage src={users[0].avatar || "/placeholder.svg"} alt={users[0].name} />
                          <AvatarFallback className="bg-gradient-to-br from-amber-500 to-yellow-500 text-white font-bold text-2xl">
                            {users[0].name
                              .split(" ")
                              .map((n) => n.charAt(0))
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -top-3 -right-3 w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center shadow-xl">
                          <Crown className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>
                    <h3 className="font-black text-amber-400 text-2xl mb-2">{users[0].name}</h3>
                    <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 px-4 py-2 font-bold mb-4">
                      CHAMPION
                    </Badge>
                    <div className="flex items-center justify-center space-x-2 mb-8">
                      <Coins className="w-6 h-6 text-amber-400" />
                      <span className="font-black text-3xl text-amber-400">{formatPoints(users[0].points)}</span>
                    </div>
                    <div className="w-full h-28 bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-lg flex items-center justify-center shadow-xl">
                      <Crown className="w-12 h-12 text-white" />
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {users[2] && (
                  <div className="text-center">
                    <div className="mb-6">
                      <div className="relative inline-block">
                        <Avatar className="w-20 h-20 ring-4 ring-amber-600 shadow-xl">
                          <AvatarImage src={users[2].avatar || "/placeholder.svg"} alt={users[2].name} />
                          <AvatarFallback className="bg-gradient-to-br from-amber-600 to-orange-600 text-white font-bold text-xl">
                            {users[2].name
                              .split(" ")
                              .map((n) => n.charAt(0))
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold">3</span>
                        </div>
                      </div>
                    </div>
                    <h3 className="font-bold text-slate-200 text-lg mb-2">{users[2].name}</h3>
                    <div className="flex items-center justify-center space-x-1 mb-6">
                      <Coins className="w-5 h-5 text-amber-400" />
                      <span className="font-bold text-xl text-slate-200">{formatPoints(users[2].points)}</span>
                    </div>
                    <div className="w-full h-16 bg-gradient-to-t from-amber-700 to-amber-500 rounded-t-lg flex items-center justify-center shadow-lg">
                      <Star className="w-7 h-7 text-white" />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Other Competitors */}
          <div>
            <h3 className="text-2xl font-bold text-slate-200 mb-6 flex items-center">
              <Sparkles className="w-6 h-6 mr-3 text-purple-400" />
              Rising Stars
            </h3>
            <div className="grid gap-4">
              {users.slice(3, showAllUsers ? undefined : 3 + 7).map((user) => (
                <Card
                  key={user.id}
                  className="bg-slate-900/60 backdrop-blur-sm border-slate-700 hover:bg-slate-900/80 transition-all duration-200 hover:scale-[1.01] shadow-lg"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-6">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg flex-shrink-0">
                        <span className="text-white font-bold text-lg">{user.rank}</span>
                      </div>

                      <Avatar className="w-14 h-14 ring-2 ring-slate-600 shadow-lg flex-shrink-0">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
                          {user.name
                            .split(" ")
                            .map((n) => n.charAt(0))
                            .join("")}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-200 text-lg truncate">{user.name}</h3>
                        <p className="text-slate-400">Rank #{user.rank}</p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center space-x-2">
                          <Coins className="w-5 h-5 text-amber-400" />
                          <span className="text-xl font-bold text-slate-200">{formatPoints(user.points)}</span>
                        </div>
                        <p className="text-slate-400 text-sm">points</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Show More / Show Less Button */}
            {users.length > 10 && (
              <div className="text-center mt-6">
                <Button
                  onClick={() => setShowAllUsers(!showAllUsers)}
                  variant="outline"
                  className="bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white"
                >
                  {showAllUsers ? (
                    <>
                      <Star className="w-4 h-4 mr-2" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Show More ({users.length - 10} more)
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Point History */}
          <Card className="bg-slate-900/80 backdrop-blur-sm border-slate-700 shadow-2xl">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-slate-200 mb-6 flex items-center">
                <Award className="w-6 h-6 mr-3 text-amber-400" />
                Recent Awards
              </h3>
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {pointHistory.length > 0 ? (
                  pointHistory.slice(0, 10).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                      <div>
                        <p className="font-bold text-slate-200">{entry.userName}</p>
                        <p className="text-slate-400 text-sm">{entry.timestamp.toLocaleTimeString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-400">+{entry.pointsAwarded} pts</p>
                        <p className="text-slate-400 text-sm">Total: {formatPoints(entry.totalPointsAfter)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Award className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No awards yet. Start claiming points!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="h-12"></div>
      </div>
    </div>
  )
}

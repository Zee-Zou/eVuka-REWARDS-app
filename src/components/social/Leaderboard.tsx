import { useState } from "react";
import { Card } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Trophy } from "lucide-react";
import { LeaderboardEntry } from "@/lib/database.types";

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    user_id: "1",
    display_name: "John Doe",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
    points: 5000,
    rank: 1,
  },
  // Add more mock entries
];

export const Leaderboard = () => {
  const [entries] = useState<LeaderboardEntry[]>(MOCK_LEADERBOARD);

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Trophy className="text-yellow-500" />
        Leaderboard
      </h2>
      <div className="space-y-4">
        {entries.map((entry) => (
          <div
            key={entry.user_id}
            className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
          >
            <span className="text-2xl font-bold w-8">{entry.rank}</span>
            <Avatar>
              <AvatarImage src={entry.avatar_url} />
              <AvatarFallback>{entry.display_name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{entry.display_name}</p>
              <p className="text-sm text-gray-600">{entry.points} points</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

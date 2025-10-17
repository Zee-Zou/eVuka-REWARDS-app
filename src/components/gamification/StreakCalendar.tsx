import React from "react";
import { Card } from "@/components/ui/card";
import { Flame, Calendar } from "lucide-react";
import { motion } from "framer-motion";

interface StreakCalendarProps {
  currentStreak?: number;
  longestStreak?: number;
  daysThisMonth?: number[];
  month?: string;
}

const StreakCalendar = ({
  currentStreak = 3,
  longestStreak = 7,
  daysThisMonth = [1, 2, 3, 5, 6, 9, 10, 13, 14, 15, 16, 17],
  month = "June",
}: StreakCalendarProps) => {
  // Generate calendar days for the current month
  const totalDays = 30; // Simplified for demo
  const today = new Date().getDate();

  const days = Array.from({ length: totalDays }, (_, i) => i + 1);

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Calendar size={18} />
          <h3 className="font-bold">{month} Activity</h3>
        </div>
        <div className="flex items-center gap-1 text-orange-500">
          <Flame size={18} />
          <span className="font-bold">{currentStreak} day streak!</span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
          <div key={i} className="text-center text-xs text-gray-500">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const isActive = daysThisMonth.includes(day);
          const isToday = day === today;
          const isPast = day < today;
          const isFuture = day > today;

          return (
            <motion.div
              key={day}
              className={`w-full aspect-square rounded-full flex items-center justify-center text-xs ${isToday ? "border-2 border-primary" : ""} ${
                isActive
                  ? "bg-green-500 text-white"
                  : isPast
                    ? "bg-gray-200 text-gray-500"
                    : "bg-gray-100 text-gray-400"
              }`}
              whileHover={{ scale: 1.1 }}
              animate={isToday ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.5 }}
            >
              {day}
            </motion.div>
          );
        })}
      </div>

      <div className="mt-4 text-xs text-gray-600 flex justify-between">
        <span>Current streak: {currentStreak} days</span>
        <span>Longest streak: {longestStreak} days</span>
      </div>
    </Card>
  );
};

export default StreakCalendar;

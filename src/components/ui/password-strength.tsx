import React from "react";
import { Progress } from "./progress";
import { checkPasswordStrength } from "@/lib/security-enhanced";

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

export function PasswordStrength({
  password,
  className = "",
}: PasswordStrengthProps) {
  const { score, feedback } = checkPasswordStrength(password);

  // Map score to colors and labels
  const getColorByScore = () => {
    switch (score) {
      case 0:
        return "bg-red-500";
      case 1:
        return "bg-orange-500";
      case 2:
        return "bg-yellow-500";
      case 3:
        return "bg-blue-500";
      case 4:
        return "bg-green-500";
      default:
        return "bg-gray-300";
    }
  };

  const getLabelByScore = () => {
    switch (score) {
      case 0:
        return "Very Weak";
      case 1:
        return "Weak";
      case 2:
        return "Fair";
      case 3:
        return "Good";
      case 4:
        return "Strong";
      default:
        return "";
    }
  };

  if (!password) return null;

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex justify-between items-center text-xs">
        <span className="text-muted-foreground">Password strength</span>
        <span
          className={`font-medium ${score >= 3 ? "text-green-600" : score >= 2 ? "text-yellow-600" : "text-red-600"}`}
        >
          {getLabelByScore()}
        </span>
      </div>
      <Progress
        value={(score / 4) * 100}
        className="h-1"
        indicatorClassName={getColorByScore()}
      />
      {feedback && (
        <p className="text-xs text-muted-foreground mt-1">{feedback}</p>
      )}
    </div>
  );
}

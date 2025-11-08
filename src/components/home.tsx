import React, { useState, useEffect } from "react";
import { PointsTransaction } from "@/lib/database.types";
import CaptureInterface from "./receipt-capture/CaptureInterface";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { useAuth } from "@/providers/AuthProvider";
import { LogOut, User, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  processReceipt,
  calculatePoints,
  ProcessedReceipt,
} from "@/lib/receipt-processing";
import { checkForDuplicates } from "@/lib/duplicate-detection";
import {
  saveReceipt,
  savePointsTransaction,
  getPointsHistory,
} from "@/lib/receipts";
import PointsHistory from "./receipt-capture/PointsHistory";
import { useToast } from "@/components/ui/use-toast";
import { assertUser, handleError } from "@/lib/error-handler";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RewardsMarketplace } from "./rewards/RewardsMarketplace";
import { Leaderboard } from "./social/Leaderboard";
import { AnalyticsDashboard } from "./analytics/AnalyticsDashboard";
import PriceTrendsDashboard from "./analytics/PriceTrendsDashboard";
import GamificationHub from "./gamification/GamificationHub";
import ShoppingList from "./shopping/ShoppingList";

const Home = () => {
  const { user, userProfile, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);

  useEffect(() => {
    if (user?.id) {
      loadPointsHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadPointsHistory = async () => {
    try {
      assertUser(user);
      const history = await getPointsHistory(user.id);
      setTransactions(history);
    } catch (error) {
      handleError(error);
    }
  };

  const [receiptHistory, setReceiptHistory] = useState<ProcessedReceipt[]>([]);

  const handleCapture = async (image: string) => {
    try {
      assertUser(user);
      const result = await processReceipt(image);

      // Check for duplicate receipts
      const duplicateCheck = checkForDuplicates(result, receiptHistory);
      result.isDuplicate = duplicateCheck.isDuplicate;
      result.duplicateScore = duplicateCheck.score;

      // If it's a duplicate, warn the user but still allow submission
      if (result.isDuplicate) {
        toast({
          variant: "warning",
          title: "Possible Duplicate Receipt",
          description:
            "This receipt appears similar to one you've already submitted.",
        });
      }

      const timeDiff = 0; // For now, assume immediate submission
      const points = calculatePoints(result.total, timeDiff);

      // Save receipt and points transaction
      const receipt = await saveReceipt({
        user_id: user.id,
        image_url: image,
        total: result.total,
        store: result.store,
        points_earned: points,
      });

      await savePointsTransaction({
        user_id: user.id,
        points,
        source: "Receipt Scan",
        receipt_id: receipt.id,
      });

      // Update receipt history for duplicate detection
      setReceiptHistory((prev) => [...prev, result]);

      // Refresh points history
      await loadPointsHistory();

      toast({
        title: "Success",
        description: `Receipt processed successfully! You earned ${points} points.`,
      });

      return points;
    } catch (error) {
      handleError(error);
      return 0;
    }
  };

  const handleSuccess = () => {
    // Success callback
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <Card className="mb-6 p-6 bg-white">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                eVuka Rewards
              </h1>
              <p className="text-gray-600">
                Capture your receipts and earn points towards exciting rewards
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User size={16} />
                  <span>
                    {userProfile?.first_name && userProfile?.last_name
                      ? `${userProfile.first_name} ${userProfile.last_name}`
                      : user.email}
                  </span>
                </div>
                {userProfile?.username && (
                  <span className="text-xs text-gray-500">
                    @{userProfile.username}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/profile")}
                  title="Edit Profile"
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => signOut()}
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="capture">
          <TabsList className="mb-6">
            <TabsTrigger value="capture">Capture Receipt</TabsTrigger>
            <TabsTrigger value="shopping-list">Shopping List</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="price-trends">Price Trends</TabsTrigger>
            <TabsTrigger value="gamification">Achievements</TabsTrigger>
          </TabsList>

          <TabsContent value="capture">
            <div className="grid md:grid-cols-[1fr,300px] gap-6">
              <CaptureInterface
                onCapture={handleCapture}
                onSuccess={handleSuccess}
              />
              <PointsHistory transactions={transactions} />
            </div>
          </TabsContent>

          <TabsContent value="rewards">
            <RewardsMarketplace />
          </TabsContent>

          <TabsContent value="leaderboard">
            <Leaderboard />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="price-trends">
            <PriceTrendsDashboard />
          </TabsContent>

          <TabsContent value="shopping-list">
            <ShoppingList />
          </TabsContent>

          <TabsContent value="gamification">
            <GamificationHub />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Home;
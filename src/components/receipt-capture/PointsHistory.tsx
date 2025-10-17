import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

interface PointsTransaction {
  id: string;
  points: number;
  source: string;
  createdAt: string;
  store?: string;
}

interface PointsHistoryProps {
  transactions?: PointsTransaction[];
}

const PointsHistory = ({ transactions = [] }: PointsHistoryProps) => {
  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Points History</h3>
      <ScrollArea className="h-[300px]">
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="font-medium">{transaction.source}</p>
                {transaction.store && (
                  <p className="text-sm text-gray-600">{transaction.store}</p>
                )}
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(transaction.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <p className="text-lg font-bold text-primary">
                +{transaction.points}
              </p>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default PointsHistory;

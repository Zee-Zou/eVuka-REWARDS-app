import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Progress } from "../ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { LineChart, BarChart, PieChart, Settings, X } from "lucide-react";
import { Line, Bar, Pie } from "react-chartjs-2";
import { Button } from "../ui/button";
import { offlineStorage } from "@/lib/offline-storage";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
);

interface DashboardWidget {
  id: string;
  title: string;
  visible: boolean;
  order: number;
}

export const AnalyticsDashboard = () => {
  // Dashboard customization state
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([
    { id: "summary-cards", title: "Summary Cards", visible: true, order: 0 },
    { id: "charts", title: "Charts", visible: true, order: 1 },
    {
      id: "recent-activity",
      title: "Recent Activity",
      visible: true,
      order: 2,
    },
  ]);

  // Load user preferences on component mount
  useEffect(() => {
    const loadDashboardPreferences = async () => {
      try {
        const savedWidgets = await offlineStorage.getPreference<
          DashboardWidget[]
        >("dashboard-widgets", widgets);
        setWidgets(savedWidgets);
      } catch (error) {
        // Error loading preferences - use defaults
      }
    };

    loadDashboardPreferences();
  }, []);

  // Save user preferences when widgets change
  const saveDashboardPreferences = async () => {
    try {
      await offlineStorage.savePreference("dashboard-widgets", widgets);
      setIsCustomizing(false);
    } catch (error) {
      // Error saving preferences - continue anyway
    }
  };

  // Toggle widget visibility
  const toggleWidgetVisibility = (id: string) => {
    setWidgets(
      widgets.map((widget) =>
        widget.id === id ? { ...widget, visible: !widget.visible } : widget,
      ),
    );
  };

  // Sample data - replace with real data from your backend
  const pointsData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Points Earned",
        data: [65, 59, 80, 81, 56, 55],
        fill: false,
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
      },
    ],
  };

  const categoryData = {
    labels: ["Groceries", "Electronics", "Clothing", "Restaurants", "Other"],
    datasets: [
      {
        data: [30, 20, 15, 25, 10],
        backgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
        ],
      },
    ],
  };

  const activityData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Receipts Scanned",
        data: [12, 19, 3, 5, 2, 3, 7],
        backgroundColor: "rgba(53, 162, 235, 0.5)",
      },
    ],
  };

  // Get sorted visible widgets
  const visibleWidgets = widgets
    .filter((widget) => widget.visible)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="p-6 space-y-6 bg-white">
      {/* Dashboard Customization Controls */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsCustomizing(!isCustomizing)}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          {isCustomizing ? "Done" : "Customize"}
        </Button>
      </div>

      {/* Customization Panel */}
      {isCustomizing && (
        <Card className="p-4 mb-6 border-2 border-dashed border-primary/50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Customize Dashboard</h3>
            <Button
              variant="primary"
              size="sm"
              onClick={saveDashboardPreferences}
            >
              Save Layout
            </Button>
          </div>
          <div className="space-y-2">
            {widgets.map((widget) => (
              <div
                key={widget.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
              >
                <span>{widget.title}</span>
                <Button
                  variant={widget.visible ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleWidgetVisibility(widget.id)}
                >
                  {widget.visible ? "Visible" : "Hidden"}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Dashboard Widgets */}
      <div className="space-y-6">
        {/* Summary Cards */}
        {visibleWidgets.find((w) => w.id === "summary-cards") && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">Total Points</h3>
              <p className="text-3xl font-bold">5,230</p>
              <Progress value={75} className="mt-4" />
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">Receipts Scanned</h3>
              <p className="text-3xl font-bold">42</p>
              <p className="text-sm text-gray-600 mt-2">+12% from last month</p>
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">Current Level</h3>
              <p className="text-3xl font-bold">Level 5</p>
              <Progress value={60} className="mt-4" />
            </Card>
          </div>
        )}

        {/* Charts */}
        {visibleWidgets.find((w) => w.id === "charts") && (
          <Tabs defaultValue="points">
            <TabsList>
              <TabsTrigger value="points" className="flex items-center gap-2">
                <LineChart className="w-4 h-4" /> Points History
              </TabsTrigger>
              <TabsTrigger
                value="categories"
                className="flex items-center gap-2"
              >
                <PieChart className="w-4 h-4" /> Categories
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <BarChart className="w-4 h-4" /> Activity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="points" className="mt-6">
              <Card className="p-6">
                <Line data={pointsData} options={{ responsive: true }} />
              </Card>
            </TabsContent>

            <TabsContent value="categories" className="mt-6">
              <Card className="p-6">
                <Pie data={categoryData} options={{ responsive: true }} />
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="mt-6">
              <Card className="p-6">
                <Bar data={activityData} options={{ responsive: true }} />
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Recent Activity */}
        {visibleWidgets.find((w) => w.id === "recent-activity") && (
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Receipt Scan</p>
                  <p className="text-sm text-gray-600">Grocery Store</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
                <p className="text-lg font-bold text-primary">+120</p>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Reward Redemption</p>
                  <p className="text-sm text-gray-600">$10 Gift Card</p>
                  <p className="text-xs text-gray-500">Yesterday</p>
                </div>
                <p className="text-lg font-bold text-destructive">-1000</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  LineChart,
  BarChart,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Calendar,
  Filter,
} from "lucide-react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  Filler,
);
import { format, subDays } from "date-fns";

interface PriceData {
  date: string;
  price: number;
  store: string;
}

interface ProductData {
  id: string;
  name: string;
  category: string;
  priceHistory: PriceData[];
  lowestPrice: number;
  highestPrice: number;
  averagePrice: number;
}

interface StoreComparison {
  store: string;
  price: number;
  difference: number;
  lastUpdated: string;
}

// Mock data generator
const generateMockData = (): ProductData[] => {
  const categories = [
    "Groceries",
    "Electronics",
    "Household",
    "Personal Care",
    "Beverages",
  ];
  const stores = [
    "Walmart",
    "Target",
    "Kroger",
    "Costco",
    "Whole Foods",
    "Safeway",
  ];
  const products = [
    "Organic Milk",
    "Bread",
    "Eggs",
    "Chicken Breast",
    "Ground Beef",
    "Bananas",
    "Apples",
    "Cereal",
    "Coffee",
    "Paper Towels",
    "Laundry Detergent",
    "Shampoo",
    "Toothpaste",
    "Soda",
    "Water Bottles",
  ];

  return products.map((product, index) => {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const basePrice = Math.random() * 20 + 2; // Random price between $2 and $22

    // Generate price history for the last 7 days
    const priceHistory: PriceData[] = [];
    for (let i = 7; i >= 0; i--) {
      const date = format(subDays(new Date(), i), "yyyy-MM-dd");

      // Generate prices for different stores on this date
      stores.forEach((store) => {
        // Add some variation to prices between stores and days
        const variation = (Math.random() - 0.5) * 2; // -1 to 1
        const price = basePrice + variation;

        priceHistory.push({
          date,
          price: parseFloat(price.toFixed(2)),
          store,
        });
      });
    }

    // Calculate stats
    const prices = priceHistory.map((item) => item.price);
    const lowestPrice = Math.min(...prices);
    const highestPrice = Math.max(...prices);
    const averagePrice = parseFloat(
      (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2),
    );

    return {
      id: `product-${index}`,
      name: product,
      category,
      priceHistory,
      lowestPrice,
      highestPrice,
      averagePrice,
    };
  });
};

const PriceTrendsDashboard = () => {
  const [products] = useState<ProductData[]>(generateMockData());
  const [filteredProducts, setFilteredProducts] =
    useState<ProductData[]>(products);
  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("7days");
  const [storeFilter, setStoreFilter] = useState<string>("all");

  // Filter products based on search and category
  useEffect(() => {
    let filtered = products;

    if (searchQuery) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (product) => product.category === selectedCategory,
      );
    }

    setFilteredProducts(filtered);

    // Select the first product by default if none is selected
    if (filtered.length > 0 && !selectedProduct) {
      setSelectedProduct(filtered[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCategory, products]);

  // Get unique categories for filter
  const categories = [
    "all",
    ...new Set(products.map((product) => product.category)),
  ];

  // Get unique stores for filter
  const stores = [
    "all",
    ...new Set(
      products.flatMap((product) =>
        product.priceHistory.map((item) => item.store),
      ),
    ),
  ];

  // Prepare chart data for the selected product
  const prepareChartData = () => {
    if (!selectedProduct) return null;

    // Filter by store if needed
    let filteredHistory = selectedProduct.priceHistory;
    if (storeFilter !== "all") {
      filteredHistory = filteredHistory.filter(
        (item) => item.store === storeFilter,
      );
    }

    // Filter by time range
    if (timeRange !== "7days") {
      const daysToFilter = timeRange === "3days" ? 3 : 30;
      const cutoffDate = format(
        subDays(new Date(), daysToFilter),
        "yyyy-MM-dd",
      );
      filteredHistory = filteredHistory.filter(
        (item) => item.date >= cutoffDate,
      );
    }

    // Group by date and calculate average price per date
    const groupedByDate = filteredHistory.reduce(
      (acc, item) => {
        if (!acc[item.date]) {
          acc[item.date] = { total: 0, count: 0 };
        }
        acc[item.date].total += item.price;
        acc[item.date].count += 1;
        return acc;
      },
      {} as Record<string, { total: number; count: number }>,
    );

    // Convert to array and sort by date
    const dateLabels = Object.keys(groupedByDate).sort();
    const averagePrices = dateLabels.map((date) => {
      const { total, count } = groupedByDate[date];
      return parseFloat((total / count).toFixed(2));
    });

    return {
      labels: dateLabels,
      datasets: [
        {
          label: "Average Price",
          data: averagePrices,
          borderColor: "rgb(75, 192, 192)",
          tension: 0.1,
          fill: false,
        },
      ],
    };
  };

  // Prepare store comparison data
  const prepareStoreComparison = () => {
    if (!selectedProduct) return [];

    // Filter by time range
    let filteredHistory = selectedProduct.priceHistory;
    if (timeRange !== "7days") {
      const daysToFilter = timeRange === "3days" ? 3 : 30;
      const cutoffDate = format(
        subDays(new Date(), daysToFilter),
        "yyyy-MM-dd",
      );
      filteredHistory = filteredHistory.filter(
        (item) => item.date >= cutoffDate,
      );
    }

    // Get the most recent date in the data
    const dates = [...new Set(filteredHistory.map((item) => item.date))].sort();
    const mostRecentDate = dates[dates.length - 1];

    // Get prices from different stores on the most recent date
    const storeData = filteredHistory
      .filter((item) => item.date === mostRecentDate)
      .map((item) => ({
        store: item.store,
        price: item.price,
        lastUpdated: mostRecentDate,
      }));

    // Calculate the average price
    const avgPrice =
      storeData.reduce((sum, item) => sum + item.price, 0) / storeData.length;

    // Add difference from average
    return storeData
      .map((item) => ({
        ...item,
        difference: parseFloat(
          (((item.price - avgPrice) / avgPrice) * 100).toFixed(1),
        ),
      }))
      .sort((a, b) => a.price - b.price); // Sort by price ascending
  };

  const chartData = prepareChartData();
  const storeComparison = prepareStoreComparison();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-2 sm:gap-4">
        <div className="flex-1">
          <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">
            Price Trends Dashboard
          </h2>
          <p className="text-muted-foreground">
            Compare prices across stores and track price changes over time
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3days">Last 3 Days</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>

          <Select value={storeFilter} onValueChange={setStoreFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="All Stores" />
            </SelectTrigger>
            <SelectContent>
              {stores.map((store) => (
                <SelectItem key={store} value={store}>
                  {store === "all" ? "All Stores" : store}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
        {/* Product Search & Selection */}
        <Card className="p-4 md:col-span-1">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant={
                    selectedCategory === category ? "default" : "outline"
                  }
                  className="cursor-pointer"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category === "all" ? "All Categories" : category}
                </Badge>
              ))}
            </div>

            <div className="h-[300px] sm:h-[400px] overflow-y-auto space-y-2 mt-2 sm:mt-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className={`p-3 rounded-md cursor-pointer ${selectedProduct?.id === product.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm flex justify-between">
                    <span>{product.category}</span>
                    <span>${product.averagePrice.toFixed(2)} avg</span>
                  </div>
                </div>
              ))}

              {filteredProducts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No products found matching your search
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Price Trends Chart */}
        <Card className="p-4 md:col-span-2">
          {selectedProduct ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold">{selectedProduct.name}</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{selectedProduct.category}</Badge>
                  <span className="text-sm text-muted-foreground">
                    Price range: ${selectedProduct.lowestPrice.toFixed(2)} - $
                    {selectedProduct.highestPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              <Tabs defaultValue="trends">
                <TabsList>
                  <TabsTrigger
                    value="trends"
                    className="flex items-center gap-2"
                  >
                    <LineChart className="h-4 w-4" /> Price Trends
                  </TabsTrigger>
                  <TabsTrigger
                    value="stores"
                    className="flex items-center gap-2"
                  >
                    <BarChart className="h-4 w-4" /> Store Comparison
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="trends" className="pt-4">
                  {chartData ? (
                    <div className="h-[250px] sm:h-[300px]">
                      <Line
                        data={chartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: false,
                              ticks: {
                                callback: (value) => `$${value}`,
                              },
                              grid: {
                                color: "rgba(0, 0, 0, 0.1)",
                              },
                            },
                            x: {
                              grid: {
                                display: false,
                              },
                              ticks: {
                                maxRotation: 45,
                                minRotation: 45,
                                autoSkip: true,
                                maxTicksLimit: 8,
                              },
                            },
                          },
                          plugins: {
                            legend: {
                              position: "top",
                              labels: {
                                boxWidth: 10,
                                usePointStyle: true,
                                pointStyle: "circle",
                              },
                            },
                            tooltip: {
                              backgroundColor: "rgba(0, 0, 0, 0.7)",
                              titleFont: {
                                size: 12,
                              },
                              bodyFont: {
                                size: 12,
                              },
                              padding: 10,
                              displayColors: false,
                              callbacks: {
                                label: (context: any) =>
                                  `Price: $${context.parsed.y.toFixed(2)}`,
                              },
                            },
                          },
                          interaction: {
                            mode: "index",
                            intersect: false,
                          },
                          elements: {
                            line: {
                              tension: 0.3,
                            },
                            point: {
                              radius: 3,
                              hoverRadius: 5,
                            },
                          },
                        }}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No price data available
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="stores" className="pt-4">
                  {storeComparison.length > 0 ? (
                    <div className="space-y-4">
                      {storeComparison.map((item, index) => (
                        <div key={item.store} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <div className="font-medium">{item.store}</div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">
                                ${item.price.toFixed(2)}
                              </span>
                              {item.difference !== 0 && (
                                <span
                                  className={`text-sm flex items-center ${item.difference < 0 ? "text-green-500" : "text-red-500"}`}
                                >
                                  {item.difference < 0 ? (
                                    <>
                                      <ArrowDownRight className="h-3 w-3" />{" "}
                                      {Math.abs(item.difference)}% below avg
                                    </>
                                  ) : (
                                    <>
                                      <ArrowUpRight className="h-3 w-3" />{" "}
                                      {item.difference}% above avg
                                    </>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                          <Progress
                            value={100 - (index / storeComparison.length) * 100}
                            className="h-2"
                            indicatorClassName={
                              index === 0 ? "bg-green-500" : undefined
                            }
                          />
                          <div className="text-xs text-muted-foreground">
                            Last updated: {item.lastUpdated}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No store comparison data available
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
              Select a product to view price trends
            </div>
          )}
        </Card>
      </div>

      {/* Recent Price Changes */}
      <Card className="p-3 sm:p-4">
        <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-4">
          Recent Price Changes
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
          {products.slice(0, 6).map((product) => {
            // Calculate recent price change
            const history = product.priceHistory;
            const dates = [...new Set(history.map((item) => item.date))].sort();
            const mostRecent = dates[dates.length - 1];
            const previousDate = dates[dates.length - 2];

            const recentPrices = history.filter(
              (item) => item.date === mostRecent,
            );
            const previousPrices = history.filter(
              (item) => item.date === previousDate,
            );

            const recentAvg =
              recentPrices.reduce((sum, item) => sum + item.price, 0) /
              recentPrices.length;
            const previousAvg =
              previousPrices.reduce((sum, item) => sum + item.price, 0) /
              previousPrices.length;

            const change = recentAvg - previousAvg;
            const percentChange = (change / previousAvg) * 100;

            return (
              <div key={product.id} className="p-3 border rounded-md">
                <div className="font-medium">{product.name}</div>
                <div className="text-sm text-muted-foreground">
                  {product.category}
                </div>
                <div className="mt-2 flex justify-between items-center">
                  <span className="font-bold">${recentAvg.toFixed(2)}</span>
                  <span
                    className={`text-sm flex items-center ${change < 0 ? "text-green-500" : change > 0 ? "text-red-500" : "text-gray-500"}`}
                  >
                    {change === 0 ? (
                      "No change"
                    ) : change < 0 ? (
                      <>
                        <ArrowDownRight className="h-3 w-3" />{" "}
                        {Math.abs(percentChange).toFixed(1)}%
                      </>
                    ) : (
                      <>
                        <ArrowUpRight className="h-3 w-3" />{" "}
                        {percentChange.toFixed(1)}%
                      </>
                    )}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Compared to {previousDate}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 text-center">
          <Button variant="outline">View All Price Changes</Button>
        </div>
      </Card>
    </div>
  );
};

export default PriceTrendsDashboard;

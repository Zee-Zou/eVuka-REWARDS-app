import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Trash2,
  ShoppingCart,
  ArrowDownRight,
  Store,
  Tag,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { generateMockStoreRecommendations } from "./storeRecommendations";

interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  category: string;
  completed: boolean;
}

interface StoreRecommendation {
  store: string;
  totalPrice: number;
  savings: number;
  items: {
    name: string;
    price: number;
    onSale: boolean;
    discount?: number;
  }[];
}

const ShoppingList = () => {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [storeRecommendations, setStoreRecommendations] = useState<
    StoreRecommendation[]
  >([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { toast } = useToast();

  // Categories for shopping items
  const categories = [
    "Produce",
    "Dairy",
    "Meat",
    "Bakery",
    "Pantry",
    "Frozen",
    "Household",
    "Personal Care",
    "Beverages",
    "Snacks",
    "Other",
  ];

  // Generate store recommendations when items change
  useEffect(() => {
    if (items.length > 0) {
      const recommendations = generateMockStoreRecommendations(items);
      setStoreRecommendations(recommendations);
    } else {
      setStoreRecommendations([]);
    }
  }, [items]);

  const addItem = () => {
    if (!newItemName.trim()) return;

    const newItem: ShoppingItem = {
      id: crypto.randomUUID(),
      name: newItemName.trim(),
      quantity: newItemQuantity,
      category: guessCategory(newItemName),
      completed: false,
    };

    setItems([...items, newItem]);
    setNewItemName("");
    setNewItemQuantity(1);

    toast({
      title: "Item added",
      description: `${newItem.name} added to your shopping list.`,
    });
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const toggleItemCompletion = (id: string) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      ),
    );
  };

  const clearCompletedItems = () => {
    setItems(items.filter((item) => !item.completed));
  };

  // Simple category guessing based on item name
  const guessCategory = (itemName: string): string => {
    const lowerName = itemName.toLowerCase();

    const categoryKeywords: Record<string, string[]> = {
      Produce: [
        "apple",
        "banana",
        "vegetable",
        "fruit",
        "lettuce",
        "tomato",
        "onion",
        "potato",
      ],
      Dairy: ["milk", "cheese", "yogurt", "butter", "cream", "egg"],
      Meat: ["beef", "chicken", "pork", "fish", "meat", "steak", "sausage"],
      Bakery: ["bread", "cake", "muffin", "pastry", "bagel", "roll"],
      Pantry: [
        "pasta",
        "rice",
        "cereal",
        "flour",
        "sugar",
        "oil",
        "can",
        "soup",
        "beans",
      ],
      Frozen: ["ice cream", "frozen", "pizza"],
      Household: ["paper", "towel", "cleaner", "detergent", "soap", "trash"],
      "Personal Care": ["shampoo", "toothpaste", "deodorant", "razor"],
      Beverages: ["water", "soda", "juice", "coffee", "tea", "drink"],
      Snacks: ["chips", "cookie", "cracker", "candy", "chocolate", "snack"],
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some((keyword) => lowerName.includes(keyword))) {
        return category;
      }
    }

    return "Other";
  };

  const filteredItems = selectedCategory
    ? items.filter((item) => item.category === selectedCategory)
    : items;

  const activeItems = filteredItems.filter((item) => !item.completed);
  const completedItems = filteredItems.filter((item) => item.completed);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Shopping List */}
        <Card className="p-4 flex-1">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" /> Shopping List
          </h2>

          {/* Add Item Form */}
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Add item..."
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
              className="flex-1"
            />
            <Input
              type="number"
              min="1"
              value={newItemQuantity}
              onChange={(e) =>
                setNewItemQuantity(parseInt(e.target.value) || 1)
              }
              className="w-20"
            />
            <Button onClick={addItem}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Category Filter */}
          <div className="mb-4">
            <ScrollArea className="whitespace-nowrap pb-2">
              <div className="flex gap-2">
                <Badge
                  variant={selectedCategory === null ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedCategory(null)}
                >
                  All
                </Badge>
                {categories.map((category) => (
                  <Badge
                    key={category}
                    variant={
                      selectedCategory === category ? "default" : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Items List */}
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="mb-4 w-full">
              <TabsTrigger value="active" className="flex-1">
                Active ({activeItems.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex-1">
                Completed ({completedItems.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              {activeItems.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No active items. Add some items to your shopping list!
                </p>
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {activeItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => toggleItemCompletion(item.id)}
                            className="h-4 w-4"
                          />
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Tag className="h-3 w-3" /> {item.category} • Qty:{" "}
                              {item.quantity}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="completed">
              {completedItems.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No completed items yet.
                </p>
              ) : (
                <>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {completedItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 bg-muted/30 rounded-md"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={item.completed}
                              onChange={() => toggleItemCompletion(item.id)}
                              className="h-4 w-4"
                            />
                            <div>
                              <div className="font-medium line-through opacity-70">
                                {item.name}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Tag className="h-3 w-3" /> {item.category} •
                                Qty: {item.quantity}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="mt-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearCompletedItems}
                    >
                      Clear Completed
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </Card>

        {/* Store Recommendations */}
        <Card className="p-4 flex-1">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Store className="h-5 w-5" /> Store Recommendations
          </h2>

          {storeRecommendations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Add items to your shopping list to see store recommendations.
            </div>
          ) : (
            <div className="space-y-4">
              {storeRecommendations.map((store, index) => (
                <Card key={index} className="p-4 border-2 border-muted">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-lg">{store.store}</h3>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">
                        ${store.totalPrice.toFixed(2)}
                      </span>
                      <span className="text-sm text-green-600 flex items-center">
                        <ArrowDownRight className="h-3 w-3" />$
                        {store.savings.toFixed(2)} savings
                      </span>
                    </div>
                  </div>

                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {store.items.map((item, itemIndex) => (
                        <div
                          key={itemIndex}
                          className="flex justify-between items-center p-2 rounded-md bg-muted/30"
                        >
                          <div className="flex items-center gap-2">
                            <span>{item.name}</span>
                            {item.onSale && (
                              <Badge
                                variant="outline"
                                className="bg-green-100 text-green-800 border-green-200"
                              >
                                Sale
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              ${item.price.toFixed(2)}
                            </span>
                            {item.discount && (
                              <span className="text-xs text-green-600">
                                -{item.discount}%
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <div className="mt-4">
                    <Button
                      className="w-full"
                      variant={index === 0 ? "default" : "outline"}
                    >
                      {index === 0 ? "Best Deal - Shop Here" : "Shop Here"}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ShoppingList;

/**
 * Share Target Handler
 * Handles shared images from other apps via the Web Share Target API
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { logger } from "../lib/logger";
import { compressReceiptImage } from "../lib/image-compression";
import { saveReceipt } from "../lib/offline-storage";
import { useToast } from "../hooks/use-toast";

export default function ShareReceiptHandler() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    // Handle shared data
    handleSharedData();
  }, []);

  const handleSharedData = async () => {
    try {
      // Check if this is a POST request with form data
      const formData = await getFormData();

      if (!formData) {
        logger.warn("No form data found in share request");
        setStatus("error");
        return;
      }

      // Get the shared file
      const file = formData.get("receipt") as File;

      if (!file || !file.type.startsWith("image/")) {
        logger.warn("Invalid or no image file in share request");
        setStatus("error");
        toast({
          title: "Invalid File",
          description: "Please share a valid image file.",
          variant: "destructive",
        });
        return;
      }

      logger.info("Processing shared receipt image", {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      });

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Compress the image
      const { compressedFile } = await compressReceiptImage(file);

      // Convert to base64 for storage
      const compressedReader = new FileReader();
      compressedReader.onload = async (e) => {
        const imageData = e.target?.result as string;

        // Save offline (will sync when online)
        const offlineStorage = await import("../lib/offline-storage").then(
          (m) => m.offlineStorage
        );
        await offlineStorage.saveReceipt(imageData, {
          sharedFrom: "share-target",
          originalFileName: file.name,
          sharedAt: new Date().toISOString(),
        });

        logger.info("Shared receipt saved for processing");
        setStatus("success");

        toast({
          title: "Receipt Saved",
          description: "Your receipt has been saved and will be processed.",
        });

        // Redirect to home after 2 seconds
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 2000);
      };

      compressedReader.readAsDataURL(compressedFile);
    } catch (error) {
      logger.error("Error handling shared data:", error);
      setStatus("error");
      toast({
        title: "Processing Failed",
        description: "Failed to process the shared receipt. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getFormData = async (): Promise<FormData | null> => {
    // This function would be called when the page is loaded via POST
    // In a real implementation, you'd need server-side handling or a service worker
    // to capture the POST data and pass it to the client

    // For now, we check if there's data in the URL
    const params = new URLSearchParams(window.location.search);
    const title = params.get("title");
    const text = params.get("text");

    logger.info("Share handler invoked", { title, text });

    // In a full implementation, the service worker would handle the POST
    // and redirect here with the file data
    // This is a simplified version
    return null;
  };

  const renderContent = () => {
    switch (status) {
      case "processing":
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Processing Receipt</h3>
            <p className="text-sm text-muted-foreground text-center">
              Please wait while we process your shared receipt...
            </p>
          </div>
        );

      case "success":
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-16 w-16 text-green-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Receipt Saved!</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Your receipt has been saved and will be processed to earn points.
            </p>
            {imagePreview && (
              <div className="mt-4">
                <img
                  src={imagePreview}
                  alt="Receipt preview"
                  className="max-w-xs rounded-lg shadow-lg"
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-4">
              Redirecting to home...
            </p>
          </div>
        );

      case "error":
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-16 w-16 text-red-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Processing Failed</h3>
            <p className="text-sm text-muted-foreground text-center mb-6">
              We couldn't process the shared receipt. Please try capturing it directly in the app.
            </p>
            <Button onClick={() => navigate("/", { replace: true })}>
              Go to Home
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Shared Receipt
          </CardTitle>
          <CardDescription>
            Processing receipt shared from another app
          </CardDescription>
        </CardHeader>
        <CardContent>{renderContent()}</CardContent>
      </Card>
    </div>
  );
}

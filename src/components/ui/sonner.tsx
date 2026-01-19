"use client";

import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          // Unified green/white style for success notifications
          success: "bg-green-50 border-green-200 text-green-800 shadow-md",
          // Consistent styling for other notification types
          error: "bg-red-50 border-red-200 text-red-800 shadow-md",
          warning: "bg-yellow-50 border-yellow-200 text-yellow-800 shadow-md",
          info: "bg-blue-50 border-blue-200 text-blue-800 shadow-md",
          loading: "bg-white border-gray-200 text-gray-800 shadow-md",
          // Default toast style (black/white theme merged into unified style)
          toast: "bg-white border-gray-200 text-gray-900 shadow-md",
        },
      }}
      style={
        {
          "--normal-bg": "white",
          "--normal-text": "rgb(15 23 42)",
          "--normal-border": "rgb(226 232 240)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };

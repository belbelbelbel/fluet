"use client";

import { Button } from "./button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { X, AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
}: ConfirmDialogProps) {
  if (!open) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-md bg-gray-900 border-gray-700 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              variant === "destructive" 
                ? "bg-red-500/10" 
                : "bg-blue-500/10"
            }`}>
              <AlertTriangle className={`w-5 h-5 ${
                variant === "destructive" 
                  ? "text-red-400" 
                  : "text-blue-400"
              }`} />
            </div>
            <div className="flex-1">
              <CardTitle className="text-white">{title}</CardTitle>
              <CardDescription className="text-gray-400 mt-1">
                {description}
              </CardDescription>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-300 transition-colors p-1.5 hover:bg-gray-800 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-end gap-2">
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="border-gray-700 text-black hover:bg-gray-800 hover:text-white"
            >
              {cancelText}
            </Button>
            <Button
              onClick={handleConfirm}
              size="sm"
              className={
                variant === "destructive"
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }
            >
              {confirmText}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


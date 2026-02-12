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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="pb-4">
          <div className="flex items-start gap-4">
            <div className={`p-2.5 rounded-xl flex-shrink-0 ${
              variant === "destructive" 
                ? "bg-red-50" 
                : "bg-blue-50"
            }`}>
              <AlertTriangle className={`w-6 h-6 ${
                variant === "destructive" 
                  ? "text-red-600" 
                  : "text-blue-600"
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-gray-950 text-lg font-semibold mb-1">{title}</CardTitle>
              <CardDescription className="text-gray-600 text-sm leading-relaxed">
                {description}
              </CardDescription>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-lg flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              size="default"
              className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
            >
              {cancelText}
            </Button>
            <Button
              onClick={handleConfirm}
              size="default"
              className={`w-full sm:w-auto font-medium ${
                variant === "destructive"
                  ? "bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow"
                  : "bg-gray-950 hover:bg-gray-900 text-white shadow-sm hover:shadow"
              }`}
            >
              {confirmText}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


"use client";

import { useState, useEffect } from "react";
import { XIcon, KeyboardIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function KeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 border-gray-600 text-gray-300 hover:bg-gray-700 z-40"
        title="Keyboard Shortcuts (Ctrl/Cmd + /)"
      >
        <KeyboardIcon className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <KeyboardIcon className="w-6 h-6 mr-2" />
            Keyboard Shortcuts
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Content Generation</h3>
              <div className="space-y-2">
                <ShortcutItem keys={["Ctrl/Cmd", "Enter"]} description="Generate content" />
                <ShortcutItem keys={["Ctrl/Cmd", "E"]} description="Edit generated content" />
                <ShortcutItem keys={["Ctrl/Cmd", "S"]} description="Save edited content" />
                <ShortcutItem keys={["Esc"]} description="Close modal or cancel edit" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Navigation</h3>
              <div className="space-y-2">
                <ShortcutItem keys={["Ctrl/Cmd", "/"]} description="Show/hide keyboard shortcuts" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShortcutItem({ keys, description }: { keys: string[]; description: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
      <span className="text-gray-300">{description}</span>
      <div className="flex gap-1">
        {keys.map((key, i) => (
          <span key={i} className="flex items-center">
            <kbd className="px-2 py-1 bg-gray-700 text-gray-200 text-xs rounded border border-gray-600">
              {key}
            </kbd>
            {i < keys.length - 1 && <span className="mx-1 text-gray-500">+</span>}
          </span>
        ))}
      </div>
    </div>
  );
}


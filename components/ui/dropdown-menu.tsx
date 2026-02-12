"use client";

import * as React from "react";
// import { ChevronDownIcon } from "lucide-react";
// import { Button } from "./button";
import { cn } from "@/lib/utils";

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "left" | "right";
}

export function DropdownMenu({ trigger, children, align = "right" }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      // Use a small delay to avoid immediate closing
      const timeoutId = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 10);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  // Close menu when clicking on menu items
  const handleMenuClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      setTimeout(() => setIsOpen(false), 150);
    }
  };

  // Get the trigger button position for fixed positioning
  const [menuPosition, setMenuPosition] = React.useState<{ top?: number; bottom?: number; left?: number; right?: number } | null>(null);

  React.useEffect(() => {
    if (isOpen && menuRef.current) {
      const trigger = menuRef.current.querySelector('[data-trigger]');
      if (trigger) {
        const rect = (trigger as HTMLElement).getBoundingClientRect();
        const menuHeight = 300; // Approximate menu height
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        
        // If not enough space below but enough space above, show above
        if (spaceBelow < menuHeight && spaceAbove > menuHeight) {
          setMenuPosition({
            bottom: window.innerHeight - rect.top + 4,
            ...(align === "right" ? { right: window.innerWidth - rect.right } : { left: rect.left }),
          });
        } else {
          // Show below (default)
          setMenuPosition({
            top: rect.bottom + 4,
            ...(align === "right" ? { right: window.innerWidth - rect.right } : { left: rect.left }),
          });
        }
      }
    }
  }, [isOpen, align]);

  return (
    <div className="relative" ref={menuRef}>
      <div onClick={handleTriggerClick} className="cursor-pointer" data-trigger>
        {trigger}
      </div>
      {isOpen && menuPosition && (
        <>
          <div
            className="fixed inset-0 z-[60]"
            onClick={() => setIsOpen(false)}
          />
          <div
            className={cn(
              "fixed z-[70] min-w-[180px] max-w-[90vw] rounded-md border border-gray-800 bg-gray-900 shadow-xl",
            )}
            style={menuPosition}
            onClick={handleMenuClick}
          >
            <div className="py-1 max-h-[60vh] overflow-y-auto">{children}</div>
          </div>
        </>
      )}
    </div>
  );
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export function DropdownMenuItem({
  children,
  onClick,
  icon,
  className,
}: DropdownMenuItemProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors",
        className
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="flex-1 text-left">{children}</span>
    </button>
  );
}


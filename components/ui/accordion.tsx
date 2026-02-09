"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface AccordionItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  isDark?: boolean;
}

function AccordionItem({ question, answer, isOpen, onToggle, isDark = false }: AccordionItemProps) {
  return (
    <div className={`border rounded-lg transition-all duration-200 ${
      isDark 
        ? "bg-gray-800/50 border-gray-700" 
        : "bg-white border-gray-200"
    }`}>
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-5 text-left transition-colors ${
          isDark 
            ? "hover:bg-gray-800" 
            : "hover:bg-gray-50"
        }`}
      >
        <h3 className={`text-base font-semibold pr-4 ${
          isDark ? "text-white" : "text-gray-950"
        }`}>
          {question}
        </h3>
        <ChevronDown
          className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? "transform rotate-180" : ""
          } ${
            isDark ? "text-gray-400" : "text-gray-600"
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className={`px-5 pb-5 ${
          isDark ? "text-gray-300" : "text-gray-600"
        }`}>
          <p className="text-sm leading-relaxed">{answer}</p>
        </div>
      </div>
    </div>
  );
}

interface AccordionProps {
  items: Array<{ question: string; answer: string }>;
  isDark?: boolean;
  defaultOpenIndex?: number;
}

export function Accordion({ items, isDark = false, defaultOpenIndex }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(
    defaultOpenIndex !== undefined ? defaultOpenIndex : null
  );

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <AccordionItem
          key={index}
          question={item.question}
          answer={item.answer}
          isOpen={openIndex === index}
          onToggle={() => handleToggle(index)}
          isDark={isDark}
        />
      ))}
    </div>
  );
}

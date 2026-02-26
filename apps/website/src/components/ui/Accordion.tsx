"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Expand, Compress } from "lucide-react";

export type AccordionItem = {
  question: string;
  answer: string;
  category?: string;
};

interface AccordionProps {
  items: AccordionItem[];
  showNumbers?: boolean;
  showCategories?: boolean;
  allowMultiple?: boolean;
  className?: string;
}

export function Accordion({
  items,
  showNumbers = true,
  showCategories = true,
  allowMultiple = false,
  className = "",
}: AccordionProps) {
  const [openIndexes, setOpenIndexes] = useState<Set<number>>(new Set([0]));
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const toggleItem = (index: number) => {
    if (allowMultiple) {
      setOpenIndexes((prev) => {
        const next = new Set(prev);
        if (next.has(index)) {
          next.delete(index);
        } else {
          next.add(index);
        }
        return next;
      });
    } else {
      setOpenIndexes((prev) => {
        const isOpen = prev.has(index);
        return isOpen ? new Set() : new Set([index]);
      });
    }
  };

  const expandAll = () => {
    setOpenIndexes(new Set(items.map((_, i) => i)));
  };

  const collapseAll = () => {
    setOpenIndexes(new Set());
  };

  const isAllExpanded = openIndexes.size === items.length && items.length > 0;
  const isAllCollapsed = openIndexes.size === 0;

  const formatNumber = (index: number) => {
    return String(index + 1).padStart(2, "0");
  };

  const getCategoryColor = (category?: string) => {
    if (!category) return "gray";
    const colors: Record<string, string> = {
      General: "blue",
      Pricing: "emerald",
      Features: "violet",
      Support: "amber",
      Security: "rose",
      Billing: "cyan",
    };
    return colors[category] || "gray";
  };

  const categoryStyles: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 ring-blue-200/50",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200/50",
    violet: "bg-violet-50 text-violet-700 ring-violet-200/50",
    amber: "bg-amber-50 text-amber-700 ring-amber-200/50",
    rose: "bg-rose-50 text-rose-700 ring-rose-200/50",
    cyan: "bg-cyan-50 text-cyan-700 ring-cyan-200/50",
    gray: "bg-gray-50 text-gray-700 ring-gray-200/50",
  };

  return (
    <div className={className}>
      {/* Expand/Collapse Controls */}
      <div className="flex justify-end mb-4">
        <button
          onClick={isAllExpanded ? collapseAll : expandAll}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors duration-200"
        >
          {isAllExpanded ? (
            <>
              <Compress className="h-4 w-4" />
              Collapse all
            </>
          ) : (
            <>
              <Expand className="h-4 w-4" />
              Expand all
            </>
          )}
        </button>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => {
          const isOpen = openIndexes.has(index);
          const categoryColor = getCategoryColor(item.category);

          return (
            <div
              key={index}
              className={`
                relative rounded-2xl border bg-white
                transition-all duration-500 ease-out
                ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
                ${
                  isOpen
                    ? "border-transparent shadow-xl shadow-primary-500/8"
                    : "border-gray-200 shadow-sm hover:border-gray-300 hover:shadow-md"
                }
              `}
              style={{
                transitionDelay: isVisible ? `${index * 75}ms` : "0ms",
              }}
            >
              {/* Gradient Border Effect when open */}
              {isOpen && (
                <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-primary-500 via-primary-400 to-primary-600 opacity-100" />
              )}

              <div
                className={`
                  relative rounded-2xl bg-white
                  ${isOpen ? "p-[1px]" : ""}
                `}
              >
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full flex items-center gap-4 p-5 text-left group"
                >
                  {/* Number Badge */}
                  {showNumbers && (
                    <span
                      className={`
                        flex-shrink-0 w-10 h-10 rounded-xl 
                        flex items-center justify-center 
                        text-sm font-bold 
                        transition-all duration-300
                        ${
                          isOpen
                            ? "bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25"
                            : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                        }
                      `}
                    >
                      {formatNumber(index)}
                    </span>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span
                        className={`
                          font-semibold text-base transition-colors duration-300
                          ${isOpen ? "text-primary-700" : "text-gray-900 group-hover:text-gray-700"}
                        `}
                      >
                        {item.question}
                      </span>

                      {/* Category Badge */}
                      {showCategories && item.category && (
                        <span
                          className={`
                            inline-flex items-center px-2.5 py-0.5 
                            rounded-full text-xs font-medium
                            ring-1 ring-inset
                            transition-all duration-300
                            ${categoryStyles[categoryColor]}
                          `}
                        >
                          {item.category}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Chevron */}
                  <ChevronDown
                    className={`
                      h-5 w-5 flex-shrink-0 ml-2
                      transition-all duration-300 ease-out
                      ${isOpen ? "rotate-180 text-primary-500" : "text-gray-400 group-hover:text-gray-600"}
                    `}
                  />
                </button>

                {/* Answer Panel */}
                <div
                  className={`
                    overflow-hidden transition-all duration-300 ease-out
                    ${isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}
                  `}
                >
                  <div className="px-5 pb-5 pl-[76px]">
                    <div className="pt-1 border-t border-gray-100">
                      <p className="pt-4 text-gray-600 leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import type { VideoStatus } from '../types';

/**
 * Filter group structure:
 * - 'all' - Tất cả
 * - 'pending' - Chờ review
 * - 'review_results' - Kết quả review (expandable)
 */
export type FilterGroup = 'all' | 'pending' | 'review_results';

interface FilterOption {
  id: FilterGroup | VideoStatus;
  label: string;
  group?: FilterGroup;
  isSubItem?: boolean;
  color?: string;
  bg?: string;
  border?: string;
  darkBg?: string;
  darkColor?: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  { id: 'all', label: 'Tất cả', color: 'text-gray-700', bg: 'bg-white', border: 'border-gray-200', darkBg: 'dark:bg-gray-900', darkColor: 'dark:text-gray-100' },
  { id: 'pending', label: 'Chờ review', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', darkBg: 'dark:bg-amber-950/40', darkColor: 'dark:text-amber-400' },
  
  // Review results group items
  { id: 'approved', label: 'Đã duyệt', group: 'review_results', isSubItem: true, color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', darkBg: 'dark:bg-green-950/40', darkColor: 'dark:text-green-400' },
  { id: 'needs_revision', label: 'Cần sửa', group: 'review_results', isSubItem: true, color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', darkBg: 'dark:bg-orange-950/40', darkColor: 'dark:text-orange-400' },
  { id: 'rejected', label: 'Từ chối', group: 'review_results', isSubItem: true, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', darkBg: 'dark:bg-red-950/40', darkColor: 'dark:text-red-400' },
];

const MAIN_FILTERS = FILTER_OPTIONS.filter(f => !f.isSubItem);
const REVIEW_RESULTS = FILTER_OPTIONS.filter(f => f.group === 'review_results');

interface VideoFilterBarProps {
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  isMobile?: boolean;
}

export function VideoFilterBar({ selectedFilter, onFilterChange, isMobile = false }: VideoFilterBarProps) {
  const [expandedGroup, setExpandedGroup] = useState<FilterGroup | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setExpandedGroup(null);
        setShowMobileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check if current selection is from review results group
  const isReviewResultSelected = REVIEW_RESULTS.some(f => f.id === selectedFilter);
  const selectedLabel = FILTER_OPTIONS.find(f => f.id === selectedFilter)?.label || 'Tất cả';

  // Get breadcrumb label for nested selection (e.g., "Kết quả review > Cần sửa")
  const getBreadcrumb = () => {
    if (isReviewResultSelected) {
      return `Kết quả review > ${selectedLabel}`;
    }
    return selectedLabel;
  };

  const handleFilterSelect = (filterId: string) => {
    onFilterChange(filterId);
    setExpandedGroup(null);
    setShowMobileMenu(false);
  };

  // Desktop view - Horizontal pills
  if (!isMobile) {
    return (
      <div className="flex gap-1.5 flex-wrap items-center">
        {/* All filter */}
        <button
          onClick={() => handleFilterSelect('all')}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap',
            selectedFilter === 'all'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
          )}
        >
          Tất cả
        </button>

        {/* Pending filter */}
        <button
          onClick={() => handleFilterSelect('pending')}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap',
            selectedFilter === 'pending'
              ? 'bg-amber-600 text-white border-amber-600'
              : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-700'
          )}
        >
          Chờ review
        </button>

        {/* Review results dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setExpandedGroup(expandedGroup === 'review_results' ? null : 'review_results')}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap inline-flex items-center gap-1.5',
              isReviewResultSelected
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700'
            )}
          >
            Kết quả review
            <ChevronDown
              size={14}
              className={cn('transition-transform', expandedGroup === 'review_results' && 'rotate-180')}
            />
          </button>

          {/* Dropdown menu */}
          {expandedGroup === 'review_results' && (
            <div className="absolute top-full mt-1 left-0 z-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden min-w-max">
              {REVIEW_RESULTS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleFilterSelect(option.id as string)}
                  className={cn(
                    'w-full text-left px-3 py-2 text-xs font-semibold transition-all whitespace-nowrap',
                    selectedFilter === option.id
                      ? cn(option.bg, option.color, option.border, option.darkBg, option.darkColor, 'border')
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Mobile view - Dropdown selector
  return (
    <div ref={dropdownRef} className="relative w-full">
      <button
        onClick={() => setShowMobileMenu(!showMobileMenu)}
        className="w-full px-3 py-2 rounded-lg text-sm font-semibold border bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all flex items-center justify-between"
      >
        <span className="truncate">{getBreadcrumb()}</span>
        <ChevronDown
          size={16}
          className={cn('transition-transform flex-shrink-0 ml-2', showMobileMenu && 'rotate-180')}
        />
      </button>

      {/* Mobile dropdown menu */}
      {showMobileMenu && (
        <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto">
          {/* Main filters */}
          {MAIN_FILTERS.map((option) => (
            <button
              key={option.id}
              onClick={() => handleFilterSelect(option.id as string)}
              className={cn(
                'w-full text-left px-3 py-2 text-sm font-semibold transition-all',
                selectedFilter === option.id
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
            >
              {option.label}
            </button>
          ))}

          {/* Review results section */}
          <div className="border-t border-gray-100 dark:border-gray-800">
            <div className="px-3 py-2 text-xs font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wide">
              Kết quả review
            </div>
            {REVIEW_RESULTS.map((option) => (
              <button
                key={option.id}
                onClick={() => handleFilterSelect(option.id as string)}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm font-semibold transition-all pl-6',
                  selectedFilter === option.id
                    ? cn(option.bg, option.color, option.border, option.darkBg, option.darkColor, 'border')
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

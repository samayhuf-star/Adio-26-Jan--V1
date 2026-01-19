import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { debounce } from '../utils/performance';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  getItemKey?: (item: T, index: number) => string | number;
}

export function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = '',
  onScroll,
  getItemKey = (_, index) => index,
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // Debounced scroll handler to improve performance
  const debouncedScrollHandler = useMemo(
    () => debounce((scrollTop: number) => {
      setScrollTop(scrollTop);
      onScroll?.(scrollTop);
    }, 16), // ~60fps
    [onScroll]
  );

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const {scrollTop} = e.currentTarget;
    debouncedScrollHandler(scrollTop);
  }, [debouncedScrollHandler]);

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedScrollHandler.cancel();
    };
  }, [debouncedScrollHandler]);

  // Calculate total height and visible items
  const totalHeight = items.length * itemHeight;
  const visibleItems = items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${visibleRange.startIndex * itemHeight}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = visibleRange.startIndex + index;
            return (
              <div
                key={getItemKey(item, actualIndex)}
                style={{ height: itemHeight }}
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Hook for virtualized list state management
export function useVirtualizedList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan = 5
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange.startIndex, visibleRange.endIndex]);

  const totalHeight = items.length * itemHeight;

  const scrollToIndex = useCallback((index: number) => {
    const scrollTop = index * itemHeight;
    setScrollTop(scrollTop);
    return scrollTop;
  }, [itemHeight]);

  const scrollToTop = useCallback(() => {
    setScrollTop(0);
  }, []);

  const scrollToBottom = useCallback(() => {
    const scrollTop = Math.max(0, totalHeight - containerHeight);
    setScrollTop(scrollTop);
  }, [totalHeight, containerHeight]);

  return {
    scrollTop,
    setScrollTop,
    visibleRange,
    visibleItems,
    totalHeight,
    scrollToIndex,
    scrollToTop,
    scrollToBottom,
  };
}

// Virtualized table component for tabular data
interface VirtualizedTableProps<T> {
  items: T[];
  columns: Array<{
    key: string;
    header: string;
    width?: number;
    render?: (item: T, index: number) => React.ReactNode;
  }>;
  rowHeight: number;
  containerHeight: number;
  className?: string;
  headerClassName?: string;
  rowClassName?: string | ((item: T, index: number) => string);
  onRowClick?: (item: T, index: number) => void;
  getRowKey?: (item: T, index: number) => string | number;
}

export function VirtualizedTable<T extends Record<string, any>>({
  items,
  columns,
  rowHeight,
  containerHeight,
  className = '',
  headerClassName = '',
  rowClassName = '',
  onRowClick,
  getRowKey = (_, index) => index,
}: VirtualizedTableProps<T>) {
  const headerHeight = 40; // Fixed header height
  const listHeight = containerHeight - headerHeight;

  const renderRow = useCallback((item: T, index: number) => {
    const rowClass = typeof rowClassName === 'function' 
      ? rowClassName(item, index) 
      : rowClassName;

    return (
      <div
        className={`flex border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${rowClass}`}
        onClick={() => onRowClick?.(item, index)}
        style={{ height: rowHeight }}
      >
        {columns.map((column) => (
          <div
            key={column.key}
            className="flex items-center px-4 py-2 text-sm"
            style={{ width: column.width || 'auto', flex: column.width ? 'none' : 1 }}
          >
            {column.render ? column.render(item, index) : item[column.key]}
          </div>
        ))}
      </div>
    );
  }, [columns, rowHeight, rowClassName, onRowClick]);

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {/* Fixed Header */}
      <div 
        className={`flex bg-gray-50 border-b border-gray-200 font-medium text-sm text-gray-700 ${headerClassName}`}
        style={{ height: headerHeight }}
      >
        {columns.map((column) => (
          <div
            key={column.key}
            className="flex items-center px-4 py-2"
            style={{ width: column.width || 'auto', flex: column.width ? 'none' : 1 }}
          >
            {column.header}
          </div>
        ))}
      </div>

      {/* Virtualized Rows */}
      <VirtualizedList
        items={items}
        itemHeight={rowHeight}
        containerHeight={listHeight}
        renderItem={renderRow}
        getItemKey={getRowKey}
      />
    </div>
  );
}

// Paginated list component for very large datasets
interface PaginatedListProps<T> {
  items: T[];
  pageSize: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  showPageInfo?: boolean;
  onPageChange?: (page: number) => void;
}

export function PaginatedList<T>({
  items,
  pageSize,
  renderItem,
  className = '',
  showPageInfo = true,
  onPageChange,
}: PaginatedListProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(items.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, items.length);
  const currentItems = items.slice(startIndex, endIndex);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    onPageChange?.(page);
  }, [onPageChange]);

  const goToFirstPage = () => handlePageChange(1);
  const goToLastPage = () => handlePageChange(totalPages);
  const goToPreviousPage = () => handlePageChange(Math.max(1, currentPage - 1));
  const goToNextPage = () => handlePageChange(Math.min(totalPages, currentPage + 1));

  return (
    <div className={className}>
      {/* Items */}
      <div className="space-y-2">
        {currentItems.map((item, index) => (
          <div key={startIndex + index}>
            {renderItem(item, startIndex + index)}
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 px-4 py-3 bg-white border-t border-gray-200">
          {showPageInfo && (
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {endIndex} of {items.length} results
            </div>
          )}

          <div className="flex items-center space-x-2">
            <button
              onClick={goToFirstPage}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              First
            </button>
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <span className="px-3 py-1 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
            <button
              onClick={goToLastPage}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

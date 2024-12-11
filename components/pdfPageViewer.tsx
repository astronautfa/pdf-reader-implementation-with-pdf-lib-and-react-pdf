// PDFPageViewer.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Document, Page } from 'react-pdf';
import { loadPDFPages } from '@/lib/actions';

const PAGES_TO_LOAD = 3; // Number of pages to load before and after current page

interface PDFPageViewerProps {
  filename: string;
  aspectRatio: string;
}

const PDFPageViewer: React.FC<PDFPageViewerProps> = ({ filename, aspectRatio }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pageData, setPageData] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState(true);

  const loadPageRange = async (page: number) => {
    const startPage = Math.max(1, page - PAGES_TO_LOAD);
    const endPage = page + PAGES_TO_LOAD;

    // Check if we already have these pages
    if (pageData[page]) return;

    setLoading(true);
    const result = await loadPDFPages(filename, startPage, endPage);
    
    if (result) {
      setTotalPages(result.totalPages);
      setPageData(prev => ({
        ...prev,
        [page]: result.base64string!
      }));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPageRange(currentPage);
  }, [currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      loadPageRange(newPage);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex gap-4 my-4">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1 || loading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || loading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          Next
        </button>
      </div>

      {loading ? (
        <div className="w-full h-[600px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      ) : (
        pageData[currentPage] && (
          <Document
            file={pageData[currentPage]}
            loading={
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            }
          >
            <Page
              pageNumber={1}
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </Document>
        )
      )}
    </div>
  );
};

export default PDFPageViewer;
'use client';

import { Page } from 'react-pdf';
import { usePDFDocument } from './PDFDocumentProvider';
import { useFullPage } from './FullPageProvider';
import React from 'react';

const DisplayPDF: React.FC = () => {
  const { pageNumber } = usePDFDocument();
  const { isFullPage, width, fullPageWidth } = useFullPage();

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-0 w-full h-full">
        <Page
          pageNumber={pageNumber}
          width={isFullPage ? fullPageWidth : width}
          renderTextLayer={true}
          renderAnnotationLayer={true}
          loading={
            <div className="w-full h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          }
        />
      </div>
    </div>
  );
};

export default DisplayPDF;
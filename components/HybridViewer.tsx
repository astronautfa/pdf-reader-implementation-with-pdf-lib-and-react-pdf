'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Reactpdfviewer from './Reactpdfviewer2'; // Your existing viewer

// Dynamically import the client-side viewer to reduce bundle size
const ClientPDFViewer = dynamic(() => import('./ClientPDFViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-[500px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  ),
});

type HybridPDFViewerProps = {
  pdfUrl: string;            // URL for client-side viewing
  base64string: string;      // Base64 string for server-side viewing
  aspectRatio: string;       // Aspect ratio for server-side viewing
  isProtected?: boolean;     // Flag to determine which viewer to use
};

const HybridPDFViewer: React.FC<HybridPDFViewerProps> = ({
  pdfUrl,
  base64string,
  aspectRatio,
  isProtected = false
}) => {
  const [useServerSide, setUseServerSide] = useState(isProtected);

  useEffect(() => {
    setUseServerSide(isProtected);
  }, [isProtected]);

  if (useServerSide) {
    return <Reactpdfviewer base64string={base64string} aspectRatio={aspectRatio} />;
  }

  return <ClientPDFViewer url={pdfUrl} />;
};

export default HybridPDFViewer;
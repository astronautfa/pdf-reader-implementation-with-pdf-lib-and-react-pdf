"use server";

import { PDFDocument } from "pdf-lib";
import { promises as fs } from "fs";
import path from "path";

type ConvertPDFObject = {
  base64string: string | null;
  aspectRatio: string;
};
export async function convertPDF(
  formData: FormData
): Promise<ConvertPDFObject | null> {
  const file = formData.get("pdffile") as unknown as File;
  const publicpages = formData.get("publicpages") as unknown as number;
  return new Promise(async (resolve, _) => {
    try {
      const arrbuf = await file.arrayBuffer();
      const buffer = Buffer.from(arrbuf);
      const pdfDoc = await PDFDocument.load(buffer);
      const pageCount = pdfDoc.getPageCount();
      const pages = pdfDoc.getPages();
      let aspectRatioFirstPage = "0.70711 / 1";
      let { width, height } = pages[0].getSize();
      if (width && height) {
        /* If first page is landscape, it will be displayed in portrait anyway: */
        const ratio = height >= width ? width / height : height / width;
        aspectRatioFirstPage = `${ratio.toString().slice(0, 7)} / 1`;
      } else {
        throw new Error("Invalid values for width or height.");
      }
      let base64string: string | null = null;
      for (let i = 0; i < pageCount; i++) {
        if (i >= publicpages) {
          pdfDoc.removePage(pageCount - i);
          /* Remove always the last page, because the index will be updated! */
        }
      }
      base64string = await pdfDoc.saveAsBase64({ dataUri: true });
      resolve({ base64string, aspectRatio: aspectRatioFirstPage });
    } catch (error) {
      console.log(error);
      resolve(null);
    }
  });
}

type PDFPageData = {
  base64string: string | null;
  aspectRatio: string;
  totalPages: number;
};

export async function loadPDFPages(
  filename: string,
  startPage: number,
  endPage: number
): Promise<PDFPageData | null> {
  try {
    const filePath = path.join(process.cwd(), "public", filename);
    const buffer = await fs.readFile(filePath);

    // Load the original document
    const originalPdfDoc = await PDFDocument.load(buffer);
    const totalPages = originalPdfDoc.getPageCount();

    // Create a new document for the requested pages
    const newPdfDoc = await PDFDocument.create();

    // Normalize page ranges
    const normalizedStart = Math.max(1, startPage);
    const normalizedEnd = Math.min(totalPages, endPage);

    // Copy requested pages
    const pages = await newPdfDoc.copyPages(
      originalPdfDoc,
      Array.from(
        { length: normalizedEnd - normalizedStart + 1 },
        (_, i) => i + normalizedStart - 1
      )
    );

    // Add pages to new document
    pages.forEach((page) => newPdfDoc.addPage(page));

    // Get aspect ratio of first page
    const firstPage = originalPdfDoc.getPage(0);
    let { width, height } = firstPage.getSize();
    const aspectRatio =
      height >= width
        ? `${(width / height).toString().slice(0, 7)} / 1`
        : `${(height / width).toString().slice(0, 7)} / 1`;

    const base64string = await newPdfDoc.saveAsBase64({ dataUri: true });

    return {
      base64string,
      aspectRatio,
      totalPages,
    };
  } catch (error) {
    console.error("Error loading PDF pages:", error);
    return null;
  }
}

export async function loadLocalPDF(
  filename: string
): Promise<{ base64string: string | null; aspectRatio: string } | null> {
  try {
    // Get the absolute path to the PDF file in the public directory
    const filePath = path.join(process.cwd(), "public", filename);

    // Read the file directly on the server
    const buffer = await fs.readFile(filePath);

    // Load the PDF document
    const pdfDoc = await PDFDocument.load(buffer);
    const pages = pdfDoc.getPages();

    let aspectRatioFirstPage = "0.70711 / 1";
    let { width, height } = pages[0].getSize();

    if (width && height) {
      const ratio = height >= width ? width / height : height / width;
      aspectRatioFirstPage = `${ratio.toString().slice(0, 7)} / 1`;
    }

    const base64string = await pdfDoc.saveAsBase64({ dataUri: true });

    return {
      base64string,
      aspectRatio: aspectRatioFirstPage,
    };
  } catch (error) {
    console.error("Error loading local PDF:", error);
    return null;
  }
}

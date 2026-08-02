"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Document, Page, pdfjs } from "react-pdf";
import HTMLFlipBook from "react-pageflip";
import type { FlipEvent, PageFlipHandle } from "react-pageflip";
import { CloseIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface PdfBookletProps {
  pdfUrl: string;
  coverImage: string;
  title: string;
}

export function PdfBooklet({ pdfUrl, coverImage, title }: PdfBookletProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Feuilleter : ${title}`}
        className="group block absolute inset-0 w-full h-full text-left"
      >
        <Image
          src={coverImage}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(min-width: 768px) 45vw, 90vw"
        />
        <span className="absolute bottom-4 left-4 bg-gradient-accent text-white text-xs font-heading uppercase px-4 py-2 rounded-full">
          Feuilleter le catalogue →
        </span>
      </button>
      {open &&
        createPortal(
          <BookletModal pdfUrl={pdfUrl} title={title} onClose={() => setOpen(false)} />,
          document.body
        )}
    </>
  );
}

function BookletModal({
  pdfUrl,
  title,
  onClose,
}: {
  pdfUrl: string;
  title: string;
  onClose: () => void;
}) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const flipBookRef = useRef<PageFlipHandle>(null);

  useEffect(() => {
    let cancelled = false;
    // On charge le fichier entier en une fois plutôt que de laisser pdf.js
    // faire ses requêtes HTTP Range habituelles : sur ce serveur, une requête
    // Range avortée en cours de route corrompt le décodage (image jamais
    // prête, page qui reste blanche).
    fetch(pdfUrl)
      .then((res) => res.arrayBuffer())
      .then((buf) => {
        if (!cancelled) setPdfData(buf);
      });
    return () => {
      cancelled = true;
    };
  }, [pdfUrl]);

  // Un nouvel objet littéral `{ data: pdfData }` à chaque rendu ferait croire
  // à react-pdf que le fichier a changé (recharge le Document en boucle).
  const pdfFile = useMemo(() => (pdfData ? { data: pdfData } : null), [pdfData]);

  const handleLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  }, []);

  const handleFlip = useCallback((e: FlipEvent) => {
    setCurrentPage(e.data);
  }, []);

  const goNext = useCallback(() => flipBookRef.current?.pageFlip().flipNext(), []);
  const goPrev = useCallback(() => flipBookRef.current?.pageFlip().flipPrev(), []);

  // react-pageflip recrée toute son instance dès que la référence de
  // `children` change : un `Array.from(...)` inline serait un nouveau
  // tableau (et de nouveaux éléments) à chaque rendu, empêchant le livret
  // de jamais finir son initialisation (pages qui restent display:none).
  const pageNodes = useMemo(() => {
    if (!numPages) return null;
    return Array.from({ length: numPages }, (_, i) => (
      <div key={i} className="pdf-booklet-page bg-white overflow-hidden">
        <Page
          pageNumber={i + 1}
          width={700}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          loading={bookletSkeleton}
        />
      </div>
    ));
  }, [numPages]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev, onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-brand-navy/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-10"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer"
        className="absolute top-4 right-4 md:top-6 md:right-6 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2.5 transition-colors"
      >
        <CloseIcon className="w-5 h-5" />
      </button>

      <div
        className="relative w-full max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full">
          {pdfFile ? (
            <Document
              file={pdfFile}
              loading={bookletSkeletonBox}
              error={bookletSkeletonBox}
              onLoadSuccess={handleLoadSuccess}
            >
              {numPages ? (
                <HTMLFlipBook
                  ref={flipBookRef}
                  width={360}
                  height={509}
                  size="stretch"
                  minWidth={220}
                  maxWidth={520}
                  minHeight={311}
                  maxHeight={735}
                  showCover
                  usePortrait
                  mobileScrollSupport={false}
                  maxShadowOpacity={0.5}
                  drawShadow
                  className="pdf-booklet mx-auto"
                  style={{ width: "100%", height: "min(70vh, 720px)" }}
                  onFlip={handleFlip}
                >
                  {pageNodes}
                </HTMLFlipBook>
              ) : (
                bookletSkeletonBox
              )}
            </Document>
          ) : (
            bookletSkeletonBox
          )}
        </div>

        <div className="flex items-center justify-between mt-5 text-white">
          <button
            type="button"
            onClick={goPrev}
            disabled={currentPage <= 0}
            className="disabled:opacity-30 bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors"
            aria-label="Page précédente"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <p className="text-sm font-medium tabular-nums">
            Page {currentPage + 1}
            {numPages ? ` / ${numPages}` : ""}
          </p>
          <button
            type="button"
            onClick={goNext}
            disabled={!numPages || currentPage >= numPages - 1}
            className="disabled:opacity-30 bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors"
            aria-label="Page suivante"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function BookletSkeleton() {
  return <div className="absolute inset-0 animate-pulse bg-brand-navy/10" />;
}

function BookletSkeletonBox() {
  return (
    <div className="relative aspect-[210/297] w-full max-w-sm rounded-lg overflow-hidden shadow-2xl bg-white">
      <BookletSkeleton />
    </div>
  );
}

// Éléments partagés et stables : recréer `<BookletSkeleton />` à chaque rendu
// (ex: `loading={<BookletSkeleton />}`) casserait la mémoïsation interne de
// react-pdf et pourrait interrompre le rendu pdf.js en plein décodage d'image.
const bookletSkeleton = <BookletSkeleton />;
const bookletSkeletonBox = <BookletSkeletonBox />;

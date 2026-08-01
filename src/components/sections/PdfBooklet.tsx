"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Document, Page, pdfjs } from "react-pdf";
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
      {open && <BookletModal pdfUrl={pdfUrl} title={title} onClose={() => setOpen(false)} />}
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
  const [page, setPage] = useState(1);
  const [displayPage, setDisplayPage] = useState(1);
  const [flipDir, setFlipDir] = useState<"next" | "prev" | null>(null);
  const [pageWidth, setPageWidth] = useState(420);
  const pageBoxRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback(
    (target: number) => {
      setPage((current) => {
        if (!numPages || target < 1 || target > numPages || target === current) {
          return current;
        }
        setFlipDir(target > current ? "next" : "prev");
        window.setTimeout(() => setDisplayPage(target), 220);
        window.setTimeout(() => setFlipDir(null), 460);
        return target;
      });
    },
    [numPages]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goTo(page + 1);
      if (e.key === "ArrowLeft") goTo(page - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, onClose, page]);

  useEffect(() => {
    const el = pageBoxRef.current;
    if (!el) return;
    const update = () => setPageWidth(el.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
        className="relative w-full max-w-sm md:max-w-md [perspective:2000px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={pageBoxRef}
          className={`relative aspect-[210/297] rounded-lg overflow-hidden shadow-2xl bg-white ${
            flipDir ? "animate-page-flip" : ""
          }`}
          style={{
            transformOrigin: flipDir === "prev" ? "right center" : "left center",
          }}
        >
          <Document
            file={pdfUrl}
            loading={<BookletSkeleton />}
            error={<BookletSkeleton />}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          >
            <Page
              pageNumber={displayPage}
              width={Math.max(pageWidth, 1)}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              loading={<BookletSkeleton />}
            />
          </Document>
        </div>

        <div className="flex items-center justify-between mt-5 text-white">
          <button
            type="button"
            onClick={() => goTo(page - 1)}
            disabled={page <= 1}
            className="disabled:opacity-30 bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors"
            aria-label="Page précédente"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <p className="text-sm font-medium tabular-nums">
            Page {page}
            {numPages ? ` / ${numPages}` : ""}
          </p>
          <button
            type="button"
            onClick={() => goTo(page + 1)}
            disabled={!numPages || page >= numPages}
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

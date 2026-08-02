// react-pageflip ne publie pas de types (fichiers .d.ts vides dans le
// package). Déclaration minimale couvrant l'usage fait par PdfBooklet.
declare module "react-pageflip" {
  import type { ReactNode, CSSProperties, ForwardRefExoticComponent, RefAttributes } from "react";

  export interface PageFlipInstance {
    getCurrentPageIndex(): number;
    getPageCount(): number;
    flipNext(): void;
    flipPrev(): void;
    flip(pageNum: number): void;
    turnToPage(pageNum: number): void;
  }

  export interface FlipEvent {
    data: number;
    object: PageFlipInstance;
  }

  export interface HTMLFlipBookProps {
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
    width: number;
    height: number;
    size?: "fixed" | "stretch";
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    startPage?: number;
    drawShadow?: boolean;
    flippingTime?: number;
    usePortrait?: boolean;
    startZIndex?: number;
    autoSize?: boolean;
    maxShadowOpacity?: number;
    showCover?: boolean;
    mobileScrollSupport?: boolean;
    clickEventForward?: boolean;
    useMouseEvents?: boolean;
    swipeDistance?: number;
    showPageCorners?: boolean;
    disableFlipByClick?: boolean;
    onFlip?: (e: FlipEvent) => void;
    onChangeOrientation?: (e: FlipEvent) => void;
    onChangeState?: (e: FlipEvent) => void;
    onInit?: (e: FlipEvent) => void;
    onUpdate?: (e: FlipEvent) => void;
  }

  export interface PageFlipHandle {
    pageFlip(): PageFlipInstance;
  }

  const HTMLFlipBook: ForwardRefExoticComponent<
    HTMLFlipBookProps & RefAttributes<PageFlipHandle>
  >;
  export default HTMLFlipBook;
}

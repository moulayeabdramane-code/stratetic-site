/**
 * Aperçu fidèle du document : le HTML du gabarit (identique au PDF) est rendu
 * dans une iframe, puis mis à l'échelle de la colonne.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const FRAME_W = 842; // page A4 (794 px) + marges de l'aperçu

export default function Preview({ html, src }) {
  const wrap = useRef(null);
  const frame = useRef(null);
  const [scale, setScale] = useState(0.6);
  const [height, setHeight] = useState(1170);

  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(Math.min(el.clientWidth / FRAME_W, 1.2)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Hauteur réelle (nombre de pages) une fois la pagination terminée
  useEffect(() => {
    const f = frame.current;
    if (!f) return;
    let timer;
    const measure = () => {
      try {
        const d = f.contentDocument;
        if (d?.documentElement?.getAttribute('data-ready')) setHeight(d.documentElement.scrollHeight);
        else timer = setTimeout(measure, 120);
      } catch { /* ignoré */ }
    };
    const onLoad = () => measure();
    f.addEventListener('load', onLoad);
    return () => { f.removeEventListener('load', onLoad); clearTimeout(timer); };
  }, [html, src]);

  return (
    <div className="preview-frame" ref={wrap} style={{ height: height * scale }}>
      <iframe
        ref={frame}
        title="Aperçu du document"
        srcDoc={html ?? undefined}
        src={html == null ? src : undefined}
        style={{ width: FRAME_W, height, transform: `scale(${scale})` }}
      />
    </div>
  );
}

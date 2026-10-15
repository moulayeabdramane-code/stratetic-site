/*
 * Pagination du gabarit — exécuté dans la page (aperçu et Chromium/PDF).
 *
 * Le serveur fournit, dans <template id="src">, les blocs à placer :
 *   .src-first   en-tête complet (bandeau, parties, cartouche)
 *   .src-cont    en-tête des pages de suite
 *   .src-thead   en-tête du tableau
 *   .src-row     une ligne d'article (n fois)
 *   .src-totals  bloc des totaux
 *   .src-words   bloc « Arrêtée à »
 *   .src-bottom  conditions / coordonnées bancaires / QR
 *   .src-footer  pied de page (répété)
 *   .src-mark    filigrane (optionnel, répété)
 *   .src-terms   page de conditions générales (optionnelle)
 *
 * Les lignes sont mesurées puis réparties de façon à ce que :
 *   - sur une page intermédiaire, le tableau s'arrête avant le pied de page ;
 *   - sur la dernière page, totaux + montant en lettres tiennent au-dessus du
 *     bloc conditions (y = 896 px), comme dans le modèle.
 */
(function () {
  var FIRST_TOP = 375;      // haut du tableau, page 1 (modèle : 281,2 pt)
  var CONT_TOP = 80;        // haut du tableau, pages de suite
  var ROWS_LIMIT = 1040;    // bas max. du tableau sur une page intermédiaire
  var LAST_LIMIT = 872;     // bas max. du bloc « Arrêtée à » sur la dernière page
  var GAP_TOTALS = 31;      // fin du tableau -> totaux
  var GAP_WORDS = 36;       // fin des totaux -> montant en lettres
  var THEAD_H = 40;
  var SIDE_W = 390;       // largeur de « Arrêtée à » en variante compacte

  function run() {
    var src = document.getElementById('src').content;
    var pick = function (sel) { return src.querySelector(sel); };
    var rows = Array.prototype.slice.call(src.querySelectorAll('.src-row'));

    // Mesure hors écran
    var measure = document.getElementById('measure');
    var heightOf = function (node, width) {
      var c = node.cloneNode(true);
      measure.style.width = (width || 714) + 'px';
      measure.appendChild(c);
      var h = c.getBoundingClientRect().height;
      measure.removeChild(c);
      return h;
    };
    var rowH = rows.map(function (r) { return heightOf(r); });
    var totalsH = heightOf(pick('.src-totals'), 300);
    var wordsH = heightOf(pick('.src-words'));
    var tailH = GAP_TOTALS + totalsH + GAP_WORDS + wordsH;

    // Variante compacte (beaucoup de lignes de totaux) : totaux resserrés et
    // « Arrêtée à » placé à leur gauche, dans la zone laissée vide par le modèle.
    var compactTotals = pick('.src-totals').cloneNode(true);
    compactTotals.classList.add('compact');
    var sideWords = pick('.src-words').cloneNode(true);
    sideWords.classList.add('side');
    var compactH = Math.max(heightOf(compactTotals, 300), heightOf(sideWords, SIDE_W));
    var compactTailH = GAP_TOTALS + compactH;

    // Répartition des lignes
    var pages = [];
    var cur = { rows: [], top: FIRST_TOP, y: FIRST_TOP + THEAD_H };
    rows.forEach(function (r, i) {
      if (cur.rows.length && cur.y + rowH[i] > ROWS_LIMIT) {
        pages.push(cur);
        cur = { rows: [], top: CONT_TOP, y: CONT_TOP + THEAD_H };
      }
      cur.rows.push(i);
      cur.y += rowH[i];
    });
    var compact = false;
    if (cur.y + tailH > LAST_LIMIT && cur.y + compactTailH <= LAST_LIMIT) compact = true;
    else if (cur.y + tailH > LAST_LIMIT) {
      // Les totaux ne tiennent pas : on emmène la dernière ligne avec eux
      // (jamais de totaux orphelins sans tableau), sauf si elle est seule.
      var next = { rows: [], top: CONT_TOP, y: CONT_TOP + THEAD_H };
      if (cur.rows.length > 1) {
        var moved = cur.rows.pop();
        cur.y -= rowH[moved];
        next.rows.push(moved);
        next.y += rowH[moved];
      } else {
        next.y = CONT_TOP - GAP_TOTALS;
      }
      pages.push(cur);
      cur = next;
    }
    pages.push(cur);

    // Construction des pages
    var root = document.getElementById('pages');
    var total = pages.length + (pick('.src-terms') ? 1 : 0);
    var clone = function (sel) { var n = pick(sel); return n ? n.cloneNode(true) : null; };
    var addCommon = function (page, index) {
      var mark = clone('.src-mark');
      if (mark) page.appendChild(mark);
      var foot = clone('.src-footer');
      if (total > 1) {
        var pg = document.createElement('span');
        pg.className = 'pg';
        pg.textContent = 'Page ' + (index + 1) + ' / ' + total;
        foot.querySelector('.foot').appendChild(pg);
      }
      page.appendChild(foot);
    };

    pages.forEach(function (p, index) {
      var page = document.createElement('section');
      page.className = 'page';
      var head = clone(index === 0 ? '.src-first' : '.src-cont');
      while (head.firstChild) page.appendChild(head.firstChild);

      var isLast = index === pages.length - 1;
      if (p.rows.length) {
        var items = document.createElement('div');
        items.className = 'items';
        items.style.top = p.top + 'px';
        items.appendChild(clone('.src-thead'));
        p.rows.forEach(function (i) { items.appendChild(rows[i].cloneNode(true)); });
        page.appendChild(items);
      }
      if (isLast) {
        var tTop = p.y + GAP_TOTALS;
        var totals = compact ? compactTotals : clone('.src-totals');
        totals.style.top = tTop + 'px';
        page.appendChild(totals);
        var words = compact ? sideWords : clone('.src-words');
        words.style.top = (compact ? tTop : tTop + totalsH + GAP_WORDS) + 'px';
        page.appendChild(words);
        var bottom = clone('.src-bottom');
        while (bottom.firstChild) page.appendChild(bottom.firstChild);
      }
      addCommon(page, index);
      root.appendChild(page);
    });

    var terms = clone('.src-terms');
    if (terms) {
      var tp = document.createElement('section');
      tp.className = 'page';
      var h = clone('.src-cont');
      while (h.firstChild) tp.appendChild(h.firstChild);
      while (terms.firstChild) tp.appendChild(terms.firstChild);
      addCommon(tp, pages.length);
      root.appendChild(tp);
    }

    window.__PAGES = total;
    window.__PAGINATED = true;
    document.documentElement.setAttribute('data-ready', '1');
  }

  var start = function () {
    // Les polices du gabarit doivent être chargées avant toute mesure.
    var loads = ['400 12px Figtree', '500 13px Figtree', '600 13px Figtree', '700 16px Figtree',
      'italic 400 13px Figtree', '500 15px Jost', '600 26px Jost', '700 10px Jost'];
    Promise.all(loads.map(function (f) { return document.fonts.load(f).catch(function () {}); }))
      .then(function () { return document.fonts.ready; })
      .then(run, run);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();

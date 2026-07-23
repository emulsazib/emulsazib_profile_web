/*
 * SEOAnalyzer — a self-contained, dependency-free SEO + readability engine.
 *
 * Exposes a global `window.SEOAnalyzer` with:
 *   analyze(input)  -> { score, checks, readability, keyword, meta }
 *
 * `input` fields (all optional strings unless noted):
 *   focusKeyword, title, metaTitle, metaDescription, slug, contentHtml, excerpt
 *
 * The engine is pure (no DOM mutation, no network). It parses `contentHtml`
 * into a detached document to inspect headings, paragraphs, images and text.
 *
 * Each check has: { id, label, status: 'good'|'ok'|'bad', text }
 * The aggregate `score` (0-100) is a weighted blend of the checks.
 */
(function (global) {
  'use strict';

  // ── Meta length guidance (SEO best practice) ──
  var META_TITLE_MIN = 50;
  var META_TITLE_MAX = 60;
  var META_DESC_MIN = 120;
  var META_DESC_GOOD = 150;
  var META_DESC_MAX = 160;

  // A compact set of common English transition words/phrases.
  var TRANSITION_WORDS = [
    'accordingly', 'additionally', 'afterward', 'also', 'although', 'as a result',
    'basically', 'because', 'before', 'besides', 'but', 'certainly', 'consequently',
    'conversely', 'finally', 'first', 'firstly', 'for example', 'for instance',
    'furthermore', 'hence', 'however', 'in addition', 'in contrast', 'in fact',
    'in other words', 'indeed', 'instead', 'later', 'likewise', 'meanwhile',
    'moreover', 'namely', 'nevertheless', 'next', 'nonetheless', 'notably',
    'on the other hand', 'otherwise', 'overall', 'similarly', 'since', 'so',
    'specifically', 'still', 'subsequently', 'that is', 'then', 'therefore',
    'thus', 'ultimately', 'unless', 'until', 'whereas', 'while', 'yet',
  ];

  function esc(s) {
    return String(s == null ? '' : s);
  }

  function norm(s) {
    return esc(s).toLowerCase().trim();
  }

  function countOccurrences(haystack, needle) {
    if (!needle) return 0;
    var h = norm(haystack);
    var n = norm(needle);
    if (!n) return 0;
    var count = 0;
    var idx = h.indexOf(n);
    while (idx !== -1) {
      count += 1;
      idx = h.indexOf(n, idx + n.length);
    }
    return count;
  }

  // Parse contentHtml into a structured snapshot without touching the live DOM.
  function parseContent(contentHtml) {
    var doc;
    try {
      doc = new DOMParser().parseFromString(
        '<div id="__seo_root">' + esc(contentHtml) + '</div>',
        'text/html'
      );
    } catch (e) {
      doc = null;
    }
    var root = doc && doc.getElementById('__seo_root');

    var text = '';
    var headings = [];
    var paragraphs = [];
    var images = [];
    var links = [];

    if (root) {
      text = (root.textContent || '').replace(/\s+/g, ' ').trim();
      var hs = root.querySelectorAll('h1,h2,h3,h4,h5,h6');
      for (var i = 0; i < hs.length; i++) headings.push(hs[i].textContent || '');
      var ps = root.querySelectorAll('p,li,blockquote');
      for (var j = 0; j < ps.length; j++) {
        var t = (ps[j].textContent || '').trim();
        if (t) paragraphs.push(t);
      }
      var imgs = root.querySelectorAll('img');
      for (var k = 0; k < imgs.length; k++) {
        images.push({ alt: imgs[k].getAttribute('alt') || '' });
      }
      var as = root.querySelectorAll('a');
      for (var m = 0; m < as.length; m++) {
        links.push({ href: as[m].getAttribute('href') || '' });
      }
    } else {
      // Fallback: strip tags crudely.
      text = esc(contentHtml).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    var words = text ? text.split(/\s+/).filter(Boolean) : [];
    return {
      text: text,
      words: words,
      wordCount: words.length,
      headings: headings,
      paragraphs: paragraphs,
      images: images,
      links: links,
    };
  }

  function splitSentences(text) {
    if (!text) return [];
    return text
      .replace(/\s+/g, ' ')
      .split(/(?<=[.!?])\s+/)
      .map(function (s) { return s.trim(); })
      .filter(Boolean);
  }

  function pct(part, whole) {
    if (!whole) return 0;
    return (part / whole) * 100;
  }

  // ── Readability analysis ──
  function analyzeReadability(parsed) {
    var sentences = splitSentences(parsed.text);
    var sentenceCount = sentences.length;
    var wordCount = parsed.wordCount;

    var longSentences = 0;
    var starts = {};
    var consecutiveStartFlag = false;
    var prevStart = null;
    for (var i = 0; i < sentences.length; i++) {
      var sw = sentences[i].split(/\s+/).filter(Boolean);
      if (sw.length > 20) longSentences += 1;
      var start = norm(sw[0] || '');
      if (start) {
        starts[start] = (starts[start] || 0) + 1;
        if (prevStart && prevStart === start) consecutiveStartFlag = true;
        prevStart = start;
      }
    }

    var avgSentenceLen = sentenceCount ? wordCount / sentenceCount : 0;
    var longSentencePct = pct(longSentences, sentenceCount);

    // Transition words: share of sentences that contain at least one.
    var sentencesWithTransition = 0;
    for (var s = 0; s < sentences.length; s++) {
      var low = ' ' + norm(sentences[s]) + ' ';
      for (var t = 0; t < TRANSITION_WORDS.length; t++) {
        if (low.indexOf(' ' + TRANSITION_WORDS[t] + ' ') !== -1) {
          sentencesWithTransition += 1;
          break;
        }
      }
    }
    var transitionPct = pct(sentencesWithTransition, sentenceCount);

    // Paragraph length in words.
    var longParagraphs = 0;
    var paraWordTotal = 0;
    for (var p = 0; p < parsed.paragraphs.length; p++) {
      var pw = parsed.paragraphs[p].split(/\s+/).filter(Boolean).length;
      paraWordTotal += pw;
      if (pw > 150) longParagraphs += 1;
    }
    var avgParagraphLen = parsed.paragraphs.length
      ? paraWordTotal / parsed.paragraphs.length
      : 0;

    var checks = [];

    // Sentence length.
    if (!sentenceCount) {
      checks.push(mk('read-sentence', 'Sentence length', 'bad', 'Add some content to analyze sentence length.'));
    } else if (longSentencePct <= 25) {
      checks.push(mk('read-sentence', 'Sentence length', 'good',
        Math.round(longSentencePct) + '% of sentences are over 20 words — within the recommended limit.'));
    } else {
      checks.push(mk('read-sentence', 'Sentence length', longSentencePct <= 35 ? 'ok' : 'bad',
        Math.round(longSentencePct) + '% of sentences are over 20 words. Try to keep it under 25%.'));
    }

    // Paragraph length.
    if (parsed.paragraphs.length && longParagraphs === 0) {
      checks.push(mk('read-paragraph', 'Paragraph length', 'good', 'No overly long paragraphs — nicely scannable.'));
    } else if (longParagraphs > 0) {
      checks.push(mk('read-paragraph', 'Paragraph length', longParagraphs === 1 ? 'ok' : 'bad',
        longParagraphs + ' paragraph(s) exceed 150 words. Break them up for readability.'));
    } else {
      checks.push(mk('read-paragraph', 'Paragraph length', 'bad', 'Add paragraphs to structure your content.'));
    }

    // Transition words.
    if (transitionPct >= 30) {
      checks.push(mk('read-transition', 'Transition words', 'good',
        Math.round(transitionPct) + '% of sentences use transition words — great flow.'));
    } else {
      checks.push(mk('read-transition', 'Transition words', transitionPct >= 20 ? 'ok' : 'bad',
        'Only ' + Math.round(transitionPct) + '% of sentences use transition words. Aim for 30%+.'));
    }

    // Consecutive sentence starts.
    checks.push(consecutiveStartFlag
      ? mk('read-starts', 'Consecutive sentences', 'ok', 'Some consecutive sentences start with the same word — vary them.')
      : mk('read-starts', 'Consecutive sentences', 'good', 'Sentence openings are varied.'));

    return {
      sentenceCount: sentenceCount,
      wordCount: wordCount,
      avgSentenceLen: Math.round(avgSentenceLen * 10) / 10,
      longSentencePct: Math.round(longSentencePct),
      transitionPct: Math.round(transitionPct),
      avgParagraphLen: Math.round(avgParagraphLen),
      checks: checks,
    };
  }

  function mk(id, label, status, text) {
    return { id: id, label: label, status: status, text: text };
  }

  // ── Keyword + meta analysis ──
  function analyzeSeo(input, parsed) {
    var kw = norm(input.focusKeyword);
    var checks = [];

    // Keyword density.
    var kwWordLen = kw ? kw.split(/\s+/).filter(Boolean).length : 0;
    var occurrences = kw ? countOccurrences(parsed.text, input.focusKeyword) : 0;
    var density = parsed.wordCount
      ? pct(occurrences * kwWordLen, parsed.wordCount)
      : 0;
    density = Math.round(density * 100) / 100;

    if (!kw) {
      checks.push(mk('kw-set', 'Focus keyword', 'bad', 'Set a focus keyword to unlock keyword analysis.'));
    } else {
      checks.push(mk('kw-set', 'Focus keyword', 'good', 'Focus keyword: “' + input.focusKeyword.trim() + '”.'));

      // In title.
      checks.push(countOccurrences(input.title, input.focusKeyword) > 0
        ? mk('kw-title', 'Keyword in title', 'good', 'The focus keyword appears in the post title.')
        : mk('kw-title', 'Keyword in title', 'bad', 'Add the focus keyword to the post title.'));

      // In meta description.
      checks.push(countOccurrences(input.metaDescription, input.focusKeyword) > 0
        ? mk('kw-meta', 'Keyword in meta description', 'good', 'The focus keyword appears in the meta description.')
        : mk('kw-meta', 'Keyword in meta description', 'bad', 'Add the focus keyword to the meta description.'));

      // In slug.
      checks.push(norm(input.slug).indexOf(kw.replace(/\s+/g, '-')) !== -1 ||
        countOccurrences((input.slug || '').replace(/-/g, ' '), input.focusKeyword) > 0
        ? mk('kw-slug', 'Keyword in URL slug', 'good', 'The focus keyword appears in the URL slug.')
        : mk('kw-slug', 'Keyword in URL slug', 'ok', 'Consider adding the focus keyword to the URL slug.'));

      // In first paragraph.
      var firstPara = parsed.paragraphs[0] || '';
      checks.push(countOccurrences(firstPara, input.focusKeyword) > 0
        ? mk('kw-intro', 'Keyword in introduction', 'good', 'The focus keyword appears in the first paragraph.')
        : mk('kw-intro', 'Keyword in introduction', 'ok', 'Mention the focus keyword early, in the first paragraph.'));

      // In a subheading.
      var inHeading = false;
      for (var h = 0; h < parsed.headings.length; h++) {
        if (countOccurrences(parsed.headings[h], input.focusKeyword) > 0) { inHeading = true; break; }
      }
      checks.push(inHeading
        ? mk('kw-heading', 'Keyword in a subheading', 'good', 'The focus keyword appears in at least one subheading.')
        : mk('kw-heading', 'Keyword in a subheading', 'ok', 'Add the focus keyword to at least one subheading.'));

      // In image alt.
      var altHit = false;
      var hasImages = parsed.images.length > 0;
      for (var im = 0; im < parsed.images.length; im++) {
        if (countOccurrences(parsed.images[im].alt, input.focusKeyword) > 0) { altHit = true; break; }
      }
      if (!hasImages) {
        checks.push(mk('kw-alt', 'Keyword in image alt', 'ok', 'No images yet. Images with keyword-rich alt text help SEO.'));
      } else {
        checks.push(altHit
          ? mk('kw-alt', 'Keyword in image alt', 'good', 'An image alt attribute contains the focus keyword.')
          : mk('kw-alt', 'Keyword in image alt', 'ok', 'Add the focus keyword to an image alt attribute.'));
      }

      // Density band.
      if (occurrences === 0) {
        checks.push(mk('kw-density', 'Keyword density', 'bad', 'The focus keyword does not appear in the content.'));
      } else if (density < 0.5) {
        checks.push(mk('kw-density', 'Keyword density', 'ok', 'Keyword density is ' + density + '% — a little low. Aim for 0.5–2.5%.'));
      } else if (density <= 2.5) {
        checks.push(mk('kw-density', 'Keyword density', 'good', 'Keyword density is ' + density + '% — right in the sweet spot.'));
      } else {
        checks.push(mk('kw-density', 'Keyword density', 'bad', 'Keyword density is ' + density + '% — too high (keyword stuffing).'));
      }
    }

    // Content length.
    if (parsed.wordCount >= 300) {
      checks.push(mk('content-length', 'Content length', 'good', parsed.wordCount + ' words — good length for SEO.'));
    } else {
      checks.push(mk('content-length', 'Content length', parsed.wordCount >= 150 ? 'ok' : 'bad',
        parsed.wordCount + ' words. Aim for at least 300 words.'));
    }

    // Meta title length.
    var metaTitle = esc(input.metaTitle || input.title);
    var mtLen = metaTitle.trim().length;
    if (mtLen >= META_TITLE_MIN && mtLen <= META_TITLE_MAX) {
      checks.push(mk('meta-title', 'Meta title length', 'good', 'Meta title is ' + mtLen + ' characters — ideal.'));
    } else if (mtLen > 0) {
      checks.push(mk('meta-title', 'Meta title length', mtLen < META_TITLE_MIN ? 'ok' : 'bad',
        'Meta title is ' + mtLen + ' characters. Aim for ' + META_TITLE_MIN + '–' + META_TITLE_MAX + '.'));
    } else {
      checks.push(mk('meta-title', 'Meta title length', 'bad', 'Add a meta title.'));
    }

    // Meta description length.
    var mdLen = esc(input.metaDescription).trim().length;
    if (mdLen >= META_DESC_MIN && mdLen <= META_DESC_MAX) {
      checks.push(mk('meta-desc', 'Meta description length', 'good', 'Meta description is ' + mdLen + ' characters — ideal.'));
    } else if (mdLen > 0) {
      checks.push(mk('meta-desc', 'Meta description length', mdLen < META_DESC_MIN ? 'ok' : 'bad',
        'Meta description is ' + mdLen + ' characters. Aim for ' + META_DESC_MIN + '–' + META_DESC_MAX + '.'));
    } else {
      checks.push(mk('meta-desc', 'Meta description length', 'bad', 'Add a meta description.'));
    }

    // Headings present.
    checks.push(parsed.headings.length > 0
      ? mk('has-headings', 'Subheadings', 'good', parsed.headings.length + ' subheading(s) structure the content.')
      : mk('has-headings', 'Subheadings', 'ok', 'Add subheadings (H2/H3) to structure your content.'));

    // Image alt coverage (independent of keyword).
    if (parsed.images.length > 0) {
      var missingAlt = 0;
      for (var a = 0; a < parsed.images.length; a++) {
        if (!parsed.images[a].alt.trim()) missingAlt += 1;
      }
      checks.push(missingAlt === 0
        ? mk('alt-coverage', 'Image alt text', 'good', 'All images have alt text.')
        : mk('alt-coverage', 'Image alt text', 'bad', missingAlt + ' image(s) are missing alt text.'));
    }

    return {
      checks: checks,
      keyword: { occurrences: occurrences, density: density },
      meta: {
        titleLength: mtLen,
        titleTarget: [META_TITLE_MIN, META_TITLE_MAX],
        descriptionLength: mdLen,
        descriptionTarget: [META_DESC_MIN, META_DESC_MAX, META_DESC_GOOD],
      },
    };
  }

  // Weighted aggregate score. 'good' = full, 'ok' = half, 'bad' = 0.
  function scoreOf(checks) {
    if (!checks.length) return 0;
    var earned = 0;
    for (var i = 0; i < checks.length; i++) {
      if (checks[i].status === 'good') earned += 1;
      else if (checks[i].status === 'ok') earned += 0.5;
    }
    return Math.round((earned / checks.length) * 100);
  }

  function analyze(input) {
    input = input || {};
    var parsed = parseContent(input.contentHtml);
    var seo = analyzeSeo(input, parsed);
    var readability = analyzeReadability(parsed);

    var allChecks = seo.checks.concat(readability.checks);
    var score = scoreOf(allChecks);

    return {
      score: score,
      checks: seo.checks,
      readability: readability,
      keyword: seo.keyword,
      meta: seo.meta,
      wordCount: parsed.wordCount,
    };
  }

  global.SEOAnalyzer = { analyze: analyze };
})(typeof window !== 'undefined' ? window : this);

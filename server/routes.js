import { createServer } from "http";
import { checkTextSchema } from "../shared/schema.js";
import {
  calculateSimilarity,
  searchWeb,
  fetchPageContent,
  nGramSimilarity,
} from "./plagiarism.js";

/**
 * Score a sentence by "searchability" — how likely it is to
 * produce useful web search results.
 */
function searchabilityScore(sentence) {
  const words = sentence.toLowerCase().split(/\s+/).filter(w => w.length > 1);
  if (words.length < 3) return 0;

  const uniqueWords = new Set(words);
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
  const lengthBonus = words.length >= 8 && words.length <= 50 ? 1.5 : 1;

  const stopwords = new Set(["the","a","an","is","are","was","were","be","been","being",
    "have","has","had","do","does","did","will","would","could","should","may","might",
    "shall","can","this","that","these","those","it","its","in","on","at","to","for",
    "of","with","by","from","as","into","and","but","or","not","no","so","if","then",
    "than","also","very","just","about","above","after","before","between","each","more"]);
  const nonStopCount = words.filter(w => !stopwords.has(w)).length;
  const specificityRatio = nonStopCount / words.length;

  return uniqueWords.size * avgWordLength * lengthBonus * specificityRatio;
}

/**
 * Group sentences into N chunks and pick the best sentence from each.
 */
function chunkAndSelectBest(sentences, maxChunks) {
  if (sentences.length <= maxChunks) {
    return sentences.map((s, i) => ({ sentence: s, chunkStart: i, chunkEnd: i }));
  }

  const chunkSize = Math.ceil(sentences.length / maxChunks);
  const selected = [];

  for (let start = 0; start < sentences.length; start += chunkSize) {
    const end = Math.min(start + chunkSize, sentences.length);
    const chunk = sentences.slice(start, end);

    let bestIdx = 0;
    let bestScore = -1;
    for (let j = 0; j < chunk.length; j++) {
      const score = searchabilityScore(chunk[j]);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = j;
      }
    }

    selected.push({
      sentence: chunk[bestIdx],
      chunkStart: start,
      chunkEnd: end - 1,
    });
  }

  return selected;
}

/**
 * Split page content into meaningful paragraphs.
 * Filters out short/junk paragraphs (nav items, footers, etc.)
 */
function splitIntoParas(content, minWords = 30) {
  // Split on double newlines, <br>, or long whitespace gaps
  const rawParas = content
    .split(/\n{2,}|\r\n{2,}/)
    .map(p => p.replace(/\s+/g, ' ').trim())
    .filter(p => {
      const wordCount = p.split(/\s+/).length;
      return wordCount >= minWords && p.length >= 80;
    });

  return rawParas;
}

export function registerRoutes(app) {
  app.post("/api/plagiarism-check", async (req, res) => {
    try {
      const { text } = checkTextSchema.parse(req.body);
      const startTime = Date.now();

      // Set up SSE streaming
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();

      const sendProgress = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      console.log("Starting plagiarism check for text length:", text.length);

      const sentences = text
        .split(/[.!?]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 20);

      console.log("Split into", sentences.length, "sentences");

      sendProgress({
        type: "status",
        phase: "init",
        message: `Document split into ${sentences.length} sentences`,
        progress: 0,
      });

      // ============================================================
      // TWO-PASS STRATEGY WITH PARAGRAPH CHUNKING
      // Pass 1: Chunk → pick best sentence → search web → build corpus
      // Pass 2: Check ALL sentences against paragraph-level corpus
      // ============================================================

      const MAX_WEB_SEARCHES = 20;
      const chunks = chunkAndSelectBest(sentences, MAX_WEB_SEARCHES);

      // Weight: Pass 1 = 60% of progress, Pass 2 = 40%
      const PASS1_WEIGHT = 60;
      const PASS2_WEIGHT = 40;

      console.log(`\n=== PASS 1: Discovering sources (${chunks.length} chunks) ===`);

      sendProgress({
        type: "status",
        phase: "pass1",
        message: `Pass 1: Searching web for ${chunks.length} representative sentences...`,
        progress: 0,
        totalSentences: sentences.length,
        webSearches: chunks.length,
      });

      // Source corpus: Map<url, { fullContent, paragraphs[] }>
      const sourceCorpus = new Map();
      const webSearchedResults = new Map();

      for (let ci = 0; ci < chunks.length; ci++) {
        const { sentence, chunkStart, chunkEnd } = chunks[ci];
        const progress = Math.round(((ci + 1) / chunks.length) * PASS1_WEIGHT);

        console.log(`[${ci + 1}/${chunks.length}] Chunk [${chunkStart}-${chunkEnd}]: ${sentence.substring(0, 50)}...`);

        sendProgress({
          type: "status",
          phase: "pass1",
          message: `Searching chunk ${ci + 1}/${chunks.length}: "${sentence.substring(0, 40)}..."`,
          progress,
          currentChunk: ci + 1,
          totalChunks: chunks.length,
        });

        const urls = await searchWeb(sentence);

        let maxSimilarity = 0;
        const matchedSources = [];

        for (const url of urls) {
          if (!sourceCorpus.has(url)) {
            const content = await fetchPageContent(url);
            if (content && content.length > 100) {
              const paragraphs = splitIntoParas(content);
              sourceCorpus.set(url, { fullContent: content, paragraphs });
            }
          }

          const source = sourceCorpus.get(url);
          if (source && source.paragraphs.length > 0) {
            // Compare against each paragraph, take max
            let bestSim = 0;
            for (const para of source.paragraphs) {
              const cosineSim = calculateSimilarity(sentence, para);
              const ngramSim = nGramSimilarity(sentence, para, 5);
              const sim = Math.max(cosineSim, ngramSim);
              if (sim > bestSim) bestSim = sim;
            }

            if (bestSim > maxSimilarity) maxSimilarity = bestSim;

            if (bestSim > 0.15) {
              matchedSources.push({ url, similarity: Math.round(bestSim * 100) });
            }
          } else if (source) {
            // Fallback: compare against full content if no paragraphs extracted
            const cosineSim = calculateSimilarity(sentence, source.fullContent);
            const ngramSim = nGramSimilarity(sentence, source.fullContent, 5);
            const sim = Math.max(cosineSim, ngramSim);

            if (sim > maxSimilarity) maxSimilarity = sim;
            if (sim > 0.15) {
              matchedSources.push({ url, similarity: Math.round(sim * 100) });
            }
          }
        }

        matchedSources.sort((a, b) => b.similarity - a.similarity);

        const searchedIdx = sentences.indexOf(sentence);
        if (searchedIdx !== -1) {
          webSearchedResults.set(searchedIdx, {
            similarity: maxSimilarity,
            sources: matchedSources,
          });
        }

        if (ci < chunks.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }

      // Build flat paragraph corpus for Pass 2
      let totalParagraphs = 0;
      const paraCorpus = []; // [{ url, paragraph }]
      for (const [url, source] of sourceCorpus) {
        if (source.paragraphs.length > 0) {
          for (const para of source.paragraphs) {
            paraCorpus.push({ url, paragraph: para });
          }
          totalParagraphs += source.paragraphs.length;
        } else {
          // Use full content as single "paragraph"
          paraCorpus.push({ url, paragraph: source.fullContent });
          totalParagraphs++;
        }
      }

      console.log(`\nSource corpus built: ${sourceCorpus.size} pages, ${totalParagraphs} paragraphs`);

      // --- PASS 2: Check ALL sentences against paragraph corpus ---
      console.log(`\n=== PASS 2: Checking all ${sentences.length} sentences against ${totalParagraphs} paragraphs ===`);

      sendProgress({
        type: "status",
        phase: "pass2",
        message: `Pass 2: Analyzing all ${sentences.length} sentences against ${totalParagraphs} source paragraphs...`,
        progress: PASS1_WEIGHT,
      });

      const results = [];

      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];

        if (webSearchedResults.has(i)) {
          const cached = webSearchedResults.get(i);
          results.push({
            sentence,
            similarity: Math.round(cached.similarity * 100),
            sources: cached.sources,
            isPlagiarized: cached.similarity > 0.5,
          });
        } else {
          let maxSimilarity = 0;
          const matchedSources = [];
          const seenUrls = new Set();

          for (const { url, paragraph } of paraCorpus) {
            const cosineSim = calculateSimilarity(sentence, paragraph);
            const ngramSim = nGramSimilarity(sentence, paragraph, 5);
            const similarity = Math.max(cosineSim, ngramSim);

            if (similarity > maxSimilarity) maxSimilarity = similarity;

            if (similarity > 0.15 && !seenUrls.has(url)) {
              seenUrls.add(url);
              matchedSources.push({ url, similarity: Math.round(similarity * 100) });
            }
          }

          matchedSources.sort((a, b) => b.similarity - a.similarity);

          results.push({
            sentence,
            similarity: Math.round(maxSimilarity * 100),
            sources: matchedSources.slice(0, 5),
            isPlagiarized: maxSimilarity > 0.5,
          });
        }

        // Send progress every 3 sentences or on the last one
        if (i % 3 === 0 || i === sentences.length - 1) {
          const progress = PASS1_WEIGHT + Math.round(((i + 1) / sentences.length) * PASS2_WEIGHT);
          sendProgress({
            type: "status",
            phase: "pass2",
            message: `Analyzing sentence ${i + 1}/${sentences.length}...`,
            progress,
            currentSentence: i + 1,
          });
        }
      }

      // --- Aggregate ---
      const elapsedMs = Date.now() - startTime;
      const totalSimilarity = results.reduce((sum, r) => sum + r.similarity, 0);
      const overallScore = Math.round(totalSimilarity / results.length);
      const plagiarizedCount = results.filter((r) => r.isPlagiarized).length;
      const plagiarismPercentage = Math.round(
        (plagiarizedCount / results.length) * 100
      );

      console.log(`\nPlagiarism check complete in ${(elapsedMs / 1000).toFixed(1)}s`);
      console.log(`  Total sentences: ${results.length}`);
      console.log(`  Chunks searched: ${chunks.length}`);
      console.log(`  Sources: ${sourceCorpus.size} pages, ${totalParagraphs} paragraphs`);
      console.log(`  Overall score: ${overallScore}%`);
      console.log(`  Plagiarism: ${plagiarismPercentage}%`);

      const checkResult = {
        overallScore,
        plagiarismPercentage,
        totalSentencesInDocument: sentences.length,
        totalSentences: results.length,
        webSearchesMade: chunks.length,
        sourcesCollected: sourceCorpus.size,
        paragraphsAnalyzed: totalParagraphs,
        plagiarizedSentences: plagiarizedCount,
        elapsedMs,
        results,
      };

      sendProgress({ type: "result", data: checkResult });
      res.end();

    } catch (error) {
      console.error("Error in plagiarism check:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ type: "error", message: error.message || "Unknown error" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({
          error: error instanceof Error ? error.message : "An unknown error occurred",
        });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

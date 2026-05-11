import { useState, useRef } from "react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { checkTextSchema } from "../../../shared/schema";
import {
  Shield, FileSearch, Loader2, Download,
  Clipboard, Check, ChevronDown, ChevronUp, ExternalLink,
  ArrowLeft, FileText, ToggleLeft, ToggleRight, Upload
} from "lucide-react";

const Index = () => {
  const [text, setText] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [progressPhase, setProgressPhase] = useState("");
  const [expandedSources, setExpandedSources] = useState({});
  const [copied, setCopied] = useState(false);
  const [excludeCitations, setExcludeCitations] = useState(false);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const handleCheck = async () => {
    if (!text.trim()) {
      toast({ title: "Error", description: "Please enter some text to check", variant: "destructive" });
      return;
    }
    const validation = checkTextSchema.safeParse({ text });
    if (!validation.success) {
      toast({ title: "Validation Error", description: validation.error.errors[0]?.message || "Validation failed", variant: "destructive" });
      return;
    }
    setIsChecking(true);
    setResult(null);
    setProgress(0);
    setProgressMessage("Starting analysis...");
    setProgressPhase("init");

    try {
      const response = await fetch('/api/plagiarism-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!response.ok) throw new Error('Failed to check plagiarism');

      // Read SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6));

              if (event.type === 'status') {
                setProgress(event.progress || 0);
                setProgressMessage(event.message || '');
                setProgressPhase(event.phase || '');
              } else if (event.type === 'result') {
                setResult(event.data);
                setProgress(100);
                toast({ title: "Check Complete", description: `Plagiarism score: ${event.data.plagiarismPercentage}%` });
              } else if (event.type === 'error') {
                throw new Error(event.message);
              }
            } catch (parseErr) {
              // Skip malformed events
              if (parseErr.message && !parseErr.message.includes('JSON')) throw parseErr;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking plagiarism:', error);
      toast({ title: "Error", description: "Failed to check plagiarism. Please try again.", variant: "destructive" });
    } finally {
      setIsChecking(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({ title: "File Too Large", description: "Maximum file size is 10MB", variant: "destructive" });
      return;
    }

    if (file.type === "text/plain" || file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (ev) => setText(ev.target.result);
      reader.readAsText(file);
    } else {
      toast({ title: "Info", description: "For .doc, .docx, and .pdf files, please copy and paste the text content." });
    }
  };

  const toggleSources = (index) => {
    setExpandedSources(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const getScoreColor = (score) => {
    if (score < 20) return "var(--pg-success)";
    if (score < 50) return "var(--pg-warning)";
    return "var(--pg-danger)";
  };

  const copyResults = () => {
    if (!result) return;
    const text = `PlagGuard Plagiarism Report\n${'='.repeat(40)}\n\nOverall Plagiarism: ${result.plagiarismPercentage}%\nSimilarity Score: ${result.overallScore}%\nSentences Analyzed: ${result.totalSentences}\nPlagiarized Sentences: ${result.plagiarizedSentences}\n\n${'─'.repeat(40)}\nDetailed Results:\n\n${result.results.map((r, i) =>
      `${i + 1}. [${r.isPlagiarized ? 'PLAGIARIZED' : 'ORIGINAL'}] (${r.similarity}%)\n   "${r.sentence}"\n${r.sources.length > 0 ? r.sources.map(s => `   → ${s.url} (${s.similarity}%)`).join('\n') + '\n' : ''}`
    ).join('\n')}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast({ title: "Copied!", description: "Results copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const downloadPDFReport = () => {
    if (!result) return;

    // Build HTML content for the PDF report
    const reportHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>PlagGuard Plagiarism Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a2e; padding: 40px; background: white; }
    .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #6366F1; }
    .header h1 { font-size: 28px; color: #6366F1; margin-bottom: 5px; }
    .header p { color: #666; font-size: 13px; }
    .summary { display: flex; justify-content: space-around; margin: 30px 0; padding: 25px; background: #f8f7ff; border-radius: 12px; border: 1px solid #e8e7f0; }
    .summary-item { text-align: center; }
    .summary-item .value { font-size: 36px; font-weight: 700; }
    .summary-item .label { font-size: 12px; color: #666; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
    .green { color: #10B981; }
    .yellow { color: #F59E0B; }
    .red { color: #EF4444; }
    .stats { display: flex; justify-content: space-between; padding: 15px 20px; background: #fafafa; border-radius: 8px; margin-bottom: 30px; font-size: 14px; }
    .stats span { color: #555; }
    .stats strong { color: #1a1a2e; }
    .results-title { font-size: 18px; font-weight: 600; margin-bottom: 15px; color: #1a1a2e; }
    .sentence { padding: 14px 18px; margin-bottom: 10px; border-radius: 8px; border-left: 4px solid; font-size: 13px; line-height: 1.6; }
    .sentence.original { background: #f0fdf4; border-color: #10B981; }
    .sentence.plagiarized { background: #fef2f2; border-color: #EF4444; }
    .sentence .meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .sentence .badge { padding: 2px 10px; border-radius: 50px; font-size: 11px; font-weight: 600; color: white; }
    .badge.green-bg { background: #10B981; }
    .badge.red-bg { background: #EF4444; }
    .sentence .score { font-weight: 700; font-size: 14px; }
    .sentence .text { color: #333; }
    .sentence .sources { margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(0,0,0,0.08); }
    .sentence .sources a { color: #6366F1; font-size: 12px; display: block; margin-bottom: 3px; text-decoration: none; word-break: break-all; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 11px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>🛡️ PlagGuard Report</h1>
    <p>Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
  </div>

  <div class="summary">
    <div class="summary-item">
      <div class="value ${result.plagiarismPercentage < 20 ? 'green' : result.plagiarismPercentage < 50 ? 'yellow' : 'red'}">${result.plagiarismPercentage}%</div>
      <div class="label">Plagiarism</div>
    </div>
    <div class="summary-item">
      <div class="value ${result.overallScore < 20 ? 'green' : result.overallScore < 50 ? 'yellow' : 'red'}">${result.overallScore}%</div>
      <div class="label">Similarity</div>
    </div>
    <div class="summary-item">
      <div class="value" style="color: #6366F1">${result.totalSentences}</div>
      <div class="label">Analyzed</div>
    </div>
    <div class="summary-item">
      <div class="value red">${result.plagiarizedSentences}</div>
      <div class="label">Flagged</div>
    </div>
  </div>

  <div class="stats">
    <span>Original: <strong>${result.totalSentences - result.plagiarizedSentences} sentences</strong></span>
    <span>Plagiarized: <strong>${result.plagiarizedSentences} sentences</strong></span>
    <span>Originality: <strong>${100 - result.plagiarismPercentage}%</strong></span>
  </div>

  <div class="results-title">Sentence-by-Sentence Analysis</div>
  ${result.results.map((r, i) => `
    <div class="sentence ${r.isPlagiarized ? 'plagiarized' : 'original'}">
      <div class="meta">
        <span class="badge ${r.isPlagiarized ? 'red-bg' : 'green-bg'}">${r.isPlagiarized ? 'Plagiarized' : 'Original'}</span>
        <span class="score" style="color: ${r.isPlagiarized ? '#EF4444' : '#10B981'}">${r.similarity}%</span>
      </div>
      <div class="text">${r.sentence}</div>
      ${r.sources.length > 0 ? `
        <div class="sources">
          ${r.sources.map(s => `<a href="${s.url}">${s.url} (${s.similarity}%)</a>`).join('')}
        </div>
      ` : ''}
    </div>
  `).join('')}

  <div class="footer">
    <p>© PlagGuard — Free Open-Source Plagiarism Checker</p>
    <p>This report is auto-generated. For accurate results, review sources manually.</p>
  </div>
</body>
</html>`;

    // Open in new window for print/save as PDF
    const printWindow = window.open('', '_blank');
    printWindow.document.write(reportHTML);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };

    toast({ title: "Report Generated", description: "Use Print → Save as PDF in the dialog" });
  };

  // Circular gauge component
  const ScoreGauge = ({ score, label, size = 120 }) => {
    const radius = (size - 16) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const color = getScoreColor(score);

    return (
      <div className="text-center">
        <div className="score-gauge mx-auto" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle className="gauge-bg" cx={size / 2} cy={size / 2} r={radius} />
            <circle
              className="gauge-fill"
              cx={size / 2} cy={size / 2} r={radius}
              stroke={color}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ filter: `drop-shadow(0 0 6px ${color})` }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold" style={{ color }}>{score}%</span>
          </div>
        </div>
        <p className="text-sm text-[var(--pg-text-muted)] mt-2 font-medium">{label}</p>
      </div>
    );
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="glass-nav fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/">
              <div className="flex items-center gap-2.5 cursor-pointer">
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white tracking-tight">PlagGuard</span>
              </div>
            </Link>
            <Link href="/">
              <span className="text-sm text-[var(--pg-text-secondary)] hover:text-white transition-colors cursor-pointer hidden sm:flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
              </span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-28 pb-16 px-6">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Input Card */}
          <div className="glass-card p-8 animate-fade-in-up" data-testid="card-input">
            <div className="flex items-center gap-3 mb-2">
              <div className="feature-icon" style={{ width: 36, height: 36, marginBottom: 0 }}>
                <FileSearch className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold text-white">Check Your Text</h1>
            </div>
            <p className="text-[var(--pg-text-muted)] mb-6 ml-12">
              Paste your academic paper, essay, or any text below to scan for plagiarism
            </p>

            <textarea
              data-testid="input-text"
              className="pg-textarea min-h-[200px]"
              placeholder="Paste your text here (minimum 100 characters)..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />

            <div className="mt-4 space-y-4">
              {/* Character & word count */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-[var(--pg-text-muted)]" data-testid="text-character-count">
                    {text.length} characters · {wordCount} words
                  </span>
                </div>
                <button
                  data-testid="button-check-plagiarism"
                  className="btn-primary"
                  onClick={handleCheck}
                  disabled={isChecking || text.length < 100}
                >
                  {isChecking && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isChecking ? "Checking..." : "Check Plagiarism"}
                  {!isChecking && <FileSearch className="w-4 h-4" />}
                </button>
              </div>

              {/* File upload & toggle */}
              <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-[var(--pg-glass-border)]">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 text-sm text-[var(--pg-text-muted)] hover:text-[var(--pg-primary-light)] transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  Upload a file (.txt, .doc, .docx, .pdf — max 10MB)
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.doc,.docx,.pdf"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <button
                  onClick={() => setExcludeCitations(!excludeCitations)}
                  className="flex items-center gap-2 text-sm text-[var(--pg-text-muted)] hover:text-white transition-colors"
                >
                  {excludeCitations ?
                    <ToggleRight className="w-5 h-5 text-[var(--pg-primary)]" /> :
                    <ToggleLeft className="w-5 h-5" />
                  }
                  Exclude citations & quotes
                </button>
              </div>

              {/* Progress during check */}
              {isChecking && (
                <div className="animate-fade-in-up" data-testid="alert-checking">
                  <div className="glass-card p-5 mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 text-[var(--pg-primary-light)] animate-spin" />
                        <span className="text-sm font-medium text-white">
                          {progressPhase === 'pass1' ? 'Pass 1: Discovering Sources' : progressPhase === 'pass2' ? 'Pass 2: Analyzing Sentences' : 'Initializing...'}
                        </span>
                      </div>
                      <span className="text-sm font-bold gradient-text">{progress}%</span>
                    </div>
                    <p className="text-xs text-[var(--pg-text-muted)] mb-3 ml-6">
                      {progressMessage}
                    </p>
                    <div className="pg-progress" style={{ height: '8px' }}>
                      <div
                        className="pg-progress-fill"
                        style={{
                          width: `${progress}%`,
                          transition: 'width 0.4s ease',
                          background: progressPhase === 'pass2'
                            ? 'linear-gradient(90deg, #10B981, #34D399)'
                            : 'linear-gradient(90deg, var(--pg-primary), var(--pg-primary-light))'
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-[var(--pg-text-muted)]">
                      <span>{progressPhase === 'pass1' ? '🔍 Searching web...' : '⚡ Local analysis (fast)'}</span>
                      <span>{progressPhase === 'pass2' ? 'No web requests — checking locally' : 'Max 20 web searches'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

             {result && (
            <div className="space-y-6 animate-fade-in-up">
              {/* Summary Card */}
              <div className="glass-card p-8" data-testid="card-report">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[var(--pg-primary-light)]" />
                    Plagiarism Report
                  </h2>
                  {result.elapsedMs && (
                    <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-[var(--pg-surface)] border border-[var(--pg-glass-border)] text-[var(--pg-text-secondary)]">
                      ⏱ Completed in {result.elapsedMs >= 60000
                        ? `${Math.floor(result.elapsedMs / 60000)}m ${Math.round((result.elapsedMs % 60000) / 1000)}s`
                        : `${(result.elapsedMs / 1000).toFixed(1)}s`
                      }
                    </span>
                  )}
                </div>

                <div className="grid md:grid-cols-3 gap-8 items-center mb-6">
                  {/* Gauges */}
                  <ScoreGauge score={result.plagiarismPercentage} label="Overall Plagiarism" />
                  <ScoreGauge score={result.overallScore} label="Similarity Score" />

                  {/* Stats */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[var(--pg-text-muted)]">Sentences Checked</span>
                      <span className="font-semibold text-white" data-testid="text-total-sentences">{result.totalSentences}</span>
                    </div>
                    {result.webSearchesMade && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-[var(--pg-text-muted)]">Web Searches</span>
                        <span className="font-semibold text-[var(--pg-primary-light)]">{result.webSearchesMade}</span>
                      </div>
                    )}
                    {result.paragraphsAnalyzed && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-[var(--pg-text-muted)]">Source Paragraphs</span>
                        <span className="font-semibold text-[var(--pg-primary-light)]">{result.paragraphsAnalyzed}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[var(--pg-text-muted)]">Flagged</span>
                      <span className="font-semibold text-red-400" data-testid="text-plagiarized-sentences">{result.plagiarizedSentences}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[var(--pg-text-muted)]">Original</span>
                      <span className="font-semibold text-green-400">{result.totalSentences - result.plagiarizedSentences}</span>
                    </div>
                    <div className="pg-progress mt-2">
                      <div
                        className="pg-progress-fill"
                        style={{
                          width: `${(result.plagiarizedSentences / result.totalSentences) * 100}%`,
                          background: `linear-gradient(90deg, var(--pg-danger), #F87171)`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-[var(--pg-glass-border)]">
                  <button className="btn-primary" onClick={downloadPDFReport}>
                    <Download className="w-4 h-4" />
                    Download PDF Report
                  </button>
                  <button className="btn-ghost" onClick={copyResults}>
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Clipboard className="w-4 h-4" />}
                    {copied ? "Copied!" : "Copy Results"}
                  </button>
                </div>
              </div>

              {/* Detailed Results */}
              <div className="glass-card p-8" data-testid="card-details">
                <h2 className="text-xl font-bold text-white mb-2">Sentence-by-Sentence Analysis</h2>
                <p className="text-sm text-[var(--pg-text-muted)] mb-6">Detailed breakdown with matched sources</p>

                <div className="space-y-3">
                  {result.results.map((item, index) => (
                    <div
                      key={index}
                      data-testid={`result-sentence-${index}`}
                      className={`sentence-card ${item.isPlagiarized ? 'plagiarized' : 'original'}`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={item.isPlagiarized ? 'chip-plagiarized' : 'chip-original'}>
                            {item.isPlagiarized ? 'Plagiarized' : 'Original'}
                          </span>
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded-full"
                            data-testid={`badge-similarity-${index}`}
                            style={{
                              color: getScoreColor(item.similarity),
                              background: item.isPlagiarized ? 'var(--pg-danger-bg)' : 'var(--pg-success-bg)'
                            }}
                          >
                            {item.similarity}%
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-[var(--pg-text-secondary)] leading-relaxed" data-testid={`text-sentence-${index}`}>
                        {item.sentence}
                      </p>

                      {item.sources.length > 0 && (
                        <div className="mt-3">
                          <button
                            onClick={() => toggleSources(index)}
                            className="flex items-center gap-1.5 text-xs text-[var(--pg-primary-light)] hover:text-white transition-colors font-medium"
                          >
                            {expandedSources[index] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            View {item.sources.length} Source{item.sources.length > 1 ? 's' : ''}
                          </button>

                          {expandedSources[index] && (
                            <div className="mt-2 pt-2 border-t border-[rgba(255,255,255,0.05)] space-y-1.5 animate-fade-in-up">
                              {item.sources.map((source, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs">
                                  <ExternalLink className="w-3 h-3 text-[var(--pg-text-muted)] flex-shrink-0" />
                                  <a
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    data-testid={`link-source-${index}-${idx}`}
                                    className="text-[var(--pg-primary-light)] hover:text-white transition-colors truncate flex-1"
                                  >
                                    {source.url}
                                  </a>
                                  <span
                                    className="font-bold flex-shrink-0"
                                    data-testid={`text-source-similarity-${index}-${idx}`}
                                    style={{ color: getScoreColor(source.similarity) }}
                                  >
                                    {source.similarity}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-[var(--pg-glass-border)]">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-[var(--pg-text-muted)]">© 2024 PlagGuard. Fortified Academic Integrity.</p>
          <div className="flex gap-4 text-xs text-[var(--pg-text-muted)]">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
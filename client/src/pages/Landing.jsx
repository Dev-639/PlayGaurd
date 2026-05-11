import { Link } from "wouter";
import { FileSearch, Shield, BarChart3, FileDown, Globe, Cpu, ArrowRight, Github, ChevronRight } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="glass-nav fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">PlagGuard</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#how-it-works" className="text-sm text-[var(--pg-text-secondary)] hover:text-white transition-colors hidden sm:block">
              How It Works
            </a>
            <a href="#features" className="text-sm text-[var(--pg-text-secondary)] hover:text-white transition-colors hidden sm:block">
              Features
            </a>
            <Link href="/check">
              <button className="btn-primary text-sm py-2 px-5">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 bg-[var(--pg-surface)] border border-[var(--pg-glass-border)] rounded-full px-4 py-1.5 mb-6">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="text-xs text-[var(--pg-text-secondary)] font-medium">100% Free & Open Source</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6">
                <span className="text-white">Detect Plagiarism</span>
                <br />
                <span className="gradient-text">with Precision</span>
              </h1>
              <p className="text-lg text-[var(--pg-text-secondary)] max-w-lg mb-8 leading-relaxed">
                Free, open-source plagiarism detection powered by advanced AI and NLP algorithms.
                Check your academic papers against millions of web sources.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/check">
                  <button className="btn-primary text-base py-3 px-8">
                    <FileSearch className="w-5 h-5" />
                    Start Checking
                  </button>
                </Link>
                <a href="#how-it-works">
                  <button className="btn-ghost text-base py-3 px-8">
                    Learn More
                  </button>
                </a>
              </div>
            </div>

            {/* Hero Illustration */}
            <div className="animate-fade-in-up-delay-2 hidden lg:flex justify-center">
              <div className="relative animate-float">
                <div className="w-80 h-80 rounded-3xl bg-gradient-to-br from-indigo-600/20 to-violet-800/20 border border-indigo-500/20 backdrop-blur-xl flex items-center justify-center">
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500/5 to-transparent"></div>
                  <div className="relative z-10 text-center">
                    <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/30 animate-pulse-glow">
                      <Shield className="w-12 h-12 text-white" />
                    </div>
                    <div className="space-y-2 mt-6">
                      <div className="h-2 w-48 bg-indigo-500/20 rounded-full mx-auto"></div>
                      <div className="h-2 w-40 bg-indigo-500/15 rounded-full mx-auto"></div>
                      <div className="h-2 w-44 bg-indigo-500/10 rounded-full mx-auto"></div>
                      <div className="h-2 w-36 bg-green-500/20 rounded-full mx-auto"></div>
                      <div className="h-2 w-48 bg-indigo-500/15 rounded-full mx-auto"></div>
                      <div className="h-2 w-42 bg-red-500/15 rounded-full mx-auto"></div>
                    </div>
                  </div>
                </div>
                {/* Floating badges */}
                <div className="absolute -top-4 -right-4 glass-card px-3 py-2 text-xs font-medium text-green-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                  Original
                </div>
                <div className="absolute -bottom-4 -left-4 glass-card px-3 py-2 text-xs font-medium text-red-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                  78% Match
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="glass-card p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: "10K+", label: "Checks Performed" },
                { value: "High", label: "Accuracy" },
                { value: "100%", label: "Free Forever" },
                { value: "OSS", label: "Open Source" },
              ].map((stat, i) => (
                <div key={i}>
                  <p className="text-3xl font-bold gradient-text">{stat.value}</p>
                  <p className="text-sm text-[var(--pg-text-muted)] mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="section-title mb-3">Powerful Features</h2>
            <p className="text-[var(--pg-text-muted)] text-lg">Advanced plagiarism detection with multiple analysis layers</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Globe className="w-6 h-6" />,
                title: "Web Scraping Engine",
                desc: "Searches DuckDuckGo & CrossRef academic databases to find matching content across the web and scholarly publications."
              },
              {
                icon: <Cpu className="w-6 h-6" />,
                title: "Dual Algorithm Analysis",
                desc: "Combines Cosine Similarity and N-gram matching algorithms for maximum accuracy in detecting paraphrased and copied content."
              },
              {
                icon: <FileDown className="w-6 h-6" />,
                title: "PDF Report Export",
                desc: "Download comprehensive plagiarism reports with detailed source citations, similarity scores, and sentence-level analysis."
              },
            ].map((feature, i) => (
              <div key={i} className={`feature-card animate-fade-in-up-delay-${i + 1}`}>
                <div className="feature-icon">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-[var(--pg-text-muted)] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="section-title mb-3">How It Works</h2>
            <div className="w-12 h-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: 1, title: "Paste or Upload", desc: "Enter your text directly or upload a .txt, .doc, .docx, or .pdf file." },
              { step: 2, title: "AI Analyzes", desc: "Our AI scans your text against millions of web and academic sources." },
              { step: 3, title: "Review Results", desc: "View sentence-by-sentence analysis with highlighted matches." },
              { step: 4, title: "Download Report", desc: "Export a detailed PDF report with all findings and citations." },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="step-circle mx-auto mb-4">{item.step}</div>
                <h3 className="text-base font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-[var(--pg-text-muted)] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card p-12 text-center animate-pulse-glow">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to secure your work?</h2>
            <p className="text-[var(--pg-text-muted)] mb-8 text-lg max-w-xl mx-auto">
              Join thousands of researchers and students using PlagGuard to protect their academic integrity.
            </p>
            <Link href="/check">
              <button className="btn-primary text-base py-3 px-8">
                Get Started Now
                <ChevronRight className="w-5 h-5" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-[var(--pg-glass-border)]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white">PlagGuard</span>
              </div>
              <p className="text-sm text-[var(--pg-text-muted)] leading-relaxed">
                Fortified Academic Integrity through open-source innovation.
              </p>
            </div>
            {[
              { title: "Product", links: ["How It Works", "API Docs"] },
              { title: "Resources", links: ["Privacy Policy", "Terms of Service"] },
              { title: "Support", links: ["Contact", "GitHub"] },
            ].map((col, i) => (
              <div key={i}>
                <h4 className="text-sm font-semibold text-white mb-3">{col.title}</h4>
                <div className="space-y-2">
                  {col.links.map((link, j) => (
                    <a key={j} href="#" className="block text-sm text-[var(--pg-text-muted)] hover:text-white transition-colors">
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-[var(--pg-glass-border)] pt-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-[var(--pg-text-muted)]">© 2024 PlagGuard. Fortified Academic Integrity.</p>
            <a href="https://github.com/cu-sanjay/Free-Turnitin-Plagiarism-Checker" target="_blank" rel="noopener noreferrer" className="text-[var(--pg-text-muted)] hover:text-white transition-colors">
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

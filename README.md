# 🛡️ PlagGuard (Advanced Plagiarism Detection Engine)

[![Open Source](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://github.com/Dev-639/PlayGaurd)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**PlagGuard** is a highly accurate, free, and open-source plagiarism checker built on the modern web stack. It utilizes a sophisticated "two-pass" NLP architecture to thoroughly analyze academic papers and documents against millions of online sources without hitting search engine rate limits or IP bans.

---

## ✨ Key Features

- **🧠 Intelligent Web Scraping (Pass 1):** Intelligently chunks your document and identifies the most "highly-searchable" sentences using unique word scoring and stopword ratios. It safely queries databases to build a relevant source corpus.
- **⚡ Paragraph-Level NLP Analysis (Pass 2):** Downloads source pages and splits them into paragraphs. It then uses **Cosine Similarity** and **N-gram matching** algorithms to cross-reference *every single sentence* in your document locally for maximum precision.
- **📊 Real-Time Streaming Progress:** The backend streams live Server-Sent Events (SSE) to the frontend, delivering a responsive, exact percentage-based progress bar during heavy analysis phases.
- **📑 Detailed PDF Reports:** Generates comprehensive, beautifully formatted PDF reports highlighting exact source citations and sentence-by-sentence similarity breakdowns.
- **🎨 Premium Glassmorphism UI:** A sleek, modern frontend designed with Tailwind CSS, offering a premium "Turnitin-style" user experience for completely free.

---

## 🚀 How It Works

1. **Upload or Paste:** Provide the text you want to analyze.
2. **Source Discovery:** PlagGuard strategically selects a handful of representative sentences and searches the web to build a custom source corpus (capped at 20 searches to prevent IP blocks).
3. **Deep Analysis:** Every sentence in your document is strictly compared against thousands of collected source paragraphs locally to detect paraphrasing and direct copies.
4. **Results:** View detailed metrics, including Overall Plagiarism %, Similarity Score, and a clear breakdown of original vs. flagged sentences.

---

## 💻 Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Lucide Icons
- **Backend:** Node.js, Express.js
- **NLP & Scraping:** Custom Cosine Similarity, N-Grams, Cheerio (for HTML parsing)
- **Architecture:** Server-Sent Events (SSE) for real-time bidirectional communication.

---

## 🛠️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Dev-639/PlayGaurd.git
   cd PlayGaurd
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
   *The application will be running at `http://localhost:5000`.*

---

## 📜 License

This project is open-sourced under the MIT License. Protect your academic integrity!

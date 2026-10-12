import { useEffect, useRef, useState } from "react";
import "./index.css";

const API_URL = "http://localhost:3001/api/reply";

const examples = [
  {
    label: "Pricing request",
    text: "Hi, I'm interested in your services. Could you send me your pricing and let me know how quickly we could get started?",
  },
  {
    label: "Product question",
    text: "Hi, I wanted to know whether your product supports custom integrations and if there is a demo available.",
  },
  {
    label: "Support issue",
    text: "Hi, I'm having trouble accessing my account. I reset my password but I'm still unable to log in.",
  },
  {
    label: "Interested customer",
    text: "Hey, I saw your service online and I'm interested in learning more. Could someone contact me about the available options?",
  },
];

const categoryConfig = {
  sales: {
    label: "Sales",
    icon: "↗",
    description: "Potential customer",
  },
  support: {
    label: "Support",
    icon: "◈",
    description: "Customer assistance",
  },
  spam: {
    label: "Spam",
    icon: "⊘",
    description: "Likely unwanted",
  },
};

const emptyStats = {
  processed: 0,
  sales: 0,
  support: 0,
  spam: 0,
};

function App() {
  const [inquiry, setInquiry] = useState("");
  const [category, setCategory] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState(emptyStats);
  const [lastProcessed, setLastProcessed] = useState(null);

  const textareaRef = useRef(null);
  const resultRef = useRef(null);

  const characterCount = inquiry.length;
  const categoryInfo = categoryConfig[category];

  useEffect(() => {
    function handleShortcut(event) {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key === "Enter" &&
        document.activeElement === textareaRef.current
      ) {
        event.preventDefault();

        if (!loading && inquiry.trim()) {
          generateReply();
        }
      }
    }

    window.addEventListener("keydown", handleShortcut);

    return () => {
      window.removeEventListener("keydown", handleShortcut);
    };
  }, [inquiry, loading]);

  async function generateReply() {
    if (!inquiry.trim() || loading) return;

    setLoading(true);
    setError("");
    setCategory("");
    setReply("");
    setCopied(false);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inquiry: inquiry.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "The AI request failed.");
      }

      if (!data.category || !data.reply) {
        throw new Error("The AI returned an invalid response.");
      }

      const normalizedCategory = String(data.category).toLowerCase();

      setCategory(normalizedCategory);
      setReply(data.reply);

      setStats((current) => ({
        ...current,
        processed: current.processed + 1,
        [normalizedCategory]:
          (current[normalizedCategory] || 0) + 1,
      }));

      setLastProcessed(new Date());
    } catch (err) {
      console.error(err);
      setError(err.message || "The AI request failed.");
    } finally {
      setLoading(false);

      requestAnimationFrame(() => {
        resultRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      });
    }
  }

  async function copyReply() {
    if (!reply) return;

    try {
      await navigator.clipboard.writeText(reply);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch (err) {
      console.error(err);
      setError("Could not copy the reply.");
    }
  }

  function clearWorkspace() {
    setInquiry("");
    setCategory("");
    setReply("");
    setError("");
    setCopied(false);

    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  }

  function useExample(text) {
    setInquiry(text);
    setCategory("");
    setReply("");
    setError("");
    setCopied(false);

    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  }

  function formatTime(date) {
    if (!date) return "No requests yet";

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="app-shell">
      <div className="background-glow glow-left" />
      <div className="background-glow glow-right" />
      <div className="background-grid" />

      <header className="topbar">
        <div className="topbar-inner">
          <button
            className="brand"
            onClick={clearWorkspace}
            aria-label="ReplyFlow home"
          >
            <span className="brand-logo" aria-hidden="true">
              <span className="logo-line logo-line-one" />
              <span className="logo-line logo-line-two" />
              <span className="logo-core" />
            </span>

            <span className="brand-copy">
              <strong>ReplyFlow</strong>
              <small>AI INQUIRY DESK</small>
            </span>
          </button>

          <div className="header-right">
            <div className="system-status">
              <span className="online-indicator">
                <span />
              </span>

              <span>AI SYSTEM</span>
              <strong>READY</strong>
            </div>

            <button
              className="header-action"
              onClick={clearWorkspace}
              aria-label="Start a new inquiry"
              title="New inquiry"
            >
              <span>+</span>
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard">
        <section className="hero">
          <div className="hero-eyebrow">
            <span className="eyebrow-spark">✦</span>
            Intelligent inquiry management
            <span className="eyebrow-divider" />
            Private workspace
          </div>

          <h1>
            Turn every inquiry
            <span>into the right reply.</span>
          </h1>

          <p>
            Understand intent. Classify the conversation. Generate a
            response ready for human review.
          </p>
        </section>

        <section className="workspace">
          <section className="panel composer-panel">
            <div className="panel-top">
              <div>
                <div className="section-kicker">
                  <span className="step-number">01</span>
                  INCOMING INQUIRY
                </div>

                <h2>What did they say?</h2>
              </div>

              {inquiry && (
                <button
                  className="clear-button"
                  onClick={clearWorkspace}
                >
                  Clear
                </button>
              )}
            </div>

            <div className={`composer ${inquiry ? "has-content" : ""}`}>
              <textarea
                ref={textareaRef}
                value={inquiry}
                onChange={(event) => {
                  setInquiry(event.target.value);
                  setError("");
                }}
                placeholder="Paste a customer inquiry here..."
                aria-label="Customer inquiry"
                disabled={loading}
              />

              <div className="composer-bottom">
                <span className="character-count">
                  {characterCount.toLocaleString()} characters
                </span>

                <span className="composer-hint">
                  <kbd>Ctrl</kbd>
                  <span>+</span>
                  <kbd>Enter</kbd>
                </span>
              </div>
            </div>

            <div className="examples-row">
              <span className="examples-title">Try one</span>

              <div className="example-chips">
                {examples.map((example) => (
                  <button
                    key={example.label}
                    className="example-chip"
                    onClick={() => useExample(example.text)}
                    disabled={loading}
                  >
                    {example.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              className={`generate-button ${loading ? "is-loading" : ""}`}
              onClick={generateReply}
              disabled={!inquiry.trim() || loading}
            >
              <span className="generate-shine" />

              {loading ? (
                <>
                  <span className="button-spinner" />
                  <span>Analyzing inquiry...</span>
                </>
              ) : (
                <>
                  <span className="generate-spark">✦</span>
                  <span>Generate AI reply</span>
                  <span className="button-arrow">→</span>
                </>
              )}
            </button>

            <div className="composer-footer">
              <span>
                <span className="tiny-dot" />
                Your inquiry stays in this session
              </span>

              <span>Human review required</span>
            </div>
          </section>

          <section
            className="panel response-panel"
            ref={resultRef}
            aria-live="polite"
          >
            {!loading && !category && !error && (
              <EmptyState />
            )}

            {loading && <LoadingState />}

            {!loading && error && (
              <ErrorState
                error={error}
                onRetry={generateReply}
                onClear={clearWorkspace}
              />
            )}

            {!loading && category && !error && (
              <ResultState
                category={category}
                categoryInfo={categoryInfo}
                reply={reply}
                setReply={setReply}
                copied={copied}
                copyReply={copyReply}
                onClear={clearWorkspace}
                onRegenerate={generateReply}
              />
            )}
          </section>
        </section>

        <section className="session-section">
          <div className="session-heading">
            <div>
              <span className="session-title">Session overview</span>
              <span className="session-subtitle">
                Live workspace metrics
              </span>
            </div>

            <span className="session-time">
              {lastProcessed
                ? `Last processed ${formatTime(lastProcessed)}`
                : "Waiting for first inquiry"}
            </span>
          </div>

          <div className="stats-row">
            <Stat
              label="Processed"
              value={stats.processed}
              description="total inquiries"
              icon="◎"
            />

            <Stat
              label="Sales"
              value={stats.sales}
              description="opportunities"
              icon="↗"
              tone="sales"
            />

            <Stat
              label="Support"
              value={stats.support}
              description="assistance needed"
              icon="◈"
              tone="support"
            />

            <Stat
              label="Spam"
              value={stats.spam}
              description="filtered"
              icon="⊘"
              tone="spam"
            />
          </div>
        </section>
      </main>

      <footer className="footer">
        <span>REPLYFLOW</span>
        <span>AI INQUIRY DESK · LOCAL SESSION</span>
      </footer>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <div className="workflow-visual" aria-hidden="true">
        <div className="workflow-glow" />

        <div className="workflow-node node-one">
          <span>01</span>
        </div>

        <div className="workflow-line line-one" />

        <div className="workflow-node node-two">
          <span>02</span>
        </div>

        <div className="workflow-line line-two" />

        <div className="workflow-node node-three">
          <span>03</span>
        </div>

        <div className="workflow-core">✦</div>
      </div>

      <div className="empty-kicker">AI RESPONSE CENTER</div>

      <h2>Your AI response will appear here</h2>

      <p>
        Submit an inquiry and ReplyFlow will understand the intent,
        classify it, and draft a response.
      </p>

      <div className="workflow-labels">
        <span>Understand</span>
        <i>→</i>
        <span>Classify</span>
        <i>→</i>
        <span>Respond</span>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="loading-state">
      <div className="processing-orb">
        <div className="orb-orbit orbit-a" />
        <div className="orb-orbit orbit-b" />
        <div className="orb-orbit orbit-c" />
        <div className="orb-center">✦</div>
      </div>

      <div className="processing-kicker">AI RESPONSE CENTER</div>

      <h2>Analyzing inquiry</h2>

      <p>
        Understanding intent and crafting the response...
      </p>

      <div className="processing-steps">
        <div className="processing-step">
          <span className="processing-dot active" />
          <span>Understanding intent</span>
        </div>

        <div className="processing-step">
          <span className="processing-dot delay-one" />
          <span>Classifying inquiry</span>
        </div>

        <div className="processing-step">
          <span className="processing-dot delay-two" />
          <span>Crafting response</span>
        </div>
      </div>
    </div>
  );
}

function ResultState({
  category,
  categoryInfo,
  reply,
  setReply,
  copied,
  copyReply,
  onClear,
  onRegenerate,
}) {
  return (
    <div className="result-state">
      <div className="result-top">
        <div>
          <div className="section-kicker">
            <span className="step-number">02</span>
            AI RESPONSE CENTER
          </div>

          <h2>Analysis complete</h2>
        </div>

        <div className={`category-badge ${category}`}>
          <span>{categoryInfo?.icon || "✦"}</span>
          {categoryInfo?.label || category}
        </div>
      </div>

      <div className={`insight-card ${category}`}>
        <div className={`insight-icon ${category}`}>
          {categoryInfo?.icon || "✦"}
        </div>

        <div className="insight-copy">
          <span>Detected intent</span>
          <strong>
            {categoryInfo?.description || "Inquiry detected"}
          </strong>
        </div>

        <div className="classification-status">
          <span>AI CLASSIFICATION</span>
          <strong>
            <i />
            Ready
          </strong>
        </div>
      </div>

      <div className="reply-editor">
        <div className="editor-header">
          <div className="editor-title">
            <span>Draft response</span>
            <small>Editable</small>
          </div>

          <button
            className={`copy-button ${copied ? "copied" : ""}`}
            onClick={copyReply}
          >
            <span>{copied ? "✓" : "▣"}</span>
            {copied ? "Copied" : "Copy reply"}
          </button>
        </div>

        <textarea
          value={reply}
          onChange={(event) => setReply(event.target.value)}
          aria-label="AI generated reply"
        />

        <div className="editor-footer">
          <span>{reply.length.toLocaleString()} characters</span>

          <span>
            AI-generated · Review before sending
          </span>
        </div>
      </div>

      <div className="result-actions">
        <button
          className="secondary-action"
          onClick={onRegenerate}
        >
          <span>↻</span>
          Regenerate
        </button>

        <button
          className="secondary-action"
          onClick={onClear}
        >
          <span>＋</span>
          New inquiry
        </button>
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry, onClear }) {
  const isUnavailable =
    error.toLowerCase().includes("temporarily") ||
    error.toLowerCase().includes("overloaded") ||
    error.toLowerCase().includes("503");

  return (
    <div className="error-state">
      <div className="error-symbol">
        <span>!</span>
      </div>

      <div className="error-kicker">
        {isUnavailable ? "AI SERVICE" : "REQUEST ERROR"}
      </div>

      <h2>Unable to generate reply</h2>

      <p>{error}</p>

      <div className="error-actions">
        <button className="retry-button" onClick={onRetry}>
          <span>↻</span>
          Try again
        </button>

        <button className="secondary-action" onClick={onClear}>
          New inquiry
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, description, icon, tone = "" }) {
  return (
    <div className={`stat-card ${tone}`}>
      <div className="stat-card-top">
        <span>{label}</span>
        <i>{icon}</i>
      </div>

      <strong>{value.toLocaleString()}</strong>

      <small>{description}</small>
    </div>
  );
}

export default App;
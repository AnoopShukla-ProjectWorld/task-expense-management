import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaTimes, 
  FaPaperPlane, 
  FaSpinner, 
  FaCoins, 
  FaChartLine, 
  FaTasks, 
  FaBrain
} from "react-icons/fa";
import { askAICopilot } from "../../services/aiService";
import toast from "react-hot-toast";

function AICopilotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "init",
      sender: "ai",
      text: "Welcome, Administrator! I am **Synapse AI**, your operations intelligence engine. I have established active connections to our live database pools.\n\nAsk me anything about **overdue tasks, workforce allocations, category expense outflows, or project budget burndowns**!",
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  // Scroll to bottom whenever messages list grows
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend) => {
    const queryText = textToSend || input;
    if (!queryText.trim()) return;

    // Clear local input if sending from textbox
    if (!textToSend) setInput("");

    // Add user message
    const userMsgId = Date.now().toString();
    setMessages((prev) => [...prev, { id: userMsgId, sender: "user", text: queryText }]);
    setIsTyping(true);

    try {
      const data = await askAICopilot(queryText);
      
      setMessages((prev) => [
        ...prev, 
        { 
          id: Date.now().toString(), 
          sender: "ai", 
          text: data.response
        }
      ]);
    } catch (err) {
      toast.error("Failed to fetch response from Synapse AI.");
      setMessages((prev) => [
        ...prev, 
        { 
          id: Date.now().toString(), 
          sender: "ai", 
          text: "⚠️ **Transaction Error**: Failed to reach Synapse AI engine. Please verify that the backend server is running and check console logs." 
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const suggestionChips = [
    { label: "Overdue Tasks Audit", prompt: "Identify all active overdue tasks and tell me who is allocated to them.", icon: <FaTasks className="text-rose-500 text-[10px]" /> },
    { label: "Budget Utilization", prompt: "Summarize budget limits versus approved spending for all projects.", icon: <FaCoins className="text-amber-500 text-[10px]" /> },
    { label: "Expense Burn Stats", prompt: "Show approved outflows by category and pinpoint top anomalous spenders.", icon: <FaChartLine className="text-emerald-500 text-[10px]" /> },
  ];

  // Helper to format Inline Code blocks (`code`)
  const parseInlineCode = (text, isUser) => {
    const inlineCodeRegex = /`(.*?)`/g;
    const parts = [];
    let lastIdx = 0;
    let match;
    
    while ((match = inlineCodeRegex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        parts.push(text.substring(lastIdx, match.index));
      }
      parts.push(
        <code 
          key={`code-${match.index}`} 
          className={`px-1.5 py-0.5 rounded-md font-mono text-[10px] font-bold ${
            isUser 
              ? "bg-white/20 text-white border border-white/10" 
              : "bg-[var(--bg-tertiary)] text-rose-600 border border-[var(--border-color)]"
          }`}
        >
          {match[1]}
        </code>
      );
      lastIdx = inlineCodeRegex.lastIndex;
    }
    
    if (lastIdx < text.length) {
      parts.push(text.substring(lastIdx));
    }
    
    return parts.length > 0 ? parts : [text];
  };

  // Helper to parse bolding and inline code formatting inside text blocks (usable for paragraphs and table cells)
  const parseTextFormatting = (text, isUser) => {
    let content = text;
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parsedParagraphs = [];
    let lastIdx = 0;
    let match;
    
    while ((match = boldRegex.exec(content)) !== null) {
      if (match.index > lastIdx) {
        parsedParagraphs.push(...parseInlineCode(content.substring(lastIdx, match.index), isUser));
      }
      parsedParagraphs.push(
        <strong 
          key={`bold-${match.index}`} 
          className={`font-black tracking-tight ${isUser ? "text-white text-glow" : "text-[var(--text-primary)]"}`}
        >
          {match[1]}
        </strong>
      );
      lastIdx = boldRegex.lastIndex;
    }
    
    if (lastIdx < content.length) {
      parsedParagraphs.push(...parseInlineCode(content.substring(lastIdx), isUser));
    }
    
    return parsedParagraphs.length > 0 ? parsedParagraphs : content;
  };

  // Helper to render parsed Markdown tables as premium corporate HTML grids
  const renderParsedTable = (tableData, keyIdx) => {
    return (
      <div key={`table-${keyIdx}`} className="my-3.5 overflow-x-auto rounded-2xl border border-[var(--border-color)]/60 bg-white/60 shadow-sm max-w-full">
        <table className="min-w-full divide-y divide-[var(--border-color)]/40 text-[10px] sm:text-xs">
          <thead className="bg-[var(--bg-tertiary)]/80">
            <tr>
              {tableData.headers.map((h, i) => (
                <th 
                  key={i} 
                  className="px-3.5 py-2.5 text-left font-black text-[var(--text-primary)]/90 uppercase tracking-wider border-r border-[var(--border-color)]/20 last:border-r-0 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]/30 bg-transparent">
            {tableData.rows.map((row, rowIdx) => (
              <tr 
                key={rowIdx} 
                className={`transition-colors hover:bg-blue-500/5 ${rowIdx % 2 === 0 ? "bg-white/40" : "bg-transparent"}`}
              >
                {row.map((cell, cellIdx) => (
                  <td 
                    key={cellIdx} 
                    className="px-3.5 py-2 font-semibold text-[var(--text-secondary)] border-r border-[var(--border-color)]/20 last:border-r-0"
                  >
                    {parseTextFormatting(cell, false)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Helper to format Markdown-like texts and tables inside chat bubbles
  const renderMessageText = (text, sender) => {
    const isUser = sender === "user";
    const lines = text.split("\n");
    const elements = [];
    let currentTable = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check if this line is part of a Markdown table
      if (line.startsWith("|") && line.endsWith("|")) {
        if (!currentTable) {
          currentTable = { headers: [], rows: [] };
        }

        // Check if it is a separator line (like |---|---| or | :--- |)
        const isSeparator = line.replace(/[\s|:-]/g, "") === "";

        if (isSeparator) {
          continue; // Skip the separator line
        }

        // Parse cells (filtering out empty first and last split elements)
        const cells = line.split("|").map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

        if (currentTable.headers.length === 0 && currentTable.rows.length === 0) {
          currentTable.headers = cells;
        } else {
          currentTable.rows.push(cells);
        }
      } else {
        // Not a table line. If we were parsing a table, flush it!
        if (currentTable) {
          elements.push(renderParsedTable(currentTable, elements.length));
          currentTable = null;
        }

        if (line !== "") {
          elements.push(
            <p 
              key={`p-${i}`} 
              className={`text-xs leading-relaxed mb-2 last:mb-0 font-sans break-words ${
                isUser ? "text-white/95" : "text-[var(--text-primary)]"
              }`}
            >
              {parseTextFormatting(line, isUser)}
            </p>
          );
        }
      }
    }

    // Flush any remaining table at the end of the message
    if (currentTable) {
      elements.push(renderParsedTable(currentTable, elements.length));
    }

    return elements;
  };

  return (
    <>
      {/* Floating Toggle Bubble with dynamic glows */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className={`relative p-4.5 rounded-full text-white cursor-pointer shadow-lg active:scale-95 transition-all duration-300 flex items-center justify-center focus:outline-none border border-white/10 ${
            isOpen 
              ? "bg-rose-500 shadow-rose-500/30" 
              : "bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 shadow-indigo-500/30 hover:shadow-indigo-500/50"
          }`}
          title="Ask Synapse AI"
        >
          {isOpen ? (
            <FaTimes className="text-base" />
          ) : (
            <>
              <FaBrain className="text-base animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </>
          )}
        </motion.button>
      </div>

      {/* Sliding Glassmorphic Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 420, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 420, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="fixed top-16 bottom-24 left-4 right-4 sm:left-auto sm:right-6 sm:w-[420px] sm:max-w-md bg-[var(--bg-secondary)]/90 backdrop-blur-xl border border-[var(--border-color)]/80 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] z-40 overflow-hidden flex flex-col justify-between"
          >
            {/* Header ambient glow background */}
            <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />

            {/* Panel Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-color)]/60 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-2xl text-blue-500 border border-blue-500/10 shadow-inner">
                  <FaBrain className="text-sm" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[var(--text-primary)] tracking-tight">Synapse AI</h3>
                  <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Database Link
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <FaTimes className="text-xs" />
              </button>
            </div>

            {/* Chat Body & History */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4.5 scrollbar-thin">
              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 border text-xs relative ${
                    msg.sender === "user"
                      ? "bg-gradient-to-tr from-blue-600 to-indigo-600 border-none text-white rounded-tr-none shadow-md shadow-blue-500/15"
                      : "bg-[var(--bg-tertiary)] border-[var(--border-color)]/60 rounded-tl-none shadow-sm text-[var(--text-primary)]"
                  }`}>
                    {renderMessageText(msg.text, msg.sender)}
                  </div>
                </div>
              ))}

              {/* Loader pulsing animation */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)]/50 rounded-2xl rounded-tl-none px-4.5 py-3 flex flex-col gap-1.5 shadow-sm">
                    <span className="text-[10px] font-bold text-blue-500/85 uppercase tracking-wider flex items-center gap-1 select-none">
                      <FaSpinner className="animate-spin text-[8px]" />
                      Analyzing database pools...
                    </span>
                    <div className="flex items-center gap-1 pl-1">
                      <span className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={scrollRef} />
            </div>

            {/* Suggestions Chips drawer & Form Input Panel */}
            <div className="p-4 border-t border-[var(--border-color)]/60 space-y-3.5 bg-[var(--bg-primary)]/45">
              
              {/* Suggestion Quick Chips */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none whitespace-nowrap mask-grad select-none">
                {suggestionChips.map((chip, i) => (
                  <motion.button
                    key={i}
                    disabled={isTyping}
                    onClick={() => handleSendMessage(chip.prompt)}
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-blue-500/30 text-[10px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {chip.icon}
                    <span>{chip.label}</span>
                  </motion.button>
                ))}
              </div>

              {/* Main Submit input frame */}
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  disabled={isTyping}
                  placeholder="Ask about deliverables, overdue tasks, etc..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isTyping || !input.trim()}
                  className="p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-md shadow-blue-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isTyping ? (
                    <FaSpinner className="animate-spin text-xs" />
                  ) : (
                    <FaPaperPlane className="text-xs" />
                  )}
                </button>
              </form>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default AICopilotWidget;

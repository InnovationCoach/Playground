import React, { useState } from 'react';
import { 
  X, 
  Bot, 
  Send, 
  Sparkles, 
  BookmarkPlus, 
  Code2, 
  HelpCircle, 
  CheckCircle2,
  Copy,
  Terminal
} from 'lucide-react';
import { generateMockCopilotReply } from '../pbl';

interface AiCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPhase: string;
  codeLanguage: string;
  onSaveAsEvidence: (title: string, body: string, asked: string, kept: string) => void;
}

export const AiCopilotModal: React.FC<AiCopilotModalProps> = ({
  isOpen,
  onClose,
  currentPhase,
  codeLanguage,
  onSaveAsEvidence
}) => {
  const [inputPrompt, setInputPrompt] = useState('');
  const [messages, setMessages] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
    sampleCode?: string;
  }>>([
    {
      role: 'assistant',
      content: `Hello! I am your **PBL Studio Project Co-Pilot**. I help you design, wire, and write code for your BBC micro:bit V2, sensors, and actuators to solve problems for people and the environment.\n\nAsk me for code, hardware circuit advice, or test steps. Remember our classroom rule: **You are the designer, AI is your co-pilot. You must understand and be ready to explain every line!**`
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [keptNotes, setKeptNotes] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSend = (textToSend?: string) => {
    const query = textToSend || inputPrompt;
    if (!query.trim()) return;

    const userMessage = { role: 'user' as const, content: query };
    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt('');
    setIsTyping(true);
    setSavedSuccess(false);

    // Simulate co-pilot response generation complying with backend prompt spec
    setTimeout(() => {
      const { reply, sampleCode } = generateMockCopilotReply(query, currentPhase, codeLanguage);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: reply, sampleCode }
      ]);
      setIsTyping(false);
    }, 600);
  };

  const handleSaveEvidence = (lastAssistantMsg: { content: string; sampleCode?: string }) => {
    // Find the matching user prompt
    const userPrompts = messages.filter((m) => m.role === 'user');
    const lastPrompt = userPrompts.length > 0 ? userPrompts[userPrompts.length - 1].content : 'AI Co-pilot Consultation';
    const title = `AI Co-Pilot: ${lastPrompt.slice(0, 50)}...`;
    const kept = keptNotes.trim() || 'Reviewed code logic and verified pin connections on real micro:bit board.';

    onSaveAsEvidence(
      title,
      lastAssistantMsg.sampleCode || lastAssistantMsg.content,
      lastPrompt,
      kept
    );
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const promptStarters = [
    'Write a MicroPython loop to read capacitive moisture on Pin0 and pulse pump relay on Pin2 for 2.5s.',
    'How do I stop my SG90 servo motor from buzzing when holding the shade canopy open?',
    'Explain how to calculate percentage water saved between my control bed and the EcoCool bed.'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 text-white rounded-lg">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <span>Phase: <strong className="text-emerald-800 uppercase font-mono">{currentPhase}</strong></span>
                <span aria-hidden="true">·</span>
                <span>Language: <strong className="text-stone-800 font-mono">{codeLanguage}</strong></span>
                <span aria-hidden="true">·</span>
                <span className="text-amber-700">Client-Side Mock Simulator</span>
              </div>
              <h2 className="text-base font-bold text-stone-900">
                PBL Studio AI Co-Pilot
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conversation Message List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-4 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-stone-50 text-stone-800 border border-stone-200 shadow-2xs'
                }`}
              >
                {/* Parse markdown-like content simply */}
                <div className="space-y-2 whitespace-pre-wrap">
                  {msg.content}
                </div>

                {/* If code block was returned, offer easy save to portfolio */}
                {msg.sampleCode && (
                  <div className="mt-3 pt-3 border-t border-stone-200 bg-stone-100 p-2.5 rounded font-mono text-[11px] text-stone-900">
                    <div className="flex items-center justify-between mb-1.5 text-stone-600 font-sans text-xs">
                      <span className="flex items-center gap-1 font-semibold text-stone-800">
                        <Terminal className="w-3.5 h-3.5" />
                        Classroom micro:bit V2 Code
                      </span>
                    </div>
                    <pre className="overflow-x-auto p-2 bg-stone-950 text-emerald-400 rounded">
                      {msg.sampleCode}
                    </pre>

                    {/* AI Log Provenance Helper */}
                    <div className="mt-2.5 pt-2 border-t border-stone-200 font-sans">
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Mandatory AI Log: What will your team keep, alter, or reject?
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Kept the hysteresis logic; adjusted Pin0 threshold from 650 to 580..."
                        value={keptNotes}
                        onChange={(e) => setKeptNotes(e.target.value)}
                        className="w-full text-xs p-1.5 bg-white border border-stone-300 rounded focus:ring-1 focus:ring-emerald-500 mb-2"
                      />
                      <button
                        onClick={() => handleSaveEvidence(msg)}
                        disabled={savedSuccess}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 text-white rounded text-xs font-medium hover:bg-emerald-800 transition-colors"
                      >
                        {savedSuccess ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                            Logged to Evidence Portfolio!
                          </>
                        ) : (
                          <>
                            <BookmarkPlus className="w-3.5 h-3.5" />
                            Log as Code & AI Evidence
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-stone-500 text-xs italic">
              <Bot className="w-4 h-4 animate-spin text-emerald-600" />
              Co-Pilot is structuring code and hardware test steps...
            </div>
          )}
        </div>

        {/* Prompt Starters */}
        <div className="px-6 py-2 bg-stone-50/80 border-t border-stone-200">
          <div className="text-[11px] text-stone-500 font-medium mb-1.5">Try prompt starter:</div>
          <div className="flex flex-wrap gap-1.5">
            {promptStarters.map((starter, i) => (
              <button
                key={i}
                onClick={() => handleSend(starter)}
                className="text-[11px] text-stone-700 bg-white border border-stone-300 hover:border-emerald-600 px-2 py-1 rounded transition-colors text-left truncate max-w-xs"
              >
                {starter}
              </button>
            ))}
          </div>
        </div>

        {/* Input box */}
        <div className="p-4 border-t border-stone-200 bg-white flex items-center gap-2">
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask AI Co-Pilot to write code, plan your circuit, or debug sensor loops..."
            className="flex-1 text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
          <button
            onClick={() => handleSend()}
            className="px-4 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-lg hover:bg-emerald-800 flex items-center gap-1.5 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

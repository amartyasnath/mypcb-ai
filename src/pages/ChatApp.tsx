/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { Cpu, Shield, Search, Zap, Info, RotateCcw, Download, Megaphone, X, Trash2, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage as ChatMessageType, chatWithMyPCB, ComponentRecommendation, parseModelReply } from '../services/chat';
import { ChatMessage } from '../components/ChatMessage';
import { UserProfile } from '../components/UserProfile';
import { exportBOM } from '../utils/exportBOM';
import { trackEvent } from '../utils/analytics';
import { Link } from 'react-router-dom';
import { FeedbackModal } from '../components/FeedbackModal';
import { auth } from '../lib/firebase';
import { subscribeToChats, createChat, updateChat, deleteChat, ChatSession } from '../services/chatStore';

export default function ChatApp() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [showManufacturerAd, setShowManufacturerAd] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState<false | 'support' | 'bug' | 'manufacturer'>(false);
  
  const [user, setUser] = useState(auth.currentUser);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    fetch('/api/health').then(r => r.json()).then(data => setDemoMode(data.demoMode === true)).catch(() => {});
  }, []);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((u) => {
      setUser(u);
      if (!u) {
        setChats([]);
        setCurrentChatId(null);
        setMessages([]);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (user) {
      const unsubscribeChats = subscribeToChats(user.uid, (fetchedChats) => {
        setChats(fetchedChats);
      });
      return () => unsubscribeChats();
    }
  }, [user]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const loadChat = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setCurrentChatId(chat.id);
      setMessages(Array.isArray(chat.messages) ? chat.messages : []);
      setIsSidebarOpen(false);
    }
  };

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await deleteChat(user.uid, chatId);
      if (currentChatId === chatId) {
        resetChat();
      }
    } catch (err) {
      console.error("Failed to delete chat", err);
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const now = Date.now();
    if (now - lastRequestTime < 3000) {
      alert("Please wait a few seconds before your next scour to prevent systems overload.");
      return;
    }
    setLastRequestTime(now);

    trackEvent('scour_initiated', { prompt_length: input.length });

    const userMessage: ChatMessageType = { role: 'user', text: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    
    let activeChatId = currentChatId;
    let chatTitle = currentChatId ? "" : input.slice(0, 30) + (input.length > 30 ? '...' : '');

    if (user && !activeChatId) {
      try {
        activeChatId = await createChat(user.uid, chatTitle || "New Scour", newMessages);
        setCurrentChatId(activeChatId);
      } catch (err) {
         console.error("Failed to create chat in DB", err);
      }
    } else if (user && activeChatId) {
       chatTitle = chats.find(c => c.id === activeChatId)?.title || "Scour";
       updateChat(user.uid, activeChatId, chatTitle, newMessages).catch(console.error);
    }

    try {
      const response = await chatWithMyPCB(newMessages);
      const modelText = response.text || "I'm sorry, I couldn't generate a response.";

      const { text: sanitizedText, recommendations } = parseModelReply(modelText);

      const modelMessage: ChatMessageType = {
        role: 'model',
        text: sanitizedText,
        recommendations
      };

      const completeMessages = [...newMessages, modelMessage];
      setMessages(completeMessages);
      
      if (user && activeChatId) {
        updateChat(user.uid, activeChatId, chatTitle, completeMessages).catch(console.error);
      }

    } catch (error: any) {
      console.error(error);
      const errorMessage: ChatMessageType = { 
        role: 'model', 
        text: `Error: ${error.message || "I'm having trouble connecting to my brain. Please check your connection or API key."}`
      };
      const errorMessages = [...newMessages, errorMessage];
      setMessages(errorMessages);
      
      if (user && activeChatId) {
         updateChat(user.uid, activeChatId, chatTitle, errorMessages).catch(console.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([]);
    setInput('');
    setCurrentChatId(null);
    setIsSidebarOpen(false);
  };


  const handleExport = () => {
    // Collect all recommendations from all messages
    const allRecommendations = messages.reduce((acc, msg) => {
      if (msg.recommendations) {
        return [...acc, ...msg.recommendations];
      }
      return acc;
    }, [] as ComponentRecommendation[]);
    
    if (allRecommendations.length > 0) {
      exportBOM(allRecommendations).catch((err) => {
        console.error('BOM export failed', err);
        alert('Sorry, the BOM export failed. Please try again.');
      });
    } else {
      alert("No components to export yet. Generate some recommendations first!");
    }
  };

  return (
    <div className="flex h-dvh bg-background font-sans text-foreground overflow-hidden">
      <AnimatePresence>
        {showManufacturerAd && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-card rounded-2xl w-full max-w-lg max-h-[90dvh] overflow-y-auto border border-border shadow-2xl"
            >
              <div className="p-6 bg-primary text-primary-foreground flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2 flex items-center gap-2 font-heading"><Megaphone className="w-6 h-6" /> Reach Engineers Directly</h2>
                  <p className="text-primary-foreground/80 text-sm">Partner with myPCB AI to increase your component visibility.</p>
                </div>
                <button onClick={() => setShowManufacturerAd(false)} className="p-1 hover:bg-primary-foreground/20 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-primary-foreground/80" />
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-4 text-muted-foreground text-sm leading-relaxed mb-8">
                  <p>
                    Are you a component manufacturer? Getting your parts in front of design engineers at the exact moment they are making architectural decisions is critical.
                  </p>
                  <p>
                    Share your datasheets, lifecycle information and inventory feeds with myPCB AI. Sponsored placements will be clearly labeled; engineering recommendations should be based on technical fit.
                  </p>
                  <p>
                    Get in touch today to optimize your datasheet parsing and feature your specialized components in our recommendation engine!
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setShowManufacturerAd(false);
                    setShowFeedbackModal('manufacturer');
                  }}
                  className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  Contact Author / Partner
                </button>
                <a href="/manufacturer-partnership.txt" download className="block text-center border border-primary text-primary rounded-xl py-3 mt-3 font-semibold">Download partnership brief</a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop for the mobile sidebar drawer */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-foreground/40 z-30 lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar: static on desktop, off-canvas drawer on mobile */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-secondary flex flex-col h-full shrink-0 border-r border-border transition-transform duration-200 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-primary-foreground">&#956;</div>
              <h1 className="text-xl font-bold text-foreground font-heading tracking-tight">myPCB<span className="text-primary">.ai</span></h1>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1 text-muted-foreground hover:text-foreground"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-2">Recent Scours</div>
          <button 
            onClick={resetChat}
            className="flex items-center gap-3 w-full p-2 bg-primary rounded text-sm text-primary-foreground text-left hover:bg-primary/90 transition-colors mb-4 cursor-pointer"
          >
             <RotateCcw className="w-4 h-4" />
             New Sourcing Log
          </button>
          
          <div className="space-y-1">
            {chats.map(chat => (
              <div 
                key={chat.id} 
                onClick={() => loadChat(chat.id)}
                className={`group p-2 flex items-center justify-between rounded text-sm cursor-pointer border-l-2 transition-colors ${
                  currentChatId === chat.id 
                    ? 'bg-background/50 text-foreground border-primary' 
                    : 'text-muted-foreground border-transparent hover:bg-background/50 hover:text-foreground'
                }`}
              >
                <span className="truncate flex-1">{chat.title}</span>
                <button 
                  onClick={(e) => handleDeleteChat(e, chat.id)}
                  className="p-1 opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                  title="Delete Log"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            {chats.length === 0 && (
              <div className="text-xs text-muted-foreground italic px-2">No recent scours</div>
            )}
          </div>
          
          <div className="pt-8 space-y-1">
            <Link to="/privacy" className="block p-2 hover:bg-background/50 rounded text-xs text-muted-foreground hover:text-foreground">Privacy Policy</Link>
            <Link to="/terms" className="block p-2 hover:bg-background/50 rounded text-xs text-muted-foreground hover:text-foreground">Terms & Conditions</Link>
            <button onClick={() => setShowFeedbackModal('support')} className="w-full text-left p-2 hover:bg-background/50 rounded text-xs text-muted-foreground hover:text-foreground cursor-pointer">Support / Feedback</button>
          </div>
        </nav>

        <UserProfile />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {showFeedbackModal && <FeedbackModal onClose={() => setShowFeedbackModal(false)} initialType={showFeedbackModal} />}
        <header className="h-14 bg-card border-b border-border hidden lg:flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              Project: {currentChatId ? (
                <span className="text-foreground font-medium font-mono bg-secondary px-2 py-1 rounded truncate max-w-[200px]">
                  {chats.find(c => c.id === currentChatId)?.title || 'Unnamed Project'}
                </span>
              ) : (
                <span className="text-muted-foreground italic">New Scour...</span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={handleExport} className="px-3 py-1.5 text-xs font-semibold bg-card border border-border text-foreground rounded-md hover:bg-secondary shadow-sm transition-colors cursor-pointer flex items-center gap-1.5">
              <Download className="w-3 h-3" />
              Export BOM
            </button>
            <button onClick={() => setShowManufacturerAd(true)} className="px-3 py-1.5 text-xs font-bold bg-primary/10 text-primary border border-primary/20 rounded-md hover:bg-primary/20 shadow-sm transition-colors cursor-pointer">
              Manufacturer?
            </button>
          </div>
        </header>

        <header className="lg:hidden p-4 border-b border-border flex flex-wrap gap-y-2 items-center justify-between bg-card z-10 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-muted-foreground hover:text-foreground"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center font-bold text-primary-foreground text-xs">&#956;</div>
            <span className="font-bold text-foreground font-heading">myPCB.ai</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handleExport} className="p-2 text-muted-foreground hover:text-foreground" aria-label="Export BOM">
              <Download className="w-4 h-4" />
            </button>
            <button onClick={resetChat} className="p-2 text-muted-foreground hover:text-foreground" aria-label="New scour">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => setShowManufacturerAd(true)}
            className="w-full min-h-11 px-3 py-2 text-xs font-bold bg-primary/10 text-primary border border-primary/20 rounded-md hover:bg-primary/20 flex items-center justify-center gap-2"
          >
            <Megaphone className="w-4 h-4" aria-hidden="true" />
            Manufacturer?
          </button>
        </header>

        {/* Chat Scrolling Area */}
        {demoMode && <div role="status" className="px-6 py-2 text-sm bg-muted">Sample demo: fixed examples, no AI calls or live prices. No sign-in required.</div>}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto scroll-smooth p-6 pb-0"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto pb-10">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="mb-8"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Search className="text-primary w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold font-heading tracking-tight mb-3 text-foreground">Ready to scour the network?</h2>
                <p className="text-muted-foreground text-sm leading-relaxed font-normal">
                  Input your exact project specs (Voltage, Temp, Frequency, Interfaces) and I'll find the optimal components from 1,400+ suppliers.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {[
                  { icon: <Search className="w-4 h-4 text-primary" />, label: "Low-power LDO for 5V to 3.3V conversion" },
                  { icon: <Zap className="w-4 h-4 text-primary" />, label: "High-frequency switching MOSFET for 24V supply" },
                  { icon: <Cpu className="w-4 h-4 text-primary" />, label: "ARM Cortex-M4 with at least 512KB Flash" },
                  { icon: <Info className="w-4 h-4 text-primary" />, label: "Precision op-amp for sensor conditioning" },
                ].map((suggest, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(suggest.label)}
                    className="p-4 bg-card border border-border hover:border-primary hover:shadow-md rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground transition-all text-left flex items-center gap-3 group"
                  >
                    <div className="p-2 bg-secondary rounded-lg group-hover:bg-primary/10 transition-colors">
                      {suggest.icon}
                    </div>
                    {suggest.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              {messages.map((m, i) => (
                <ChatMessage key={i} message={m} />
              ))}
              {isLoading && (
                <div className="flex items-center space-x-2 mb-6">
                  <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-primary-foreground text-[10px]">AI</div>
                  <h2 className="text-sm font-semibold text-foreground animate-pulse">Scouring network for components...</h2>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-card border-t border-border p-3 sm:p-4 shrink-0 flex flex-col justify-center">
          <form 
            onSubmit={handleSubmit}
            className="max-w-4xl mx-auto w-full flex items-center space-x-2 bg-background rounded-lg border border-border p-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Refine search, e.g. 'Must have I2C interface' or 'Find AEC-Q100 qualified'"
              className="flex-1 min-w-0 bg-transparent border-none focus:ring-0 text-base sm:text-sm px-2 text-foreground outline-none"
              disabled={isLoading}
            />
            {isLoading ? (
              <div className="bg-primary/50 text-primary-foreground px-4 py-1.5 rounded-md text-sm font-semibold shadow-sm flex items-center gap-2 opacity-80 cursor-not-allowed">
                 <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                 Scouring...
              </div>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="bg-primary text-primary-foreground px-4 py-1.5 rounded-md text-sm font-semibold shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Scour Network
              </button>
            )}
          </form>
          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            myPCB AI can make mistakes. Always verify datasheets before committing to production.<br/>
            <span className="flex items-center justify-center gap-1 mt-1 font-medium"><Shield className="w-3 h-3" /> Encrypted in transit (TLS). Conversations are stored to your account so you can revisit them.</span>
          </p>
        </div>
      </div>
    </div>
  );
}

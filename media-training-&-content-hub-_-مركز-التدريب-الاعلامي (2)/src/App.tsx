import React, { useState, useEffect, useRef } from 'react';
import { 
  motion, 
  AnimatePresence 
} from 'motion/react';
import { 
  Send, 
  RotateCcw, 
  Copy, 
  Check, 
  Layout, 
  Cpu, 
  Globe, 
  Shield, 
  Zap,
  Linkedin,
  Instagram,
  Twitter,
  Video,
  Type as FontIcon,
  AlertCircle,
  Sun,
  Moon,
  Languages,
  BookOpen,
  Briefcase,
  FlaskConical,
  Palette,
  Binary,
  ShieldCheck,
  Music2,
  AtSign,
  Facebook,
  Sparkles,
  BarChart3,
  ChevronDown
} from 'lucide-react';
import { generateContent, generateImage, ContentArchitectOutput, auditContent, AuditOutput } from './services/geminiService';

interface GenerationParams {
  topic: string;
  trainerName: string;
  field: string;
  platform: 'Instagram' | 'X' | 'LinkedIn' | 'TikTok' | 'Threads' | 'Facebook';
  style: 'Professional' | 'Viral' | 'Creative' | 'Academic' | 'Minimalist';
  language: 'Arabic' | 'English';
  eventPhase: 'START' | 'MID' | 'END';
  duration: number;
  startDate: string;
}

const CopyIconBtn = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button 
       type="button"
       onClick={(e) => {
         e.preventDefault();
         navigator.clipboard.writeText(text);
         setCopied(true);
         setTimeout(() => setCopied(false), 2000);
       }}
       className="p-1.5 rounded-md hover:bg-white/10 text-zinc-500 hover:text-white transition-all focus:outline-none"
       title="Copy"
    >
       {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
    </button>
  );
};

export default function App() {
  const [params, setParams] = useState<GenerationParams>(() => {
    const saved = localStorage.getItem('hub_params');
    return saved ? JSON.parse(saved) : {
      topic: '',
      trainerName: '',
      field: 'General',
      platform: 'LinkedIn',
      style: 'Professional',
      language: 'Arabic',
      eventPhase: 'START',
      duration: 1,
      startDate: new Date().toISOString().split('T')[0]
    };
  });

  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [result, setResult] = useState<ContentArchitectOutput | null>(() => {
    const saved = localStorage.getItem('hub_result');
    return saved ? JSON.parse(saved) : null;
  });
  const [editableBodyOptions, setEditableBodyOptions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('hub_body_options');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [editablePrompt, setEditablePrompt] = useState(() => localStorage.getItem('hub_prompt') || '');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(() => localStorage.getItem('hub_image'));
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [useCustomImage, setUseCustomImage] = useState(false);
  
  const [auditInput, setAuditInput] = useState(() => localStorage.getItem('hub_audit_input') || '');
  const [auditResult, setAuditResult] = useState<AuditOutput | null>(() => {
    const saved = localStorage.getItem('hub_audit_result');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuditing, setIsAuditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'generate' | 'audit'>('generate');
  const [zoom, setZoom] = useState(0.85);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regenCounter, setRegenCounter] = useState(0);
  const [mainImgLoading, setMainImgLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('hub_params', JSON.stringify(params));
  }, [params]);

  useEffect(() => {
    if (result) localStorage.setItem('hub_result', JSON.stringify(result));
    else localStorage.removeItem('hub_result');
  }, [result]);

  useEffect(() => {
    localStorage.setItem('hub_body_options', JSON.stringify(editableBodyOptions));
  }, [editableBodyOptions]);

  useEffect(() => {
    localStorage.setItem('hub_prompt', editablePrompt);
  }, [editablePrompt]);

  useEffect(() => {
    if (generatedImageUrl) localStorage.setItem('hub_image', generatedImageUrl);
    else localStorage.removeItem('hub_image');
  }, [generatedImageUrl]);

  useEffect(() => {
    localStorage.setItem('hub_audit_input', auditInput);
  }, [auditInput]);

  useEffect(() => {
    if (auditResult) localStorage.setItem('hub_audit_result', JSON.stringify(auditResult));
    else localStorage.removeItem('hub_audit_result');
  }, [auditResult]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const [isSystemInitialized, setIsSystemInitialized] = useState(false);

  const initializeSystem = () => {
    setIsSystemInitialized(true);
  };

  const handleGenerate = async () => {
    if (!params.topic.trim()) return;
    
    setIsLoading(true);
    setError(null);
    try {
      // Phase 1: AI Content Generation (Fastest via Flash model)
      const data = await generateContent(params);
      
      // Update result immediately - this unlocks the UI
      setResult(data);
      setEditableBodyOptions(data.content_output.body || []);
      setEditablePrompt(data.visual_engine.image_prompt);
      setIsLoading(false); // End main loading early

      // Phase 2: Start background image loading without blocking UI
      setMainImgLoading(true);
      
      const dimensions = {
        'Instagram': { w: 1024, h: 1024 },
        'X': { w: 1200, h: 675 },
        'LinkedIn': { w: 1200, h: 630 },
        'Facebook': { w: 1200, h: 630 },
        'Threads': { w: 1024, h: 1024 },
        'TikTok': { w: 1080, h: 1920 }
      }[params.platform] || { w: 1024, h: 1024 };

      const imageUrl = generateImage(data.visual_engine.image_prompt, dimensions.w, dimensions.h);
      const img = new Image();
      img.src = imageUrl;
      img.onload = () => {
        setGeneratedImageUrl(imageUrl);
        setMainImgLoading(false);
      };
      img.onerror = () => {
        console.error("Image loading failed");
        setMainImgLoading(false);
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsLoading(false);
    }
  };

  const handleCopy = (index: number) => {
    if (!result) return;
    const { headline, cta, hashtags } = result.content_output;
    const bodyStr = editableBodyOptions[index] || '';
    const fullText = `${headline}\n\n${bodyStr}\n\n${cta}\n\n${hashtags.join(' ')}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setParams(prev => ({ ...prev, topic: text, trainerName: '' }));
    } catch (err) {
      console.error('Failed to read clipboard', err);
    }
  };

  const isX = params.platform === 'X';

  const handleReset = () => {
    setResult(null);
    setEditableBodyOptions([]);
    setEditablePrompt('');
    setGeneratedImageUrl(null);
    setUploadedImageUrl(null);
    setUseCustomImage(false);
    setAuditInput('');
    setAuditResult(null);
    localStorage.removeItem('hub_result');
    localStorage.removeItem('hub_body');
    localStorage.removeItem('hub_prompt');
    localStorage.removeItem('hub_image');
    localStorage.removeItem('hub_audit_input');
    localStorage.removeItem('hub_audit_result');
    setParams({
      topic: '',
      trainerName: '',
      field: 'General',
      platform: 'LinkedIn',
      style: 'Professional',
      language: 'Arabic',
      eventPhase: 'START',
      duration: 1,
      startDate: new Date().toISOString().split('T')[0]
    });
  };

  const handleAudit = async () => {
    if (!auditInput.trim()) return;
    setIsAuditing(true);
    setError(null);
    try {
      const data = await auditContent(auditInput, params.language);
      setAuditResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Audit failed');
    } finally {
      setIsAuditing(false);
    }
  };

  const isArabic = params.language === 'Arabic';

  const t = {
    params: isArabic ? 'المعايير الاستراتيجية' : 'Strategic Parameters',
    topic: isArabic ? 'اسم البرنامج' : 'Program Name',
    trainerName: isArabic ? 'اسم المدرب' : 'Trainer Name',
    field: isArabic ? 'المجال المعرفي' : 'Knowledge Field',
    platform: isArabic ? 'هيكل المنصة' : 'Platform Structure',
    language: isArabic ? 'اللغة' : 'Language',
    generate: isArabic ? 'بدء التصميم' : 'INITIALIZE GENERATION',
    architecting: isArabic ? 'جاري التصميم...' : 'ARCHITECTING...',
    workspace: isArabic ? 'مساحة العمل' : 'Workspace',
    reset: isArabic ? 'تصفير المساحة' : 'RESET HUB',
    build: isArabic ? 'إصدار' : 'Build',
    core_intel: isArabic ? 'HUB OS v3.0' : 'HUB OS v3.0',
    audit: isArabic ? 'تم التدقيق لغوياً' : 'Linguistically Verified',
    insight: isArabic ? 'رؤية الخبير' : 'Expert Insight',
    visual_engine: isArabic ? 'محرك الرؤية 3D' : '3D Visual Engine',
    configure: isArabic ? 'قم بضبط المعايير في القائمة الجانبية لبدء توليد المحتوى.' : 'Configure architectural parameters in the sidebar to initialize content generation.',
    latency: isArabic ? 'الكمون' : 'Latency',
    security: isArabic ? 'الأمان' : 'Security',
    inactive: isArabic ? 'جاري الانتظار' : 'System Idle',
    attach_image: isArabic ? 'إرفاق صورة للمشروع' : 'ATTACH PROJECT IMAGE',
    use_custom: isArabic ? 'استخدام صورة مرفوعة' : 'Use Uploaded Image',
    use_ai: isArabic ? 'استخدام صورة الذكاء الاصطناعي' : 'Use AI Generated',
    style_label: isArabic ? 'نمط المحتوى' : 'CONTENT STYLE',
    audit_tab: isArabic ? 'التدقيق اللغوي' : 'Linguistic Audit',
    generate_tab: isArabic ? 'توليد المحتوى' : 'Content Engine',
    audit_placeholder: isArabic ? 'أدخل النص هنا للتدقيق الإملائي واللغوي...' : 'Enter text here for spelling and linguistic audit...',
    start_audit: isArabic ? 'بدء التدقيق اللغوي' : 'START LINGUISTIC AUDIT',
    auditing: isArabic ? 'جاري التدقيق...' : 'AUDITING...',
    correction: isArabic ? 'النص المعدل' : 'Corrected Text',
    explanation: isArabic ? 'توضيح التعديلات' : 'Audit Explanation',
    phase: isArabic ? 'مرحلة الفعالية' : 'EVENT PHASE',
    phase_start: isArabic ? 'انطلاق' : 'START',
    phase_mid: isArabic ? 'تغطية' : 'MID',
    phase_end: isArabic ? 'ختام' : 'END',
    duration: isArabic ? 'مدة الفعالية (أيام)' : 'EVENT DURATION (DAYS)',
    start_date: isArabic ? 'تاريخ البدء' : 'START DATE',
    days: isArabic ? 'أيام' : 'Days',
    day: isArabic ? 'يوم' : 'Day'
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImageUrl(reader.result as string);
        setUseCustomImage(true);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col md:flex-row bg-media-dark text-gray-200 overflow-hidden ${isArabic ? 'rtl' : 'ltr'}`}>
      <AnimatePresence>
        {!isSystemInitialized && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center space-y-8"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-media-blue/20 blur-3xl animate-pulse rounded-full" />
              <Cpu size={80} className="text-media-blue relative z-10" />
            </div>
            <div className="text-center space-y-4">
              <h2 className={`text-3xl font-black tracking-tight text-white uppercase font-display ${isArabic ? 'arabic-font leading-tight' : 'tracking-[0.2em]'}`}>
                {isArabic ? 'مركز التدريب الاعلامي للمحتوى' : 'Media Training & Content Hub'}
              </h2>
              <p className="text-zinc-500 font-mono text-xs tracking-widest uppercase">
                {isArabic ? 'تدقيق لغوي وصناعة محتوى احترافي' : 'Professional Content & Linguistic Audit'}
              </p>
            </div>
            <button 
              onClick={initializeSystem}
              className="px-10 py-5 bg-white text-black font-black uppercase tracking-[0.3em] rounded-full transition-all active:scale-95 shadow-2xl shadow-white/10 hover:bg-media-gold"
            >
              {isArabic ? 'بدء التشغيل' : 'INITIALIZE SYSTEM'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar - Control Panel */}
      <aside className="w-full md:w-[320px] border-r border-media-border bg-media-panel flex flex-col h-screen shrink-0 relative z-20">
        <div className="p-6 border-b border-media-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-media-blue rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
              <Cpu className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-media-text">
                {isArabic ? 'مركز التدريب الاعلامي' : 'MEDIA TRAINING CENTER'}
              </h1>
              <span className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-black">
                {t.core_intel}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-media-gold"
              title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)] ml-1" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          <div className="flex bg-media-bg/30 p-1 rounded-2xl border border-media-border/60 mb-6">
            <button 
              onClick={() => setActiveTab('generate')}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'generate' ? 'bg-media-blue text-white shadow-lg shadow-media-blue/20' : 'text-zinc-600 hover:text-zinc-400'}`}
            >
              <Sparkles size={14} /> {t.generate_tab}
            </button>
            <button 
              onClick={() => setActiveTab('audit')}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'audit' ? 'bg-media-gold text-black shadow-lg shadow-media-gold/20' : 'text-zinc-600 hover:text-zinc-400'}`}
            >
              <ShieldCheck size={14} /> {t.audit_tab}
            </button>
          </div>

          <button 
            onClick={() => setParams(p => ({ ...p, language: p.language === 'English' ? 'Arabic' : 'English' }))}
            className={`w-full p-3 rounded-xl transition-all flex items-center justify-between mb-4 border text-zinc-500 bg-zinc-900/50 border-media-border/60 hover:text-media-gold hover:border-media-gold/30`}
          >
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest">
                {isArabic ? 'تغيير اللغة (English)' : 'Change Language (العربية)'}
              </span>
            </div>
            <Languages size={14} className="opacity-40" />
          </button>
          {activeTab === 'generate' ? (
            <section className="space-y-6">
              <label className="text-xs uppercase tracking-[0.3em] text-media-blue font-black flex items-center gap-2 mb-6">
                <Zap size={14} fill="currentColor" /> {t.params}
              </label>

              <div className="space-y-6">
                {/* Program Name Input */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-secondary-text font-black uppercase tracking-[0.2em]">{t.topic}</span>
                    <button 
                      onClick={handlePaste}
                      className="text-[9px] text-media-blue hover:text-media-gold flex items-center gap-1 font-mono transition-colors uppercase tracking-widest"
                    >
                      <Check size={10} /> {isArabic ? 'لصق النص' : 'PASTE TEXT'}
                    </button>
                  </div>
                  <div className="relative group">
                    <textarea 
                      className="w-full bg-media-bg/30 border border-media-border/60 rounded-xl p-4 text-sm focus:ring-2 focus:ring-media-blue/20 focus:border-media-blue outline-none transition-all resize-none h-32 text-media-text placeholder:text-zinc-800 leading-relaxed font-medium"
                      placeholder={isArabic ? 'مثال: مهارات البودكاست للهواة، أخلاقيات الصحافة الرقمية...' : "e.g. Amateur Podcasting Skills, Digital Journalism Ethics..."}
                      value={params.topic}
                      onChange={(e) => setParams(prev => ({ ...prev, topic: e.target.value }))}
                    />
                    <div className="absolute bottom-3 right-3 opacity-20 pointer-events-none">
                      <FontIcon size={12} />
                    </div>
                  </div>
                </div>

                {/* Trainer Name Input */}
                <div className="space-y-3">
                  <span className="text-[10px] text-secondary-text font-black uppercase tracking-[0.2em]">{t.trainerName}</span>
                  <div className="relative group">
                    <input 
                      type="text"
                      className="w-full bg-media-bg/30 border border-media-border/60 rounded-xl p-4 text-sm focus:ring-2 focus:ring-media-blue/20 focus:border-media-blue outline-none transition-all text-media-text placeholder:text-zinc-800 leading-relaxed font-medium"
                      placeholder={isArabic ? 'اسم المدرب' : "Trainer Name"}
                      value={params.trainerName}
                      onChange={(e) => setParams(prev => ({ ...prev, trainerName: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] text-secondary-text font-black uppercase tracking-[0.2em]">{t.field}</span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'General', icon: Globe, label: isArabic ? 'عام' : 'General' },
                      { id: 'Media', icon: Video, label: isArabic ? 'إعلام' : 'Media' },
                      { id: 'Tech', icon: Binary, label: isArabic ? 'تقنية' : 'Tech' },
                      { id: 'Business', icon: Briefcase, label: isArabic ? 'أعمال' : 'Business' },
                      { id: 'Science', icon: FlaskConical, label: isArabic ? 'علوم' : 'Science' },
                      { id: 'Art', icon: Palette, label: isArabic ? 'فنون' : 'Art' }
                    ].map((field) => (
                      <button
                        key={field.id}
                        onClick={() => setParams(prev => ({ ...prev, field: field.id as any }))}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                          params.field === field.id 
                          ? 'border-media-blue bg-media-blue/10 text-media-blue' 
                          : 'border-media-border/60 text-secondary-text/60 grayscale hover:grayscale-0'
                        }`}
                      >
                        <field.icon size={16} />
                        <span className="text-[8px] mt-1 font-black uppercase text-center">{field.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <span className="text-[10px] text-secondary-text font-black uppercase tracking-[0.2em]">{t.platform}</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'LinkedIn', icon: Linkedin },
                      { id: 'Instagram', icon: Instagram },
                      { id: 'X', icon: Twitter },
                      { id: 'TikTok', icon: Music2 },
                      { id: 'Threads', icon: AtSign },
                      { id: 'Facebook', icon: Facebook }
                    ].map((plat) => (
                      <button
                        key={plat.id}
                        onClick={() => setParams(prev => ({ ...prev, platform: plat.id as any }))}
                        className={`flex items-center gap-2 p-2 px-3 rounded-xl border transition-all ${
                          params.platform === plat.id 
                          ? 'border-media-blue bg-media-blue/10 text-media-blue shadow-[0_0_10px_rgba(37,99,235,0.2)]' 
                          : 'border-media-border/60 text-secondary-text/60 grayscale hover:grayscale-0'
                        }`}
                      >
                        <plat.icon size={14} />
                        <span className="text-[9px] font-black uppercase tracking-tight">{plat.id}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] text-secondary-text font-black uppercase tracking-[0.2em]">{t.style_label}</span>
                  <select 
                    value={params.style}
                    onChange={(e) => setParams(p => ({ ...p, style: e.target.value as any }))}
                    className="w-full bg-media-bg/30 border border-media-border/60 p-3 rounded-xl text-[11px] font-black text-media-text outline-none focus:border-media-blue transition-all"
                  >
                    <option value="Professional" className="bg-zinc-900">Professional</option>
                    <option value="Viral" className="bg-zinc-900">Viral / Hype</option>
                    <option value="Creative" className="bg-zinc-900">Creative / Artistic</option>
                    <option value="Academic" className="bg-zinc-900">Academic / Deep</option>
                    <option value="Minimalist" className="bg-zinc-900">Minimalist</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] text-secondary-text font-black uppercase tracking-[0.2em]">{t.language}</span>
                  <div className="grid grid-cols-2 bg-media-bg/30 rounded-xl p-1 border border-media-border/60 h-[52px]">
                    {[
                      { id: 'English', label: 'EN' },
                      { id: 'Arabic', label: 'AR' }
                    ].map(lang => (
                      <button
                        key={lang.id}
                        onClick={() => setParams(prev => ({ ...prev, language: lang.id as any }))}
                        className={`flex items-center justify-center text-[10px] font-black rounded-lg transition-all ${
                          params.language === lang.id ? 'bg-media-blue text-white shadow-md' : 'text-zinc-600 hover:text-zinc-400'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] text-secondary-text font-black uppercase tracking-[0.2em]">{t.phase}</span>
                  <div className="flex bg-media-bg/30 p-1 rounded-xl border border-media-border/60">
                    {[
                      { id: 'START', label: t.phase_start },
                      { id: 'MID', label: t.phase_mid },
                      { id: 'END', label: t.phase_end }
                    ].map(phase => (
                      <button
                        key={phase.id}
                        onClick={() => setParams(prev => ({ ...prev, eventPhase: phase.id as any }))}
                        className={`flex-1 py-2 text-[9px] font-black uppercase tracking-tighter rounded-lg transition-all ${
                          params.eventPhase === phase.id 
                          ? 'bg-media-blue text-white shadow-md' 
                          : 'text-zinc-600 hover:text-zinc-400'
                        }`}
                      >
                        {phase.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <span className="text-[10px] text-secondary-text font-black uppercase tracking-[0.2em]">{t.duration}</span>
                    <select 
                      value={params.duration}
                      onChange={(e) => setParams(p => ({ ...p, duration: parseInt(e.target.value) }))}
                      className="w-full bg-media-bg/30 border border-media-border/60 p-3 rounded-xl text-[11px] font-black text-media-text outline-none focus:border-media-blue transition-all"
                    >
                      {[1, 2, 3, 4, 5].map(d => (
                        <option key={d} value={d} className="bg-zinc-900">{d} {d === 1 ? t.day : t.days}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <span className="text-[10px] text-secondary-text font-black uppercase tracking-[0.2em]">{t.start_date}</span>
                    <input 
                      type="date"
                      value={params.startDate}
                      onChange={(e) => setParams(p => ({ ...p, startDate: e.target.value }))}
                      className="w-full bg-media-bg/30 border border-media-border/60 p-2.5 rounded-xl text-[11px] font-black text-media-text outline-none focus:border-media-blue transition-all [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <span className="text-[10px] text-secondary-text font-black uppercase tracking-[0.2em]">{t.attach_image}</span>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileUpload} 
                      className="hidden" 
                      id="file-upload" 
                    />
                    <label 
                      htmlFor="file-upload"
                      className="w-full flex flex-col items-center justify-center border-2 border-dashed border-media-border/40 hover:border-media-blue/40 bg-media-bg/20 rounded-xl p-4 cursor-pointer transition-all group"
                    >
                      <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <Layout size={18} className="text-zinc-500 group-hover:text-media-blue" />
                      </div>
                      <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{isArabic ? 'انقر لرفع صورة' : 'Click to upload image'}</span>
                    </label>
                    {uploadedImageUrl && (
                      <div className="mt-3 flex items-center gap-3 bg-zinc-900/50 p-2 rounded-lg border border-media-border/40">
                        <img src={uploadedImageUrl} className="w-10 h-10 object-cover rounded border border-white/10" alt="Upload Preview" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest truncate">{isArabic ? 'صورة مرفوعة' : 'Custom Image'}</p>
                          <div className="flex gap-2 mt-1">
                            <button 
                              onClick={() => setUseCustomImage(!useCustomImage)}
                              className={`text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded ${useCustomImage ? 'bg-media-blue text-white' : 'bg-zinc-800 text-zinc-400'}`}
                            >
                              {useCustomImage ? (isArabic ? 'مفعل' : 'Active') : (isArabic ? 'تفعيل' : 'Use')}
                            </button>
                            <button 
                              onClick={() => { setUploadedImageUrl(null); setUseCustomImage(false); }}
                              className="text-[8px] font-black uppercase tracking-tighter bg-red-900/20 text-red-400 px-2 py-0.5 rounded"
                            >
                              {isArabic ? 'حذف' : 'Remove'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <section className="space-y-6">
              <label className="text-xs uppercase tracking-[0.3em] text-media-gold font-black flex items-center gap-2 mb-6">
                <ShieldCheck size={14} fill="currentColor" /> {t.audit_tab}
              </label>

              <div className="space-y-6">
                <div className="space-y-3">
                  <span className="text-[10px] text-secondary-text font-black uppercase tracking-[0.2em]">{t.audit_tab}</span>
                  <div className="relative group">
                    <textarea 
                      className="w-full bg-media-bg/30 border border-media-border/60 rounded-xl p-4 text-sm focus:ring-2 focus:ring-media-gold/20 focus:border-media-gold outline-none transition-all resize-none h-64 text-media-text placeholder:text-zinc-800 leading-relaxed font-medium"
                      placeholder={t.audit_placeholder}
                      value={auditInput}
                      onChange={(e) => setAuditInput(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] text-secondary-text font-black uppercase tracking-[0.2em]">{t.language}</span>
                  <div className="grid grid-cols-2 bg-media-bg/30 rounded-xl p-1 border border-media-border/60 h-[52px]">
                    {[
                      { id: 'English', label: 'EN' },
                      { id: 'Arabic', label: 'AR' }
                    ].map(lang => (
                      <button
                        key={lang.id}
                        onClick={() => setParams(prev => ({ ...prev, language: lang.id as any }))}
                        className={`flex items-center justify-center text-[10px] font-black rounded-lg transition-all ${
                          params.language === lang.id ? 'bg-media-gold text-black shadow-md' : 'text-zinc-600 hover:text-zinc-400'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        <div className="p-6 border-t border-media-border bg-media-panel">
          <button 
            disabled={activeTab === 'generate' ? (isLoading || !params.topic) : (isAuditing || !auditInput)}
            onClick={activeTab === 'generate' ? handleGenerate : handleAudit}
            className={`w-full active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg ${activeTab === 'generate' ? 'bg-media-blue hover:bg-blue-700 shadow-media-blue/20' : 'bg-media-gold !text-black hover:bg-amber-500 shadow-media-gold/20'}`}
          >
            {(isLoading || isAuditing) ? (
               <div className={`w-5 h-5 border-2 border-t-transparent rounded-full animate-spin ${activeTab === 'generate' ? 'border-white' : 'border-black'}`} />
            ) : (
              activeTab === 'generate' ? <Zap size={20} fill="currentColor" /> : <ShieldCheck size={20} />
            )}
            {(isLoading || isAuditing) ? (activeTab === 'generate' ? t.architecting : t.auditing) : (activeTab === 'generate' ? t.generate : t.start_audit)}
          </button>
          <p className="text-[9px] text-center mt-3 text-zinc-600 font-mono tracking-tighter">
            PROCESSED VIA MEDIA CONTENT ARCHITECT ENGINE V2
          </p>
        </div>
      </aside>

      {/* Main Content - Workspace */}
      <main className="flex-1 flex flex-col h-screen relative overflow-hidden bg-media-dark">
        {/* Editor/View Section */}
        <section className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <div className="p-6 border-b border-media-border flex items-center justify-between bg-media-panel/50 backdrop-blur-md sticky top-0 z-30">
            <div className="flex items-center gap-4">
              <div className="text-xs font-mono text-secondary-text uppercase tracking-widest border border-media-border px-3 py-1 rounded-full bg-black/20">
                {t.workspace}: {t.build}.042
              </div>
              <button 
                onClick={handleReset}
                className="text-[9px] font-black text-red-500/60 hover:text-red-500 border border-red-500/20 hover:border-red-500/40 px-3 py-1 rounded-full bg-red-500/5 transition-all flex items-center gap-2"
              >
                <RotateCcw size={10} /> {t.reset}
              </button>
              <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[9px] font-mono text-green-500 uppercase tracking-widest">System_Active</span>
              </div>
            </div>
            {result && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-600 bg-zinc-900/50 px-3 py-1 rounded-full border border-white/5 uppercase tracking-tighter mr-4">
                  <BarChart3 size={10} /> {params.platform} / {params.style}
                </div>
                <button 
                  onClick={() => handleCopy(0)}
                  className="px-5 py-2 bg-media-blue text-white hover:bg-blue-600 rounded-xl transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest shadow-lg shadow-media-blue/20"
                >
                  {copied ? <Check size={14} className="text-white" /> : <Copy size={14} />}
                  {copied ? (isArabic ? 'تم النسخ' : 'Copied') : (isArabic ? 'نسخ البيانات' : 'Copy Payload')}
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-12 lg:p-16 space-y-16 scrollbar-hide font-sans max-w-[1600px] mx-auto w-full relative">
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none" />
            
            <AnimatePresence mode="wait">
              {activeTab === 'generate' ? (
                result ? (
                  <motion.div
                    key="result"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: { 
                        opacity: 1,
                        transition: { 
                          staggerChildren: 0.08 
                        } 
                      }
                    }}
                    className="space-y-16 relative z-10"
                  >
                      <div className="space-y-12">
                        {/* 1. ARCHITECTURAL HEADER: The Master Headline */}
                        <motion.div 
                          variants={{
                            hidden: { opacity: 0, y: 40 },
                            visible: { opacity: 1, y: 0 }
                          }}
                          className="relative group overflow-hidden bg-media-card border border-media-border rounded-[2.5rem] p-12 md:p-20 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)]"
                        >
                          <div className="absolute top-0 left-0 w-3 h-full bg-gradient-to-b from-media-gold via-media-blue to-media-gold" />
                          <div className="flex items-center justify-between mb-10">
                             <div className="flex items-center gap-4">
                               <Sparkles className="text-media-gold group-hover:rotate-12 transition-transform" size={24} />
                               <span className="text-[12px] font-black text-media-gold uppercase tracking-[0.5em]">{t.audit}</span>
                             </div>
                             <div className="flex items-center gap-3">
                               <span className="text-[10px] font-mono text-zinc-500 bg-black/40 px-4 py-2 rounded-full border border-white/5 uppercase tracking-widest backdrop-blur">Core_Intel_v.42</span>
                             </div>
                          </div>
                          <h2 className="text-4xl md:text-7xl lg:text-9xl font-black tracking-tighter text-white font-display leading-[0.95] max-w-6xl">
                            {result.content_output.headline}
                          </h2>
                        </motion.div>
    
                        {/* 2. PRODUCTION CORE: Strategic Horizontal Units */}
                        <div className="flex flex-col gap-10">
                          
                          {/* A. CONTENT TERMINAL (The Product) - Refined vertical density */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {editableBodyOptions.map((optionText, index) => {
                              const boxCharCount = optionText?.length || 0;
                              const isOverBoxLimit = isX && boxCharCount > 280;

                              return (
                                <motion.div 
                                  key={index}
                                  variants={{
                                    hidden: { opacity: 0, scale: 0.98 },
                                    visible: { opacity: 1, scale: 1 }
                                  }}
                                  className="bg-media-card border border-media-border rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col h-full min-h-[400px]"
                                >
                                  <div className="px-8 py-5 bg-zinc-900/60 border-b border-media-border flex items-center justify-between backdrop-blur-xl">
                                    <div className="flex items-center gap-4">
                                      <div className="w-2.5 h-2.5 rounded-full bg-media-blue animate-pulse" />
                                      <span className="text-[11px] font-black text-secondary-text uppercase tracking-widest leading-none">Option {index + 1}</span>
                                    </div>
                                    <div className="flex items-center gap-6">
                                       {isX && (
                                         <div className={`flex items-center gap-2 text-[11px] font-mono font-bold ${isOverBoxLimit ? 'text-red-500' : 'text-zinc-500'}`}>
                                           <Zap size={12} className={isOverBoxLimit ? 'animate-pulse' : ''} /> {boxCharCount}/280
                                         </div>
                                       )}
                                       <button onClick={() => handleCopy(index)} className="text-secondary-text hover:text-white transition-colors">
                                         {copied ? <Check size={16} className="text-media-gold" /> : <Copy size={16} />}
                                       </button>
                                    </div>
                                  </div>
                                  
                                  <div className={`relative p-8 lg:p-10 text-media-text leading-[1.6] whitespace-pre-wrap text-[22px] flex-1 flex flex-col ${params.language === 'Arabic' ? 'arabic-font font-medium' : 'font-medium'}`}>
                                    <textarea 
                                      id={`textarea-body-${index}`}
                                      className="w-full bg-transparent border-none outline-none resize-none overflow-y-auto flex-1 min-h-[250px] max-h-[400px] text-inherit font-inherit placeholder:opacity-20 scrollbar-hide focus:ring-0 pb-8"
                                      value={optionText || ''}
                                      onChange={(e) => {
                                        const newOptions = [...editableBodyOptions];
                                        newOptions[index] = e.target.value;
                                        setEditableBodyOptions(newOptions);
                                      }}
                                      placeholder={isArabic ? 'بانتظار المدخلات...' : 'Awaiting input...'}
                                      spellCheck={false}
                                    />
                                    {optionText && optionText.length > 200 && (
                                      <button 
                                        onClick={() => {
                                          document.getElementById(`textarea-body-${index}`)?.scrollBy({ top: 150, behavior: 'smooth' });
                                        }}
                                        title={isArabic ? 'التمرير للأسفل' : 'Scroll down'}
                                        className="absolute bottom-6 left-1/2 -translate-x-1/2 w-8 h-8 flex items-center justify-center bg-zinc-800/80 hover:bg-media-blue border border-white/10 text-white rounded-full opacity-60 hover:opacity-100 transition-all z-10 animate-bounce cursor-pointer shadow-lg"
                                      >
                                        <ChevronDown size={18} />
                                      </button>
                                    )}
                                  </div>
          
                                  <div className="p-6 bg-black/40 border-t border-media-border flex flex-wrap gap-2">
                                    {result.content_output.hashtags.map(tag => (
                                      <span key={tag} className="text-[11px] text-zinc-400 font-bold bg-zinc-900 border border-white/5 px-4 py-2 rounded-xl cursor-default hover:border-media-blue/50 transition-all hover:text-white">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
    
                          {/* B. HORIZONTAL STRATEGIC DECK */}
                          <div className="grid grid-cols-1 gap-8">
                             
                             {/* 1. Visual Generation Engine (Horizontal Row) */}
                             <motion.div 
                               variants={{
                                 hidden: { opacity: 0, y: 20 },
                                 visible: { opacity: 1, y: 0 }
                               }}
                               className="bg-zinc-900/60 border border-media-border rounded-[2rem] overflow-hidden flex flex-col md:flex-row h-full md:max-h-[320px] shadow-2xl transition-all hover:border-media-border/60"
                             >
                               <div className={`w-full md:w-[480px] h-[240px] md:h-full relative bg-black group shrink-0 border-b md:border-b-0 ${isArabic ? 'md:order-last md:border-l' : 'md:border-r'} border-media-border`}>
                                  {(useCustomImage && uploadedImageUrl) ? (
                                    <img 
                                      src={uploadedImageUrl} 
                                      className="w-full h-full object-cover" 
                                      alt="Custom visual" 
                                    />
                                  ) : (
                                    <>
                                      {mainImgLoading && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/90 z-20">
                                          <div className="w-10 h-10 border-2 border-media-gold/20 border-t-media-gold rounded-full animate-spin mb-3" />
                                          <span className="text-[9px] font-mono text-media-gold/40 uppercase tracking-widest">Rendering...</span>
                                        </div>
                                      )}
                                      {generatedImageUrl ? (
                                        <img 
                                          src={generatedImageUrl} 
                                          className={`w-full h-full object-cover transition-all duration-1000 ${mainImgLoading ? 'opacity-0' : 'opacity-100 scale-100'}`}
                                          referrerPolicy="no-referrer"
                                          onLoad={() => setMainImgLoading(false)}
                                        />
                                      ) : (
                                        <div className="w-full h-full bg-zinc-900/30 flex items-center justify-center">
                                          <div className="text-[10px] text-zinc-700 font-mono tracking-widest uppercase">Visual Node Idle</div>
                                        </div>
                                      )}
                                    </>
                                  )}
                                  <div className="absolute top-4 left-4 z-30">
                                    {uploadedImageUrl && (
                                      <button 
                                        onClick={() => setUseCustomImage(!useCustomImage)}
                                        className="px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-black/60 border border-white/10 text-white backdrop-blur hover:bg-media-blue hover:border-media-blue transition-all"
                                      >
                                        {useCustomImage ? t.use_custom : t.use_ai}
                                      </button>
                                    )}
                                  </div>
                               </div>
  
                               <div className="p-8 md:p-10 flex-1 flex flex-col justify-between">
                                  <div className="space-y-4">
                                     <div className="flex items-center justify-between">
                                       <div className="flex items-center gap-3">
                                          <div className="w-2 h-2 rounded-full bg-media-gold shrink-0" />
                                          <span className="text-[10px] font-black text-secondary-text uppercase tracking-widest">Image Synthesis Unit</span>
                                       </div>
                                       <CopyIconBtn text={editablePrompt || result.visual_engine.image_prompt} />
                                     </div>
                                     <p className={`text-[13px] text-zinc-400 font-regular leading-[1.5] ${isArabic ? 'text-right' : 'text-left'} line-clamp-3 italic`}>
                                       {editablePrompt || result.visual_engine.image_prompt}
                                     </p>
                                  </div>
                                  
                                  <div className="flex items-center gap-4 mt-6">
                                     <button 
                                       onClick={async () => {
                                         setMainImgLoading(true);
                                         try {
                                           const dimensions = {
                                             'Instagram': { w: 1024, h: 1024 },
                                             'X': { w: 1200, h: 675 },
                                             'LinkedIn': { w: 1200, h: 630 },
                                             'Facebook': { w: 1200, h: 630 },
                                             'Threads': { w: 1024, h: 1024 },
                                             'TikTok': { w: 1080, h: 1920 }
                                           }[params.platform] || { w: 1024, h: 1024 };
                                           
                                           const imageUrl = await generateImage(
                                             editablePrompt || result.visual_engine.image_prompt,
                                             dimensions.w,
                                             dimensions.h
                                           );
                                           setGeneratedImageUrl(imageUrl);
                                           setRegenCounter(prev => prev + 1);
                                         } catch (err) {
                                           setError(err instanceof Error ? err.message : "Regeneration failed");
                                         } finally {
                                           setMainImgLoading(false);
                                         }
                                       }}
                                       className="flex-1 py-4 bg-media-gold text-black rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all hover:shadow-[0_0_20px_rgba(255,184,0,0.2)] active:scale-[0.98]"
                                     >
                                       <RotateCcw size={16} strokeWidth={3} /> {isArabic ? 'تحديث المعالجة' : 'Refresh Engine'}
                                     </button>
                                     <div className="px-4 py-4 rounded-2xl bg-zinc-800/40 border border-white/5 text-[9px] font-mono text-zinc-500 uppercase tracking-tighter">
                                       {params.platform} / {result.visual_engine.ratio}
                                     </div>
                                  </div>
                               </div>
                             </motion.div>
     
                             {/* 2. Insight & Briefing Deck (Horizontal Row) */}
                             <motion.div 
                               variants={{
                                 hidden: { opacity: 0, y: 30 },
                                 visible: { opacity: 1, y: 0 }
                               }}
                               className="bg-media-card border border-media-border rounded-[2rem] shadow-2xl overflow-hidden p-8 md:p-12"
                             >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch">
                                   <div className="space-y-4">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <div className="w-1.5 h-4 bg-media-blue rounded-full" />
                                          <label className="text-[11px] font-black uppercase tracking-widest text-media-blue">{t.insight}</label>
                                        </div>
                                        <CopyIconBtn text={result.content_output.expert_insight} />
                                      </div>
                                      <div className={`text-sm text-zinc-100 font-medium italic leading-[1.5] bg-black/30 p-6 rounded-2xl border border-white/5 ${isArabic ? 'arabic-font text-right' : 'text-left'}`}>
                                         "{result.content_output.expert_insight}"
                                      </div>
                                   </div>
   
                                   <div className="space-y-4">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <div className="w-1.5 h-4 bg-media-gold rounded-full" />
                                          <label className="text-[11px] font-black uppercase tracking-widest text-media-gold">Technical Briefing</label>
                                        </div>
                                        <CopyIconBtn text={result.content_output.technical_briefing} />
                                      </div>
                                      <div className={`text-[13px] text-zinc-400 font-regular leading-[1.5] bg-black/30 p-6 rounded-2xl border border-white/5 ${isArabic ? 'arabic-font text-right' : 'text-left'}`}>
                                         {result.content_output.technical_briefing}
                                      </div>
                                   </div>
                                </div>
                             </motion.div>
                          </div>
                        </div>
                      </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col items-center justify-center text-media-border/20 space-y-12"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-media-blue/10 blur-[120px] rounded-full animate-pulse" />
                      <div className="w-32 h-32 bg-zinc-900/50 rounded-3xl flex items-center justify-center border border-white/5 shadow-2xl relative z-10">
                        <Layout size={60} strokeWidth={0.5} className="text-zinc-800" />
                      </div>
                    </div>
                    <div className="text-center space-y-4 px-6 relative z-10">
                      <h3 className="font-display uppercase tracking-[0.4em] text-2xl font-black text-secondary-text/20">{t.inactive}</h3>
                      <p className="text-[12px] text-zinc-700 font-bold uppercase tracking-[0.3em]">Neural Interface Optimized</p>
                      <p className="text-sm text-zinc-800 max-w-sm mx-auto mt-6 leading-loose">{t.configure}</p>
                    </div>
                  </motion.div>
                )
              ) : (
                auditResult ? (
                  <motion.div
                    key="audit-result"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    className="space-y-12 relative z-10"
                  >
                    <div className="relative group overflow-hidden bg-media-card border border-media-border rounded-[2.5rem] p-12 md:p-20 shadow-2xl">
                      <div className="absolute top-0 left-0 w-3 h-full bg-media-gold" />
                      <div className="flex items-center gap-4 mb-8">
                        <ShieldCheck className="text-media-gold" size={24} />
                        <span className="text-[12px] font-black text-media-gold uppercase tracking-[0.5em]">{t.audit_tab}</span>
                      </div>
                      
                      <div className="space-y-12">
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black text-secondary-text uppercase tracking-[.3em]">{t.correction}</h4>
                          <div className={`p-8 md:p-12 bg-black/40 border border-media-border/40 rounded-3xl text-2xl md:text-4xl text-white leading-relaxed ${isArabic ? 'arabic-font' : ''} whitespace-pre-wrap`}>
                            {auditResult.corrected_text}
                          </div>
                          <div className="flex justify-end">
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(auditResult.corrected_text);
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                              }}
                              className="px-6 py-2 bg-zinc-900 border border-white/5 rounded-xl hover:bg-media-gold hover:text-black transition-all text-xs font-black uppercase tracking-widest flex items-center gap-2"
                            >
                              {copied ? <Check size={14} /> : <Copy size={14} />}
                              {copied ? (isArabic ? 'تم النسخ' : 'Copied') : (isArabic ? 'نسخ النص المعدل' : 'Copy Corrected')}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-black text-secondary-text uppercase tracking-[.3em]">{t.explanation}</h4>
                            <CopyIconBtn text={auditResult.explanation} />
                          </div>
                          <div className={`p-8 bg-zinc-900/40 border border-white/5 rounded-3xl text-lg text-zinc-400 italic leading-relaxed ${isArabic ? 'arabic-font' : ''}`}>
                            {auditResult.explanation}
                          </div>
                        </div>

                        {auditResult.is_perfect && (
                          <div className="flex items-center gap-3 p-6 bg-green-500/10 border border-green-500/20 rounded-2xl">
                            <Check className="text-green-500" size={20} />
                            <span className="text-sm font-black text-green-500 uppercase tracking-widest">
                              {isArabic ? 'النص أصلي ومثالي لا يتطلب تعديلات.' : 'The original text is perfect and required no changes.'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="audit-placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col items-center justify-center text-media-border/20 space-y-12"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-media-gold/10 blur-[120px] rounded-full animate-pulse" />
                      <div className="w-32 h-32 bg-zinc-900/50 rounded-3xl flex items-center justify-center border border-white/5 shadow-2xl relative z-10">
                        <ShieldCheck size={60} strokeWidth={0.5} className="text-zinc-800" />
                      </div>
                    </div>
                    <div className="text-center space-y-4 px-6 relative z-10">
                      <h3 className="font-display uppercase tracking-[0.4em] text-2xl font-black text-secondary-text/20">{isArabic ? 'بانتظار التدقيق' : 'Awaiting Audit'}</h3>
                      <p className="text-sm font-mono tracking-widest max-w-sm mx-auto text-zinc-800">
                        {isArabic ? 'أدخل النص في القائمة الجانبية لبدء التدقيق الوجباتي واللغوي.' : 'Input text in the sidebar to initialize the linguistic audit engine.'}
                      </p>
                    </div>
                  </motion.div>
                )
              )}
            </AnimatePresence>
          </div>

          <div className="p-6 border-t border-media-border bg-media-panel/50 backdrop-blur-md flex items-center justify-between">
            <div className="flex gap-8">
              <div className="flex flex-col">
                <span className="text-[9px] text-zinc-600 uppercase font-black tracking-widest">{t.latency}</span>
                <span className="text-[11px] text-green-500 font-mono">1.4ms_FAST</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] text-zinc-600 uppercase font-black tracking-widest">{t.security}</span>
                <span className="text-[11px] text-media-blue font-mono">NODE_LOCK</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-media-blue animate-pulse" />
              <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">Broadcast Link: PROD_READY.v42</span>
            </div>
          </div>
        </section>
      </main>

      {error && (
        <div className="fixed bottom-6 right-6 bg-red-900/90 border border-red-500/50 p-4 rounded-xl flex items-center gap-3 backdrop-blur shadow-2xl z-50">
          <AlertCircle className="text-red-400" />
          <div className="text-sm font-medium text-red-200">
            {error}
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-white">
            <RotateCcw size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, BrainCircuit,
  Check, ChevronDown, ChevronRight, ClipboardCheck, Copy, FileText, Heart, Languages,
  LoaderCircle, Microscope, ScanLine, Sparkles, Target, WandSparkles, X,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

type Lang = "en" | "ar";
type Service = "topics" | "idea" | "improve" | "proposal";
type Item = Record<string, any>;
type Favorite = { title: string; arabicTitle: string; savedAt: number };

const copy = {
  en: {
    home: "Home", services: "Research tools", saved: "Saved ideas", about: "About", start: "Start research",
    kicker: "YOUR RESEARCH JOURNEY STARTS HERE", headline: "From research ideas\nto academic titles.",
    intro: "An AI-powered assistant designed to help radiology postgraduate students discover research ideas, generate academic titles, and develop research proposals.",
    cta: "Start Research", trust: "Built for radiology · Guided by research methods · Ready for your supervisor",
    platform: "THE RESEARCH WORKSPACE", choose: "What would you like to work on?", chooseSub: "Start with a direction. You can refine the idea at every step.",
    topics: "Topic generator", idea: "Develop an idea", improve: "Improve a title", proposal: "Draft a proposal",
    topicSub: "Find a feasible research direction", ideaSub: "Shape an early thought into a study", improveSub: "Make your title precise and academic", proposalSub: "Build a preliminary study outline",
    configure: "Shape your research", modality: "Imaging modality", bodyPart: "Body region", degree: "Academic level", researchType: "Study design", difficulty: "Difficulty level", number: "Number of suggestions",
    chooseOne: "Choose one", generate: "Generate research topics", develop: "Develop my idea", improveBtn: "Improve my title", proposalBtn: "Build proposal outline",
    ideaLabel: "Your early research idea", ideaPlaceholder: "For example: I want to compare MRI and ultrasound for assessing a certain musculoskeletal condition in patients at our hospital…",
    titleLabel: "Current research title", titlePlaceholder: "Paste your working title…", proposalLabel: "Research title for the proposal", proposalPlaceholder: "Enter the title you want to develop…",
    results: "Your research directions", resultsHint: "AI-generated suggestions · Review feasibility and novelty with your academic team.",
    view: "View details", hide: "Hide details", developThis: "Develop this idea", copy: "Copy title", copied: "Copied", save: "Save idea", savedLabel: "Saved", print: "Save as PDF", newSearch: "Start over",
    explain: "Research idea", aim: "Aim of the study", objectives: "Objectives", significance: "Scientific significance", requirements: "Requirements & resources", difficultyResult: "Expected difficulty", assumptions: "Assumptions to confirm", methodology: "Suggested methodology", problem: "Research problem", question: "Research question", strengths: "Potential strengths", limitations: "Potential limitations", analysis: "Title analysis", weaknesses: "Points to clarify", improved: "Refined academic title", difference: "How this title differs", introduction: "Introduction", population: "Study population", inclusion: "Inclusion criteria", exclusion: "Exclusion criteria", collection: "Suggested data collection", expected: "Expected outcomes (hypotheses)", questions: "Research questions", review: "Academic review note",
    empty: "Your workspace is ready", emptySub: "Choose a research tool above to create a real AI-assisted academic draft.",
    safety: "Academic starting point, not a finished protocol", safetySub: "AI suggestions are preliminary. Confirm feasibility, local resources, ethics approval and sample-size planning with your supervisor and statistician. Novelty cannot be confirmed without a separate literature review.",
    savedIdeas: "Your saved ideas", noSaved: "No saved ideas yet. Save a title you want to revisit.", remove: "Remove", footer: "An academic starting point — your supervisor provides the final direction.", apiError: "AI generation is temporarily unavailable. Check the project AI service configuration and try again.", required: "Please complete this field before generating.", loading: "Working on your research…", basic: "Basic", intermediate: "Intermediate", advanced: "Advanced", degreeMaster: "Master's Degree", degreePhd: "PhD", degreeResearch: "Scientific Research", methodType: "Research type", outputError: "The AI response could not be read. Please try again.", disclaimer: "Suggestions are not evidence of novelty and contain no verified study findings."
  },
  ar: {
    home: "الرئيسية", services: "أدوات البحث", saved: "الأفكار المحفوظة", about: "عن المنصة", start: "ابدأ بحثك",
    kicker: "رحلتك البحثية تبدأ من هنا", headline: "من الفكرة البحثية\nإلى العنوان الأكاديمي.",
    intro: "مساعد ذكي لمساندة طلاب الدراسات العليا في الأشعة على اكتشاف أفكار بحثية، وصياغة عناوين أكاديمية، وتطوير تصور أولي للمقترحات.",
    cta: "ابدأ البحث", trust: "مصمم للأشعة · يسترشد بالمنهجية · جاهز للنقاش مع مشرفك",
    platform: "مساحة العمل البحثية", choose: "ما الذي تريد العمل عليه؟", chooseSub: "ابدأ باتجاه بحثي، ثم طوّر فكرتك في كل خطوة.",
    topics: "مولّد الموضوعات", idea: "طوّر فكرة", improve: "حسّن عنوانًا", proposal: "تصوّر مقترحًا",
    topicSub: "اكتشف اتجاهًا بحثيًا قابلًا للتنفيذ", ideaSub: "حوّل الفكرة الأولية إلى دراسة", improveSub: "اجعل العنوان أوضح وأكاديميًا", proposalSub: "أنشئ مسودة أولية لخطة الدراسة",
    configure: "حدّد مسار بحثك", modality: "وسيلة التصوير", bodyPart: "المنطقة التشريحية", degree: "الدرجة الأكاديمية", researchType: "نوع الدراسة", difficulty: "مستوى الصعوبة", number: "عدد الاقتراحات",
    chooseOne: "اختر", generate: "ولّد موضوعات بحثية", develop: "طوّر فكرتي", improveBtn: "حسّن عنواني", proposalBtn: "أنشئ تصور المقترح",
    ideaLabel: "فكرتك البحثية الأولية", ideaPlaceholder: "مثال: أرغب في مقارنة MRI وUltrasound لتقييم حالة عضلية هيكلية لدى مرضى المستشفى…",
    titleLabel: "عنوان البحث الحالي", titlePlaceholder: "أدخل عنوانك المبدئي…", proposalLabel: "عنوان البحث المقترح", proposalPlaceholder: "أدخل العنوان الذي تريد تطويره…",
    results: "مساراتك البحثية المقترحة", resultsHint: "اقتراحات مولّدة بالذكاء الاصطناعي · راجع إمكانية التنفيذ والجِدّة مع فريقك الأكاديمي.",
    view: "عرض التفاصيل", hide: "إخفاء التفاصيل", developThis: "طوّر هذه الفكرة", copy: "انسخ العنوان", copied: "تم النسخ", save: "احفظ الفكرة", savedLabel: "محفوظة", print: "حفظ بصيغة PDF", newSearch: "ابدأ من جديد",
    explain: "فكرة البحث", aim: "هدف الدراسة", objectives: "الأهداف", significance: "الأهمية العلمية", requirements: "المتطلبات والإمكانات", difficultyResult: "الصعوبة المتوقعة", assumptions: "افتراضات تحتاج إلى تأكيد", methodology: "المنهجية المقترحة", problem: "المشكلة البحثية", question: "السؤال البحثي", strengths: "نقاط القوة المحتملة", limitations: "القيود المحتملة", analysis: "تحليل العنوان", weaknesses: "نقاط تحتاج إلى توضيح", improved: "صياغة أكاديمية محسّنة", difference: "الفرق بين العناوين", introduction: "المقدمة", population: "مجتمع الدراسة", inclusion: "معايير الاشتمال", exclusion: "معايير الاستبعاد", collection: "طرق جمع البيانات المقترحة", expected: "النتائج المتوقعة (افتراضات)", questions: "الأسئلة البحثية", review: "تنبيه للمراجعة الأكاديمية",
    empty: "مساحة العمل جاهزة", emptySub: "اختر إحدى الأدوات أعلاه لإنشاء مسودة أكاديمية فعلية بمساعدة الذكاء الاصطناعي.",
    safety: "نقطة بداية أكاديمية، وليست بروتوكولًا نهائيًا", safetySub: "الاقتراحات أولية. تحقق من الإمكانات والموارد والموافقة الأخلاقية وحساب حجم العينة مع المشرف والإحصائي. ولا يمكن تأكيد الجِدّة دون مراجعة مستقلة للأدبيات.",
    savedIdeas: "أفكارك المحفوظة", noSaved: "لا توجد أفكار محفوظة بعد. احفظ عنوانًا لتعود إليه لاحقًا.", remove: "إزالة", footer: "بداية أكاديمية — ومشرفك يوجّه القرار النهائي.", apiError: "خدمة الذكاء الاصطناعي غير متاحة مؤقتًا. تحقق من إعداد خدمة المشروع ثم أعد المحاولة.", required: "أكمل هذا الحقل قبل إنشاء النتائج.", loading: "نعمل على فكرتك البحثية…", basic: "أساسي", intermediate: "متوسط", advanced: "متقدم", degreeMaster: "ماجستير", degreePhd: "دكتوراه", degreeResearch: "بحث علمي", methodType: "نوع الدراسة", outputError: "تعذّر قراءة استجابة الذكاء الاصطناعي. حاول مرة أخرى.", disclaimer: "الاقتراحات لا تثبت الجِدّة ولا تتضمن نتائج دراسات موثقة."
  }
} as const;

const modalities = ["X-ray", "Ultrasound", "CT", "MRI", "Mammography", "Nuclear Medicine", "Interventional Radiology"] as const;
const regions = ["Brain", "Chest", "Abdomen", "Pelvis", "Musculoskeletal", "Cardiovascular", "Head & Neck"] as const;
const methods = ["Comparative Study", "Diagnostic Accuracy", "Clinical Study", "Cross-sectional Study", "Prospective Study", "Retrospective Study", "Technical Evaluation"] as const;
const degrees = ["Master's Degree", "PhD", "Scientific Research"] as const;
const difficulties = ["Basic", "Intermediate", "Advanced"] as const;
const difficultyMap: Record<string, string> = { Basic: "basic", Intermediate: "intermediate", Advanced: "advanced" };
const degreeMap: Record<string, string> = { "Master's Degree": "degreeMaster", PhD: "degreePhd", "Scientific Research": "degreeResearch" };
const detailLabels: Record<string, keyof typeof copy.en> = {
  idea: "explain", aim: "aim", objectives: "objectives", significance: "significance", requirements: "requirements", difficulty: "difficultyResult", assumptions: "assumptions", suggestedMethodology: "methodology", methodology: "methodology", researchProblem: "problem", researchQuestion: "question", strengths: "strengths", limitations: "limitations", analysis: "analysis", weaknesses: "weaknesses", introduction: "introduction", studyPopulation: "population", inclusionCriteria: "inclusion", exclusionCriteria: "exclusion", dataCollectionMethods: "collection", expectedOutcomes: "expected", researchQuestions: "questions", reviewNotice: "review"
};
const labelText: Record<string, string> = { suggestedMethodology: "Suggested methodology", researchProblem: "Research problem", researchQuestion: "Research question", strengths: "Potential strengths", limitations: "Potential limitations", introduction: "Introduction", studyPopulation: "Study population", inclusionCriteria: "Inclusion criteria", exclusionCriteria: "Exclusion criteria", dataCollectionMethods: "Suggested data collection", expectedOutcomes: "Expected outcomes", researchQuestions: "Research questions", reviewNotice: "Academic review note", analysis: "Title analysis", weaknesses: "Points to clarify", improvedTitle: "Refined title", assumptions: "Assumptions to confirm" };

const readStorage = (key: string): string | null => {
  try { return localStorage.getItem(key); } catch { return null; }
};
const writeStorage = (key: string, value: string) => {
  try { localStorage.setItem(key, value); } catch { /* storage unavailable (private mode / quota) */ }
};
const readFavorites = (): Favorite[] => {
  try {
    const parsed = JSON.parse(readStorage("radiogen-favorites") || "[]");
    return Array.isArray(parsed) ? parsed.filter((f) => f && typeof f.title === "string") : [];
  } catch { return []; }
};

// Safely turn any model-returned value (string, object, array of objects) into readable text.
function toText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(toText).filter(Boolean).join("; ");
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).map(([k, v]) => `${k}: ${toText(v)}`).join("; ");
  }
  return String(value);
}

function SelectField({ label, value, onChange, options, format }: { label: string; value: string; onChange: (v: any) => void; options: readonly string[]; format?: (value: string) => string }) {
  return (
    <label className="field"><span>{label}</span><div className="select-wrap"><select value={value} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option} value={option}>{format ? format(option) : option}</option>)}</select><ChevronDown size={15} /></div></label>
  );
}

function Field({ name, value, t, rtl }: { name: string; value: unknown; t: Record<string, string>; rtl: boolean }) {
  if (value === undefined || value === null || value === "") return null;
  if (Array.isArray(value) && value.length === 0) return null;
  const labelKey = detailLabels[name];
  const label = t[labelKey || ""] || (rtl ? ({ title: "العنوان", arabicTitle: "الترجمة العربية", improvedTitle: "العنوان المحسّن", improvedArabicTitle: "الترجمة العربية" } as Record<string, string>)[name] : labelText[name]) || name.replace(/([A-Z])/g, " $1");
  return <div className="detail-field"><h4>{label}</h4>{Array.isArray(value) ? <ul>{value.map((entry, idx) => <li key={idx}>{toText(entry)}</li>)}</ul> : <p>{toText(value)}</p>}</div>;
}

function iconFor(service: Service) {
  if (service === "topics") return <ScanLine size={19} />;
  if (service === "idea") return <BrainCircuit size={19} />;
  if (service === "improve") return <WandSparkles size={19} />;
  return <FileText size={19} />;
}

export default function Home() {
  const [language, setLanguage] = useState<Lang>(() => (readStorage("radiogen-language") === "ar" ? "ar" : "en"));
  const [service, setService] = useState<Service>("topics");
  const [modality, setModality] = useState<(typeof modalities)[number]>("MRI");
  const [bodyPart, setBodyPart] = useState<(typeof regions)[number]>("Brain");
  const [degree, setDegree] = useState<(typeof degrees)[number]>("Master's Degree");
  const [researchType, setResearchType] = useState<(typeof methods)[number]>("Diagnostic Accuracy");
  const [difficulty, setDifficulty] = useState<(typeof difficulties)[number]>("Intermediate");
  const [count, setCount] = useState("5");
  const [idea, setIdea] = useState("");
  const [title, setTitle] = useState("");
  const [results, setResults] = useState<Item | null>(null);
  const [resultService, setResultService] = useState<Service | null>(null);
  const [resultModality, setResultModality] = useState<string>("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<Favorite[]>(readFavorites);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const t = copy[language];
  const rtl = language === "ar";
  useEffect(() => { document.documentElement.lang = language; document.documentElement.dir = rtl ? "rtl" : "ltr"; }, [language, rtl]);
  const topicMutation = trpc.research.generateTopics.useMutation();
  const ideaMutation = trpc.research.developIdea.useMutation();
  const titleMutation = trpc.research.improveTitle.useMutation();
  const proposalMutation = trpc.research.createProposal.useMutation();
  const pending = topicMutation.isPending || ideaMutation.isPending || titleMutation.isPending || proposalMutation.isPending;
  const currentTitles = useMemo(() => {
    if (!results) return [] as Item[];
    if (Array.isArray(results.items)) return results.items;
    if (Array.isArray(results.titleOptions)) return results.titleOptions;
    if (Array.isArray(results.alternatives)) return results.alternatives;
    return [];
  }, [results]);

  const setServiceAndScroll = (next: Service) => {
    setService(next);
    document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (pending) return;
    if ((service === "idea" && idea.trim().length < 15) || (service !== "topics" && service !== "idea" && title.trim().length < 8)) {
      setError(t.required);
      return;
    }
    setError("");
    setResults(null);
    setResultService(null);
    const usedModality = modality;
    const callbacks = {
      onSuccess: (data: Item) => { setResults(data); setResultService(service); setResultModality(usedModality); setExpanded(null); window.setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 150); },
      onError: (cause: { message?: string }) => setError(cause?.message ? `${t.apiError} (${cause.message})` : t.apiError),
    };
    if (service === "topics") topicMutation.mutate({ language, modality, bodyPart, degree, researchType, difficulty, count: Number(count) }, callbacks);
    if (service === "idea") ideaMutation.mutate({ language, idea: idea.trim() }, callbacks);
    if (service === "improve") titleMutation.mutate({ language, title: title.trim() }, callbacks);
    if (service === "proposal") proposalMutation.mutate({ language, title: title.trim() }, callbacks);
  };
  const toggleFavorite = (item: Item) => {
    const researchTitle = String(item.title || item.improvedTitle || "").trim();
    if (!researchTitle) return;
    const next = favorites.some((favorite) => favorite.title === researchTitle)
      ? favorites.filter((favorite) => favorite.title !== researchTitle)
      : [{ title: researchTitle, arabicTitle: String(item.arabicTitle || item.improvedArabicTitle || ""), savedAt: Date.now() }, ...favorites];
    setFavorites(next);
    writeStorage("radiogen-favorites", JSON.stringify(next));
  };
  const removeFavorite = (saved: Favorite) => {
    const next = favorites.filter((favorite) => favorite.title !== saved.title);
    setFavorites(next);
    writeStorage("radiogen-favorites", JSON.stringify(next));
  };
  const copyTitle = async (value: string) => {
    try { await navigator.clipboard.writeText(value); setCopied(value); window.setTimeout(() => setCopied(null), 1700); }
    catch { setError(t.outputError); }
  };
  const makeProposal = (value: string) => { setTitle(value); setServiceAndScroll("proposal"); };
  const developTitleIdea = (item: Item) => {
    const prompt = [item.title, item.idea].filter(Boolean).join(" — ");
    setIdea(prompt);
    setServiceAndScroll("idea");
  };
  const keyForTitle = (item: Item) => String(item.title || item.improvedTitle || "");

  const serviceOptions: { id: Service; title: string; subtitle: string }[] = [
    { id: "topics", title: t.topics, subtitle: t.topicSub }, { id: "idea", title: t.idea, subtitle: t.ideaSub },
    { id: "improve", title: t.improve, subtitle: t.improveSub }, { id: "proposal", title: t.proposal, subtitle: t.proposalSub },
  ];
  const tabBar = <div className="service-tabs" role="tablist" aria-label={t.services}>{serviceOptions.map((option, index) => <button type="button" role="tab" aria-selected={service === option.id} className={`service-tab ${service === option.id ? "selected" : ""}`} onClick={() => { setService(option.id); setError(""); }} key={option.id}><span className="tab-icon">{iconFor(option.id)}</span><span className="tab-copy"><strong>{option.title}</strong><small>{option.subtitle}</small></span><span className="tab-number">0{index + 1}</span></button>)}</div>;

  return (
    <div className={`site ${rtl ? "rtl" : "ltr"}`} dir={rtl ? "rtl" : "ltr"}>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Radiology Research Topic Generator home"><span className="brand-mark"><img src="/logo.svg" alt="" /></span><span className="brand-text"><strong>RADIOLOGY<span>LAB</span></strong><small>RESEARCH TOPIC GENERATOR</small></span></a>
        <nav className="main-nav"><a href="#top">{t.home}</a><a href="#workspace">{t.services}</a><a href="#saved">{t.saved}</a><a href="#about">{t.about}</a></nav>
        <div className="top-actions"><button className="language-switch" onClick={() => { const next = rtl ? "en" : "ar"; setLanguage(next); writeStorage("radiogen-language", next); }} aria-label="Switch language"><Languages size={16} /><span>{rtl ? "EN" : "عربي"}</span></button><a className="top-cta" href="#workspace">{t.start}<ArrowUpRight size={15} /></a></div>
      </header>

      <main id="top">
        <section className="tool-launcher" aria-label={t.services}><div className="tool-launcher-heading"><span className="section-label">RESEARCH WORKSPACE / 01—04</span><h2>{t.choose}</h2></div>{tabBar}</section>
        <section className="hero">
          <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot" />{t.kicker}</div><h1>{t.headline.split("\n").map((line, idx) => <span key={idx}>{line}{idx === 0 && <br />}</span>)}</h1><p>{t.intro}</p><div className="hero-actions"><a href="#workspace" className="button-primary">{t.cta}{rtl ? <ArrowLeft size={17} /> : <ArrowRight size={17} />}</a><div className="hero-proof"><div className="proof-icon"><Microscope size={16} /></div><span>{t.trust}</span></div></div></div>
          <div className="hero-visual"><div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" /><div className="secondary-xray"><img src="/images/chest-pa-xray.jpg" alt="Educational posteroanterior chest X-ray" /><small>CHEST X-RAY · CC0</small></div><div className="scan-card scan-back"><div className="scan-head"><span>BRAIN fMRI</span><span>EDUCATIONAL</span></div><div className="brain-scan"><img className="real-scan" src="/images/brain-fmri.jpg" alt="Example human brain fMRI image" /><span className="image-credit">NASA · PUBLIC DOMAIN</span></div><div className="scan-foot"><span>EXAMPLE IMAGE · NOT FOR DIAGNOSIS</span></div></div><div className="research-note"><span className="note-icon"><Target size={16} /></span><div><small>RESEARCH QUESTION</small><strong>How can imaging inform better care?</strong></div><span className="note-glow" /></div><div className="hero-stamp"><Activity size={15} /><span>RESEARCH<br />IN MOTION</span></div></div>
          <div className="hero-index"><span>01</span><i /> <span>IDEA TO IMPACT</span></div>
        </section>

        <section className="workflow-intro" id="workspace"><div><span className="section-label"><Sparkles size={14} /> {t.platform}</span><h2>{t.configure}</h2><p>{t.chooseSub}</p></div><span className="step-count">01 <i /> 04</span></section>
        <section className="workbench">
          <div className="form-panel">
            <div className="panel-heading"><span className="panel-icon">{iconFor(service)}</span><div><span className="section-label">{service === "topics" ? "01 / DISCOVER" : service === "idea" ? "02 / DEVELOP" : service === "improve" ? "03 / REFINE" : "04 / PLAN"}</span><h3>{service === "topics" ? t.configure : service === "idea" ? t.idea : service === "improve" ? t.improve : t.proposal}</h3></div></div>
            <form onSubmit={submit}>
              {service === "topics" ? <div className="form-grid">
                <SelectField label={t.modality} value={modality} onChange={setModality} options={modalities} />
                <SelectField label={t.bodyPart} value={bodyPart} onChange={setBodyPart} options={regions} />
                <SelectField label={t.degree} value={degree} onChange={setDegree} options={degrees} format={(v) => degreeMap[v] ? (t as Record<string, string>)[degreeMap[v]] : v} />
                <SelectField label={t.researchType} value={researchType} onChange={setResearchType} options={methods} />
                <SelectField label={t.difficulty} value={difficulty} onChange={setDifficulty} options={difficulties} format={(v) => (t as Record<string, string>)[difficultyMap[v]]} />
                <SelectField label={t.number} value={count} onChange={setCount} options={["5", "6", "7", "8", "9", "10"]} />
              </div> : <label className="field text-field"><span>{service === "idea" ? t.ideaLabel : service === "improve" ? t.titleLabel : t.proposalLabel}</span>{service === "idea" ? <textarea rows={6} maxLength={3000} value={idea} onChange={(e) => setIdea(e.target.value)} placeholder={t.ideaPlaceholder} /> : <textarea rows={service === "proposal" ? 3 : 4} maxLength={500} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={service === "improve" ? t.titlePlaceholder : t.proposalPlaceholder} />}<small className="char-count">{service === "idea" ? idea.length : title.length} / {service === "idea" ? 3000 : 500}</small></label>}
              {error && <div className="error-box" role="alert"><X size={16} />{error}</div>}
              <button className="generate-button" type="submit" disabled={pending}>{pending ? <LoaderCircle size={18} className="spin" /> : <Sparkles size={18} />}{pending ? t.loading : service === "topics" ? t.generate : service === "idea" ? t.develop : service === "improve" ? t.improveBtn : t.proposalBtn}{!pending && (rtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />)}</button>
              <div className="form-footnote"><ClipboardCheck size={14} /><span>{t.disclaimer}</span></div>
            </form>
          </div>
          <aside className="guidance-panel"><div className="guidance-top"><div className="guidance-symbol"><BrainCircuit size={22} /></div><span>FIELD NOTES <b>•</b> 01—04</span></div><h3>{rtl ? "بحث يبدأ بسؤالٍ أوضح." : "A better study begins with a better question."}</h3><p>{rtl ? "تساعدك الأدوات على تنظيم التفكير البحثي. اختر طريقة تصوير ونوع دراسة يناسبان الإمكانات المتاحة، ثم ناقش التفاصيل مع فريقك." : "Use these tools to organize your thinking. Select a modality and study design that fit your available resources, then review the details with your academic team."}</p><div className="guide-rule" /><div className="guide-step"><span>1</span><div><strong>{rtl ? "حدد السؤال" : "Define the question"}<small>{rtl ? "ما الذي تريد فهمه أو مقارنته؟" : "What do you want to understand or compare?"}</small></strong><ChevronRight size={15} /></div></div><div className="guide-step"><span>2</span><div><strong>{rtl ? "تحقق من الإمكانات" : "Check feasibility"}<small>{rtl ? "البيانات والأجهزة والموافقات" : "Data, equipment and approvals"}</small></strong><ChevronRight size={15} /></div></div><div className="guide-step"><span>3</span><div><strong>{rtl ? "راجع مع المشرف" : "Discuss with your supervisor"}<small>{rtl ? "المنهجية وحجم العينة والجِدّة" : "Methods, sample size and novelty"}</small></strong><ChevronRight size={15} /></div></div><div className="guide-note"><span className="note-check"><Check size={13} /></span><span>{rtl ? "لا نبحث في قواعد بيانات الدراسات السابقة." : "No prior-study database search is performed."}</span></div></aside>
        </section>

        <section className="results-section" id="results">
          {!results ? <div className="empty-state"><div className="empty-graphic"><div className="empty-line line-a" /><div className="empty-line line-b" /><div className="empty-core"><Sparkles size={23} /></div><span>R</span></div><p className="section-label">YOUR NEXT STEP</p><h3>{t.empty}</h3><p>{t.emptySub}</p></div> : <>
            <div className="results-heading"><div><span className="section-label"><Sparkles size={14} /> AI-ASSISTED DRAFT</span><h2>{t.results}</h2><p>{t.resultsHint}</p></div><div className="result-actions"><button type="button" className="outline-button" onClick={() => window.print()}><FileText size={16} />{t.print}</button><button type="button" className="quiet-button" onClick={() => { setResults(null); setError(""); }}><ArrowDown size={15} />{t.newSearch}</button></div></div>
            <div className="result-cards">
              {resultService === "proposal" && <article className="proposal-result"><div className="proposal-title"><span className="result-index">01</span><div><span className="section-label">PRELIMINARY PROPOSAL OUTLINE</span><h3>{results.title || title}</h3>{results.arabicTitle && <p dir="rtl">{results.arabicTitle}</p>}</div></div><div className="proposal-grid">{Object.entries(results).filter(([key]) => !["title", "arabicTitle"].includes(key)).map(([key, value]) => <Field key={key} name={key} value={value} t={t as Record<string, string>} rtl={rtl} />)}</div></article>}
              {resultService === "improve" && <article className="improved-callout"><span className="section-label">{t.improved}</span><div className="improved-title-row"><h3>{results.improvedTitle}</h3><button type="button" className="icon-button" aria-label={t.copy} onClick={() => copyTitle(String(results.improvedTitle || ""))}><Copy size={16} /></button></div>{results.improvedArabicTitle && <p className="arabic-title" dir="rtl">{results.improvedArabicTitle}</p>}</article>}
              {currentTitles.map((item, index) => {
                const titleValue = keyForTitle(item);
                const arabicValue = String(item.arabicTitle || item.improvedArabicTitle || "");
                const isSaved = favorites.some((favorite) => favorite.title === titleValue);
                const fields = Object.entries(item).filter(([key]) => !["title", "arabicTitle", "rationale", "difference"].includes(key));
                return <article className="result-card" key={`${titleValue}-${index}`}><div className="card-topline"><span className="result-index">{String(index + 1).padStart(2, "0")}</span><span className="card-type">{resultService === "topics" ? resultModality : resultService === "idea" ? "IDEA DEVELOPMENT" : resultService === "improve" ? "TITLE OPTION" : "RESEARCH DIRECTION"}</span><button type="button" className={`favorite-button ${isSaved ? "active" : ""}`} onClick={() => toggleFavorite(item)} aria-label={isSaved ? t.savedLabel : t.save}><Heart size={17} fill={isSaved ? "currentColor" : "none"} /></button></div><h3 className="result-title">{titleValue || item.rationale || t.results}</h3>{arabicValue && <p className="arabic-title" dir="rtl">{arabicValue}</p>}{item.difference && <p className="difference-line"><span>{t.difference}:</span> {String(item.difference)}</p>}{item.rationale && <p className="difference-line">{String(item.rationale)}</p>}{item.idea && <p className="card-summary">{String(item.idea)}</p>}
                  <div className="card-buttons"><button type="button" className="card-action" onClick={() => setExpanded(expanded === index ? null : index)}>{expanded === index ? t.hide : t.view}<ChevronDown size={14} className={expanded === index ? "rotate" : ""} /></button><button type="button" className="card-action" onClick={() => developTitleIdea(item)}><BrainCircuit size={15} />{t.developThis}</button><button type="button" className="card-action" onClick={() => copyTitle(titleValue)}>{copied === titleValue ? <Check size={15} /> : <Copy size={15} />}{copied === titleValue ? t.copied : t.copy}</button><button type="button" className="card-action" onClick={() => makeProposal(titleValue)}><FileText size={15} />{t.proposal}</button></div>
                  {expanded === index && <div className="card-details">{fields.map(([key, value]) => <Field key={key} name={key} value={value} t={t as Record<string, string>} rtl={rtl} />)}</div>}
                </article>;
              })}
              {resultService === "idea" && results.researchProblem && <article className="result-card insight-card"><span className="section-label">RESEARCH IDEA ANALYSIS</span><div className="card-details always-open">{Object.entries(results).filter(([key]) => !["titleOptions"].includes(key)).map(([key, value]) => <Field key={key} name={key} value={value} t={t as Record<string, string>} rtl={rtl} />)}</div></article>}
              {resultService === "improve" && <article className="result-card insight-card"><div className="card-details always-open">{Object.entries(results).filter(([key]) => !["alternatives", "improvedTitle", "improvedArabicTitle"].includes(key)).map(([key, value]) => <Field key={key} name={key} value={value} t={t as Record<string, string>} rtl={rtl} />)}</div></article>}
            </div>
            <div className="research-disclaimer"><span className="disclaimer-icon"><BookOpen size={17} /></span><div><strong>{t.safety}</strong><p>{t.safetySub}</p></div></div>
          </>}
        </section>

        <section className="saved-section" id="saved"><div className="saved-header"><div><span className="section-label"><Heart size={13} /> YOUR SHORTLIST</span><h2>{t.savedIdeas}</h2></div><span className="saved-count">{favorites.length.toString().padStart(2, "0")}</span></div>{favorites.length === 0 ? <p className="saved-empty">{t.noSaved}</p> : <div className="saved-list">{favorites.map((favorite) => <div className="saved-item" key={favorite.title}><span className="saved-spark"><Target size={16} /></span><div className="saved-title"><strong>{favorite.title}</strong>{favorite.arabicTitle && <small dir="rtl">{favorite.arabicTitle}</small>}</div><button type="button" className="icon-button" onClick={() => makeProposal(favorite.title)} aria-label={t.proposal}><FileText size={16} /></button><button type="button" className="icon-button remove-icon" onClick={() => removeFavorite(favorite)} aria-label={t.remove}><X size={16} /></button></div>)}</div>}</section>

        <section className="about-strip" id="about"><div className="about-mark"><Microscope size={20} /></div><div><span className="section-label">A TOOL FOR THE THINKING BEHIND THE SCAN</span><p>{rtl ? "أفكار بحثية منظمة في تخصص الأشعة، بمساحة واضحة للتمحيص والنقاش الأكاديمي." : "Structured research thinking for radiology, with room for scrutiny and academic discussion."}</p></div><a href="#workspace" className="about-link">{t.start}<ArrowUpRight size={16} /></a></section>
      </main>
      <footer className="footer"><a className="footer-brand" href="#top"><span className="brand-mark small-mark"><ScanLine size={16} /></span><strong>RADIOLOGY<span>LAB</span></strong></a><span>{t.footer}</span><a href="#top">{rtl ? "العودة للأعلى ↑" : "Back to top ↑"}</a></footer>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { 
  startVettingProcess, 
  discoverJobsAction, 
  seedPastProposalsAction,
  generateProposalAction
} from "./actions/pitchActions";
import { 
  Briefcase, 
  LayoutDashboard, 
  Settings, 
  Send, 
  FileText, 
  Users, 
  BrainCircuit,
  Search,
  Bell,
  CheckCircle,
  XCircle,
  Sparkles,
  MapPin,
  TrendingUp,
  AlertTriangle,
  HelpCircle,
  Database,
  RefreshCw,
  Zap,
  Maximize2
} from "lucide-react";

export default function Dashboard() {
  const [jobUrl, setJobUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Proposal Engine State
  const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);
  
  // Job Discovery States
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoverQuery, setDiscoverQuery] = useState("React Developer freelance");
  const [discoverLocation, setDiscoverLocation] = useState("Remote");
  const [discoverySuccess, setDiscoverySuccess] = useState(false);

  // Database Seeding State
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  // Selected state for active lead
  const [selectedLeadId, setSelectedLeadId] = useState<Id<"leads"> | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "pitches">("dashboard");

  // Real-time leads subscription
  const leads = useQuery(api.leads.getLeads) || [];
  
  // Find current selected lead
  const activeLead = leads.find((l: any) => l._id === selectedLeadId) || leads[0];

  const handleIntakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobUrl) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const result = await startVettingProcess(jobUrl);
      if (result.success && result.leadId) {
        setSelectedLeadId(result.leadId);
        setJobUrl("");
        setActiveTab("pitches");
      } else {
        setError(result.error || "Failed to process lead");
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDiscoverJobs = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDiscovering(true);
    setDiscoverySuccess(false);
    setError(null);

    try {
      const result = await discoverJobsAction(discoverQuery, discoverLocation);
      if (result.success && result.leads && result.leads.length > 0) {
        setDiscoverySuccess(true);
        setSelectedLeadId(result.leads[0].id);
        setActiveTab("pitches");
      } else {
        setError(result.error || "Failed to discover jobs");
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    setSeedSuccess(false);
    try {
      const res = await seedPastProposalsAction();
      if (res.success) {
        setSeedSuccess(true);
        setTimeout(() => setSeedSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleGenerateProposal = async (leadId: Id<"leads">) => {
    setIsGeneratingProposal(true);
    setError(null);
    try {
      const res = await generateProposalAction(leadId);
      if (!res.success) {
        setError(res.error || "Failed to generate proposal");
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setIsGeneratingProposal(false);
    }
  };

  // Helper to parse stringified dossier
  const getParsedDossier = (dossierStr?: string) => {
    if (!dossierStr) return null;
    try {
      return JSON.parse(dossierStr);
    } catch (e) {
      return null;
    }
  };

  const activeDossier = activeLead ? getParsedDossier(activeLead.clientDossier) : null;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border glass-panel flex flex-col justify-between hidden md:flex m-4 mr-0 z-10 animate-fade-in">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-border">
            <BrainCircuit className="h-8 w-8 text-primary mr-3 animate-pulse" />
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">PitchPilot</span>
          </div>
          <nav className="p-4 space-y-2 mt-4">
            <button 
              onClick={() => setActiveTab("dashboard")} 
              className={`w-full flex items-center px-4 py-3 rounded-lg font-medium transition-all ${activeTab === "dashboard" ? "bg-primary/10 text-primary shadow-inner" : "text-muted-foreground hover:bg-muted/50"}`}
            >
              <LayoutDashboard className="h-5 w-5 mr-3" />
              Dashboard
            </button>
            <button 
              onClick={() => setActiveTab("pitches")} 
              className={`w-full flex items-center px-4 py-3 rounded-lg font-medium transition-all ${activeTab === "pitches" ? "bg-primary/10 text-primary shadow-inner" : "text-muted-foreground hover:bg-muted/50"}`}
            >
              <Briefcase className="h-5 w-5 mr-3" />
              Active Pitches
              {leads.length > 0 && (
                <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-bold">
                  {leads.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Sidebar Seeder Control */}
        <div className="p-4 border-t border-border/50">
          <button 
            onClick={handleSeedDatabase}
            disabled={isSeeding}
            className="w-full flex items-center justify-center py-2.5 px-4 text-xs font-semibold rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-all gap-2 disabled:opacity-50"
          >
            {isSeeding ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : seedSuccess ? (
              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Database className="h-3.5 w-3.5 text-primary" />
            )}
            {seedSuccess ? "Vector DB Seeded!" : "Seed RAG Database"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden m-4 z-10">
        {/* Header */}
        <header className="h-16 glass-panel mb-4 flex items-center justify-between px-6 animate-fade-in delay-100">
          <div className="flex items-center text-sm text-muted-foreground gap-2">
            <span>BDR Agent Suite</span>
            <span>/</span>
            <span className="text-foreground font-medium uppercase tracking-wider text-xs">
              {activeTab}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-primary/20">
              BDR
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto rounded-lg animate-fade-in delay-200">
          
          {/* TAB 1: DASHBOARD & DISCOVERY */}
          {activeTab === "dashboard" && (
            <div className="max-w-4xl mx-auto py-8 px-4">
              <div className="text-center mb-10">
                <h1 className="text-4xl font-extrabold tracking-tight mb-3">
                  Deploy Your <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Autonomous BDR</span>
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  PitchPilot automatically discovers high-intent gigs via SerpAPI, vets lead compatibility, maps decision-makers, and leverages vector RAG to craft personalized campaigns.
                </p>
              </div>

              {/* SerpAPI Discovery Form */}
              <div className="glass-card p-6 mb-8 border border-primary/20 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl"></div>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-lg">Intelligent SerpAPI Job Discovery</h3>
                </div>
                <form onSubmit={handleDiscoverJobs} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-muted-foreground font-semibold uppercase">Search query</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-3.5 h-4.5 w-4.5 text-muted-foreground" />
                      <input 
                        type="text" 
                        value={discoverQuery}
                        onChange={(e) => setDiscoverQuery(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-muted-foreground font-semibold uppercase">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3.5 h-4.5 w-4.5 text-muted-foreground" />
                      <input 
                        type="text" 
                        value={discoverLocation}
                        onChange={(e) => setDiscoverLocation(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        required
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isDiscovering}
                    className="bg-primary hover:bg-primary/95 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-primary/20"
                  >
                    {isDiscovering ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 text-accent" />
                        Discover Hot Leads
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Splitter Text */}
              <div className="flex items-center my-6">
                <div className="flex-1 border-t border-border/50"></div>
                <span className="mx-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Or Manual Intake</span>
                <div className="flex-1 border-t border-border/50"></div>
              </div>

              {/* Intake Form */}
              <form onSubmit={handleIntakeSubmit} className="glass-card p-6 mb-8 flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Briefcase className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input
                    type="url"
                    placeholder="https://www.upwork.com/jobs/..."
                    className="w-full bg-background border border-border rounded-lg py-4 pl-12 pr-4 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-inner"
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isProcessing}
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 px-8 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(109,40,217,0.5)]"
                >
                  {isProcessing ? (
                    <span className="flex items-center">
                      <RefreshCw className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                      Analyzing...
                    </span>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Vet Lead
                    </>
                  )}
                </button>
              </form>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg mb-8 flex items-center">
                  <XCircle className="h-5 w-5 mr-2" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ACTIVE PITCHES & DOSSIERS */}
          {activeTab === "pitches" && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full p-4">
              
              {/* Lead Sidebar List */}
              <div className="lg:col-span-1 glass-card p-4 overflow-auto max-h-[calc(100vh-140px)] flex flex-col gap-3">
                <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-2">Pitches List</h3>
                {leads.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No leads created yet.</p>
                ) : (
                  leads.map((l: any) => (
                    <button
                      key={l._id}
                      onClick={() => setSelectedLeadId(l._id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all flex flex-col gap-1 ${
                        activeLead?._id === l._id 
                          ? 'bg-primary/10 border-primary shadow-sm' 
                          : 'bg-background hover:bg-muted/40 border-border'
                      }`}
                    >
                      <span className="text-xs font-bold text-foreground line-clamp-1">{l.jobTitle || "Job Lead"}</span>
                      <span className="text-[10px] text-muted-foreground font-semibold">{l.company || "Unknown Company"}</span>
                      <div className="flex items-center gap-2 mt-2">
                        {l.fitScore !== undefined && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            l.fitScore >= 70 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {l.fitScore}% Fit
                          </span>
                        )}
                        <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded uppercase tracking-wider text-muted-foreground ml-auto font-bold">
                          {l.status}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Main Lead Detailed View */}
              <div className="lg:col-span-3 overflow-auto max-h-[calc(100vh-140px)] pr-2 flex flex-col gap-6">
                
                {activeLead ? (
                  <>
                    {/* Top Row: Basic Info & Fit Score Card */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Fit Score Strategic Card */}
                      <div className="glass-card p-6 border-l-4 border-l-primary flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Strategic Vetting</h4>
                          <h2 className="font-extrabold text-2xl truncate" title={activeLead.jobTitle}>{activeLead.jobTitle || "Pending Vetting"}</h2>
                          <p className="text-sm text-primary font-semibold">{activeLead.company || "Evaluating..."}</p>
                        </div>
                        <div className="mt-4 flex items-baseline gap-2">
                          <span className="text-5xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            {activeLead.fitScore ?? "--"}%
                          </span>
                          <span className="text-xs text-muted-foreground font-bold">Fit Score</span>
                        </div>
                      </div>

                      {/* Decision Maker Card */}
                      <div className="glass-card p-6 border-l-4 border-l-accent flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2">Mapped Decision Maker</h4>
                          {activeLead.decisionMaker ? (
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center font-bold text-accent">
                                {activeLead.decisionMaker.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-foreground text-sm leading-tight">{activeLead.decisionMaker.name}</p>
                                <p className="text-xs text-muted-foreground">{activeLead.decisionMaker.role}</p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">No specific stakeholder detected.</p>
                          )}
                        </div>
                        {activeLead.decisionMaker?.linkedIn && (
                          <a 
                            href={activeLead.decisionMaker.linkedIn}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-accent hover:underline flex items-center mt-3"
                          >
                            LinkedIn Profile →
                          </a>
                        )}
                      </div>

                      {/* Pitch Status Card */}
                      <div className="glass-card p-6 border-l-4 border-l-muted flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Workflow Status</h4>
                          <span className="inline-block mt-2 bg-muted px-2.5 py-1 rounded text-xs uppercase tracking-wider text-muted-foreground font-extrabold">
                            {activeLead.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground italic mt-4">
                          Job scraped via: {activeLead.source || "manual"}
                        </p>
                      </div>
                    </div>

                    {/* Lead Job Description */}
                    {activeLead.description && (
                      <div className="glass-card p-6">
                        <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-3">Job Description</h3>
                        <p className="text-xs text-foreground leading-relaxed whitespace-pre-line line-clamp-4 hover:line-clamp-none transition-all cursor-pointer">
                          {activeLead.description}
                        </p>
                      </div>
                    )}

                    {/* Day 3 RAG Client Dossier Generation */}
                    <div className="glass-card p-6 border border-primary/20 relative">
                      <div className="absolute top-4 right-4 flex items-center gap-1.5 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                        <Database className="h-3 w-3" />
                        Vector Search Enabled
                      </div>
                      <h3 className="font-extrabold text-lg flex items-center gap-2 mb-4 text-foreground">
                        <BrainCircuit className="h-5 w-5 text-primary" />
                        Synthesized RAG Client Dossier
                      </h3>

                      {activeDossier ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                          
                          {/* Left Column: Pain Points & Research */}
                          <div className="flex flex-col gap-4">
                            <div>
                              <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-1">
                                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                                Core Business Pain Points
                              </h4>
                              <ul className="space-y-1.5">
                                {activeDossier.inferredPainPoints?.map((pain: string, idx: number) => (
                                  <li key={idx} className="text-xs text-foreground bg-background border border-border p-2 rounded flex items-start gap-2">
                                    <span className="text-primary font-bold">{idx + 1}.</span>
                                    {pain}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="text-xs font-bold uppercase text-muted-foreground mb-1.5 flex items-center gap-1">
                                <Sparkles className="h-3.5 w-3.5 text-accent" />
                                Company Research Insights
                              </h4>
                              <p className="text-xs text-muted-foreground bg-background border border-border p-3 rounded leading-relaxed">
                                {activeDossier.companyInsights}
                              </p>
                            </div>
                          </div>

                          {/* Right Column: Strategic Approach & Red Flags */}
                          <div className="flex flex-col gap-4">
                            <div>
                              <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-1">
                                <Zap className="h-3.5 w-3.5 text-primary animate-pulse" />
                                Custom RAG Strategic Approach
                              </h4>
                              <div className="text-xs text-foreground bg-primary/5 border border-primary/20 p-4 rounded leading-relaxed whitespace-pre-line">
                                {activeDossier.strategicApproach}
                              </div>
                            </div>
                            {activeDossier.potentialRedFlags && activeDossier.potentialRedFlags.length > 0 && (
                              <div>
                                <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-1">
                                  <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
                                  Potential Engagement Risks
                                </h4>
                                <ul className="space-y-1">
                                  {activeDossier.potentialRedFlags.map((risk: string, idx: number) => (
                                    <li key={idx} className="text-xs text-yellow-200/90 bg-yellow-500/10 border border-yellow-500/20 p-2 rounded flex items-center gap-2">
                                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                                      {risk}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-center opacity-70">
                          <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin mb-3" />
                          <p className="text-sm font-semibold text-muted-foreground">Synthesizing Dossier...</p>
                          <p className="text-xs text-muted-foreground mt-1 max-w-sm">Generating vector embedding and matching with successful past proposals from the DB.</p>
                        </div>
                      )}
                    </div>

                    {/* Day 4 Proposal Generation Engine & Pricing Deck */}
                    {activeDossier && (
                      <div className="glass-card p-6 border border-accent/20 relative mt-6">
                        <div className="absolute top-4 right-4 flex items-center gap-1.5 text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                          <Sparkles className="h-3 w-3" />
                          Proposal Engine Active
                        </div>
                        <h3 className="font-extrabold text-lg flex items-center gap-2 mb-4 text-foreground">
                          <FileText className="h-5 w-5 text-accent" />
                          AI Pricing Strategy & Proposal Draft
                        </h3>

                        {activeLead.proposalDraft ? (
                          <div className="flex flex-col gap-6 animate-fade-in">
                            
                            {/* Horizontal Pricing Tiers Deck */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {activeLead.pricingTiers?.map((tier: any, idx: number) => (
                                <div 
                                  key={idx} 
                                  className={`glass-card p-5 border flex flex-col justify-between transition-all hover:scale-[1.02] ${
                                    idx === 1 
                                      ? 'border-primary ring-1 ring-primary bg-primary/5' 
                                      : 'border-border'
                                  }`}
                                >
                                  <div>
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{idx === 0 ? "Basic" : idx === 1 ? "Standard" : "Premium"}</span>
                                      {idx === 1 && (
                                        <span className="bg-primary text-white text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider shadow">Most Popular</span>
                                      )}
                                    </div>
                                    <h4 className="font-extrabold text-sm text-foreground line-clamp-1 mb-1">{tier.name}</h4>
                                    <div className="text-3xl font-black text-foreground my-2">{tier.price}</div>
                                    <ul className="space-y-2 mt-4">
                                      {tier.scope?.map((item: string, sIdx: number) => (
                                        <li key={sIdx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                          <CheckCircle className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                                          <span>{item}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Full Markdown Proposal Draft */}
                            <div className="mt-4">
                              <h4 className="text-xs font-bold uppercase text-muted-foreground mb-3 flex items-center gap-1">
                                <FileText className="h-3.5 w-3.5 text-accent" />
                                Generated Custom Proposal Draft (Markdown)
                              </h4>
                              <div className="bg-background border border-border p-5 rounded-lg max-h-96 overflow-auto text-xs text-foreground leading-relaxed whitespace-pre-line font-mono select-text">
                                {activeLead.proposalDraft}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <FileText className="h-10 w-10 text-muted-foreground/60 mb-3" />
                            <h4 className="font-bold text-sm text-foreground mb-1">Generate Tailored Scope & Proposal</h4>
                            <p className="text-xs text-muted-foreground max-w-md mb-6 leading-relaxed">
                              Run the Proposal Generation Engine to compile executive milestone timelines and structure 3 distinct pricing tiers aligned with the client's budget.
                            </p>
                            <button
                              onClick={() => handleGenerateProposal(activeLead._id)}
                              disabled={isGeneratingProposal}
                              className="bg-accent hover:bg-accent/90 text-white font-bold py-2.5 px-6 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-accent/20 animate-pulse hover:animate-none"
                            >
                              {isGeneratingProposal ? (
                                <>
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                  Writing Proposal...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-4 w-4 text-white" />
                                  Generate Bid Proposal & Tiers
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center glass-card">
                    <Briefcase className="h-12 w-12 text-muted-foreground opacity-40 mb-3" />
                    <h3 className="font-bold text-lg text-foreground">Select a Pitch</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                      Choose a lead from the sidebar or discover new jobs in the Dashboard tab to view details.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

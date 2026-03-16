"use client";
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const DashboardContext = createContext();

export function DashboardProvider({ children }) {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [testKey, setTestKey] = useState("sk_test_••••••••••••••••");
  const [liveKey, setLiveKey] = useState("sk_live_••••••••••••••••");
  const [revealedKey, setRevealedKey] = useState(null);
  
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ requests: 0, hitRate: 0 });
  const [showKYB, setShowKYB] = useState(false);
  const [kybSubmitted, setKybSubmitted] = useState(false);
  const [kybForm, setKybForm] = useState({ name: "", rc: "", country: "Nigeria", sector: "Fintech & Payments" });
  
  const [historyPage, setHistoryPage] = useState(0);
  const [historySearch, setHistorySearch] = useState("");
  const [historyFilter, setHistoryFilter] = useState("all");
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const pageSize = 10;

  async function fetchHistory(page = 0, search = "", filter = "all", isAppend = false, organizationId = null) {
    const targetOrgId = organizationId || (user ? (await supabase.from('profiles').select('organization_id').eq('id', user.id).maybeSingle()).data?.organization_id : null);
    if (!targetOrgId) return;

    setHistoryLoading(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .eq('organization_id', targetOrgId)
        .order('timestamp', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (search) query = query.ilike('query_parameters->>search_term', `%${search}%`);
      if (filter === 'flagged') query = query.eq('query_parameters->' + '_results' + '->>match_found', 'true');
      else if (filter === 'clean') query = query.eq('query_parameters->' + '_results' + '->>match_found', 'false');

      const { data, count, error } = await query;
      if (error) throw error;

      setHistory(prev => isAppend ? [...prev, ...(data || [])] : (data || []));
      setHasMoreHistory(count > (page + 1) * pageSize);
    } catch (err) {
      console.error("Fetch history failed:", err);
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    async function initAuth() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        setLoading(false);
        return;
      }
      setUser(currentUser);

      // Basic profile load to stop blocking UI quickly
      const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', currentUser.id).maybeSingle();
      if (profile?.organization_id) {
        setLoading(false); // FINISH MAIN LOADING HERE
        
        const orgId = profile.organization_id;
        
        // Background load everything else
        Promise.all([
          supabase.from('organizations').select('is_verified').eq('id', orgId).maybeSingle(),
          supabase.from('api_keys').select('prefix').eq('organization_id', orgId),
          supabase.auth.getSession(),
          fetchHistory(0, "", "all", false, orgId)
        ]).then(([orgRes, keysRes, sessionRes]) => {
          if (orgRes.data) setIsVerified(orgRes.data.is_verified);
          if (keysRes.data) {
            if (keysRes.data.find(k => k.prefix === 'sk_test')) setTestKey("sk_test_••••••••••••••••");
            if (keysRes.data.find(k => k.prefix === 'sk_live')) setLiveKey("sk_live_••••••••••••••••");
          }
          if (sessionRes.data.session) {
            fetchStats(sessionRes.data.session.access_token);
          }
        });
      } else {
        setLoading(false);
      }
    }
    initAuth();
  }, []);

  async function fetchStats(token) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    try {
      const res = await fetch(`${API_URL}/v1/org/usage`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.error) {
        setStats({
          requests: data.monthly_requests,
          limit: data.monthly_limit,
          hitRate: data.hit_rate,
          tier: data.plan_tier
        });
      }
    } catch (e) {
      console.error("Stats fetch failed:", e);
    } finally {
      setStatsLoading(false);
    }
  }

  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formError, setFormError] = useState("");
  const [screeningLoading, setScreeningLoading] = useState(false);
  const [screeningResult, setScreeningResult] = useState(null);
  const [isRolling, setIsRolling] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  async function handleSearch(searchTerm, options = {}) {
    if (!searchTerm) return;
    setScreeningLoading(true);
    setScreeningResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const payload = { search_term: searchTerm, fuzziness_threshold: options.threshold || 0.8, entity_type: options.type || "individual", country: options.country || null };
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${API_URL}/v1/dashboard/screen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok) {
        setScreeningResult(data);
        const newLog = { id: `tmp-${Date.now()}`, timestamp: new Date().toISOString(), endpoint_accessed: "/dashboard/screen", response_status: 200, query_parameters: { ...payload, _results: data } };
        setHistory(prev => [newLog, ...prev]);
        setStats(prev => ({ ...prev, requests: (prev.requests || 0) + 1 }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setScreeningLoading(false);
    }
  }

  async function handleRollKey() {
    if (!confirm("Are you sure? This will invalidate your key. Continued?")) return;
    setIsRolling(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${API_URL}/v1/org/keys/rotate?is_live=${isLive}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setRevealedKey(data.raw_key);
      if (isLive) setLiveKey(data.raw_key);
      else setTestKey(data.raw_key);
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setIsRolling(false);
    }
  }

  async function handleSubmitKYB() {
    if (!kybForm.name || !kybForm.rc || !selectedFile) {
      setFormError("Please fill all fields.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const fileExt = selectedFile.name.split('.').pop();
      const filePath = `${currentUser.id}/kyb_${Date.now()}.${fileExt}`;
      await supabase.storage.from('documents').upload(filePath, selectedFile);
      const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', currentUser.id).maybeSingle();
      await supabase.from('organizations').update({ name: kybForm.name, registration_number: kybForm.rc, business_type: kybForm.sector, is_verified: false }).eq('id', profile.organization_id);
      setKybSubmitted(true);
    } catch (error) {
      setFormError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const copyToClipboard = () => {
    let keyToCopy = revealedKey || (isLive ? liveKey : testKey);
    
    if (keyToCopy.includes("••••")) {
      if (isLive) {
        alert("Please complete KYB verification to unlock your Live key.");
      } else {
        alert("To view your secret Test key, please click the 'Rotate/Refresh' icon next to the key. For security, keys are only visible when first generated.");
      }
      return;
    }
    navigator.clipboard.writeText(keyToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const value = {
    user, loading, statsLoading, isLive, setIsLive, 
    apiKey: isLive ? liveKey : testKey, 
    history, stats, showKYB, setShowKYB, 
    kybSubmitted, kybForm, setKybForm, 
    isVerified, revealedKey, setRevealedKey,
    historySearch, setHistorySearch, historyFilter, setHistoryFilter,
    hasMoreHistory, historyLoading, fetchHistory,
    screeningLoading, screeningResult, handleSearch,
    handleSignOut, handleRollKey, isRolling,
    handleSubmitKYB, isSubmitting, selectedFile, setSelectedFile,
    formError, setFormError, fileInputRef,
    copied, copyToClipboard,
    loadMoreHistory: () => {
      const next = historyPage + 1;
      setHistoryPage(next);
      fetchHistory(next, historySearch, historyFilter, true);
    }
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}


export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) throw new Error('useDashboard must be used within a DashboardProvider');
  return context;
}

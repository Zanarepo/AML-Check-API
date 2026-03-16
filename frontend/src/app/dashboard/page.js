"use client";
import React, { useState } from 'react';
import { useDashboard } from '@/hooks/useDashboard';
import Navbar from '@/components/dashboard/Navbar';
import PageHeader from '@/components/dashboard/PageHeader';
import ApiKeySection from '@/components/dashboard/ApiKeySection';
import StatsSection from '@/components/dashboard/StatsSection';
import RecentActivity from '@/components/dashboard/RecentActivity';
import KYBModal from '@/components/dashboard/KYBModal';
import MatchDetailsModal from '@/components/dashboard/MatchDetailsModal';
import SearchSection from '@/components/dashboard/SearchSection';

export default function Dashboard() {
  const {
    loading,
    isLive, setIsLive,
    apiKey,
    copied, copyToClipboard,
    showKYB, setShowKYB,
    kybSubmitted,
    kybForm, setKybForm,
    formError, setFormError,
    isSubmitting,
    selectedFile, setSelectedFile,
    fileInputRef,
    handleSubmitKYB,
    handleSignOut,
    handleRollKey,
    isVerified,
    revealedKey, setRevealedKey,
    isRolling,
    stats,
    statsLoading,
    history,
    // Screening Logic
    handleSearch,
    screeningLoading,
    screeningResult,
    // History Advanced
    historySearch, setHistorySearch,
    historyFilter, setHistoryFilter,
    hasMoreHistory,
    historyLoading,
    loadMoreHistory
  } = useDashboard();

  const [selectedLog, setSelectedLog] = useState(null);
  const [showApiKeys, setShowApiKeys] = useState(false);

  if (loading) {
    return (
      <div style={{ 
        background: '#0a0a0c', 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1.5rem'
      }}>
        <div className="animate-spin" style={{ 
          width: '40px', 
          height: '40px', 
          border: '3px solid rgba(99, 102, 241, 0.1)', 
          borderTop: '3px solid var(--primary)', 
          borderRadius: '50%' 
        }}></div>
        <p style={{ color: '#444', fontSize: '0.9rem', fontWeight: '500' }}>Initializing dashboard state...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0c', position: 'relative' }}>
      <Navbar
        isLive={isLive}
        setIsLive={setIsLive}
        handleSignOut={handleSignOut}
      />

      <main className="main-content">
        <PageHeader isLive={isLive} />

        {/* TOP: Usage Statistics (Horizontal Row) */}
        <StatsSection
          stats={stats}
          loading={statsLoading}
          isLive={isLive}
          showKeys={showApiKeys}
          onToggleKeys={() => setShowApiKeys(!showApiKeys)}
        />


        {/* OPTIONAL: API Key Section (Collapsible) */}
        {showApiKeys && (
          <ApiKeySection
            isLive={isLive}
            isVerified={isVerified}
            apiKey={apiKey}
            revealedKey={revealedKey}
            isRolling={isRolling}
            copied={copied}
            copyToClipboard={copyToClipboard}
            handleRollKey={handleRollKey}
            setRevealedKey={setRevealedKey}
            setShowKYB={setShowKYB}
          />
        )}

        {/* MIDDLE: Primary Action - Search Console */}
        <SearchSection
          onSearch={handleSearch}
          loading={screeningLoading}
          result={screeningResult}
        />

        <RecentActivity 
          history={history} 
          onSelectLog={setSelectedLog} 
          search={historySearch}
          setSearch={setHistorySearch}
          filter={historyFilter}
          setFilter={setHistoryFilter}
          hasMore={hasMoreHistory}
          onLoadMore={loadMoreHistory}
          loading={historyLoading}
        />

        <style jsx>{`
          .main-content {
            padding-top: 100px;
            padding-bottom: 3rem;
            max-width: 1600px;
            margin: 0 auto;
            padding-left: 2rem;
            padding-right: 2rem;
          }
          @media (max-width: 768px) {
            .main-content {
              padding-top: 140px; 
              padding-left: 1.2rem;
              padding-right: 1.2rem;
            }
          }
        `}</style>
      </main>

      {showKYB && (
        <KYBModal
          kybSubmitted={kybSubmitted}
          kybForm={kybForm}
          setKybForm={setKybForm}
          formError={formError}
          setFormError={setFormError}
          isSubmitting={isSubmitting}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          fileInputRef={fileInputRef}
          handleSubmitKYB={handleSubmitKYB}
          setShowKYB={setShowKYB}
        />
      )}

      {selectedLog && (
        <MatchDetailsModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
}


import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { BotProvider, useBotContext } from './context/BotContext';
import { useDataIngestion } from './hooks/useDataIngestion'; 
import { BotStatus } from './types';
// Add missing Zap icon import
import { Zap } from 'lucide-react';

// Components
import LoginScreen from './components/LoginScreen';
import AdminDashboard from './components/AdminDashboard';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import TradeHistory from './components/TradeHistory'; 
import LiveExecution from './components/LiveExecution';
import ConnectModal from './components/ConnectModal';
import PaymentModal from './components/PaymentModal';
import MobileNav from './components/MobileNav';
import ControlPanel from './components/ControlPanel';

const IngestionManager: React.FC = () => {
    const { isBrokerConnected, availableAssets } = useBotContext();
    useDataIngestion(isBrokerConnected, availableAssets);
    return null;
};

const DashboardLayout: React.FC<{ 
    isTrialMode: boolean; 
    daysRemaining: number; 
    handleLogout: () => void; 
    isAdmin: boolean;
    setShowAdminPanel: (show: boolean) => void;
}> = ({ isTrialMode, daysRemaining, handleLogout, isAdmin, setShowAdminPanel }) => {
    
    const { 
        broker, connectBroker, isConnectModalOpen, setIsConnectModalOpen, 
        showPaymentModal, pendingInvoice, subscriptionStatus,
        handlePaymentConfirmed, userEmail, systemSettings, wallet,
        status, activeTrades
    } = useBotContext();

    const [activeTab, setActiveTab] = useState('scanner');

    const onConfirmPayment = async () => {
         const success = await handlePaymentConfirmed();
         if (success) setIsConnectModalOpen(false);
    };

    const isBotRunning = status === BotStatus.TRADING || status === BotStatus.ANALYZING;

    return (
        <div className="flex flex-col h-screen bg-grid-pattern text-slate-200 font-sans selection:bg-cyan-500/30 relative overflow-hidden">
            <IngestionManager /> 
            
            <ConnectModal isOpen={isConnectModalOpen} onClose={() => setIsConnectModalOpen(false)} broker={broker} onConnect={connectBroker} />
            
            {(showPaymentModal && pendingInvoice) && (
                <PaymentModal 
                    status={subscriptionStatus}
                    invoice={pendingInvoice}
                    userEmail={userEmail}
                    systemSettings={systemSettings}
                    onPaymentConfirmed={onConfirmPayment}
                    isDemo={wallet.accountType === 'DEMO'}
                />
            )}

            <TopBar 
                isTrialMode={isTrialMode}
                daysRemaining={daysRemaining}
                handleLogout={handleLogout}
                isAdmin={isAdmin}
                onOpenAdmin={() => setShowAdminPanel(true)}
            />

            {/* Layout Desktop vs Mobile - Garantindo rolagem independente ou global */}
            <div className={`flex-1 flex flex-col lg:flex-row relative min-h-0 ${subscriptionStatus === 'BLOCKED' ? 'blur-sm pointer-events-none select-none' : ''}`}>
                
                {/* SIDEBAR (Desktop Only) */}
                <div className="hidden lg:block h-full shrink-0 border-r border-white/5 bg-slate-900/40">
                    <Sidebar isTrialMode={isTrialMode} />
                </div>

                {/* CONTEÚDO DINÂMICO */}
                <div className="flex-1 relative flex flex-col bg-slate-950 overflow-hidden">
                   
                   {/* Mobile Views Switcher */}
                   <div className="flex-1 pb-24 lg:pb-0 overflow-y-auto custom-scrollbar">
                      {/* Aba Scanner (Default Desktop) */}
                      {(activeTab === 'scanner' || window.innerWidth > 1024) && (
                         <div className={`${activeTab !== 'scanner' ? 'hidden lg:block' : ''} h-full w-full p-3 lg:p-4`}>
                            <LiveExecution />
                         </div>
                      )}

                      {/* Aba Operações Mobile */}
                      {activeTab === 'trades' && (
                         <div className="lg:hidden p-4 space-y-4">
                            <h2 className="text-xl font-black text-white uppercase tracking-tighter">Operações Ativas</h2>
                            {activeTrades.length > 0 ? (
                               <LiveExecution />
                            ) : (
                               <div className="h-64 flex flex-col items-center justify-center text-slate-700 opacity-30">
                                  <Zap className="w-12 h-12 mb-2" />
                                  <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma ordem no momento</p>
                               </div>
                            )}
                         </div>
                      )}

                      {/* Aba Histórico Mobile */}
                      {activeTab === 'history' && (
                         <div className="lg:hidden">
                            <TradeHistory />
                         </div>
                      )}

                      {/* Aba Config Mobile */}
                      {activeTab === 'config' && (
                         <div className="lg:hidden p-6 space-y-8 pb-32">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Central de Gestão</h2>
                            <ControlPanel />
                            <div className="p-6 bg-slate-900/50 rounded-3xl border border-white/5">
                               <h3 className="text-xs font-black text-gold-500 uppercase tracking-widest mb-4">Resumo Estratégico</h3>
                               <p className="text-slate-400 text-xs leading-relaxed">O bot está configurado para operar no modo <strong>{systemSettings.riskMode}</strong> com entradas de <strong>{systemSettings.entryPercent}%</strong>.</p>
                            </div>
                         </div>
                      )}
                   </div>
                </div>

                {/* TRADE HISTORY (Desktop Only) */}
                <div className="hidden lg:block h-full shrink-0 bg-slate-950 border-l border-white/5">
                   <TradeHistory />
                </div>
            </div>

            {/* Mobile Bottom Nav */}
            <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} isBotRunning={isBotRunning} />
        </div>
    );
};

const App: React.FC = () => {
  const { 
    isAuthenticated, userEmail, isTrialMode, daysRemaining, userRole, 
    showAdminPanel, setShowAdminPanel, systemSettings, 
    handleLoginSuccess, handleLogout, handleSettingsUpdate 
  } = useAuth();

  if (!isAuthenticated) return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  
  if (userRole === 'ADMIN' && showAdminPanel) {
    return (
       <AdminDashboard 
          onLogout={handleLogout} 
          onUpdateSettings={handleSettingsUpdate}
          onBackToSystem={() => setShowAdminPanel(false)}
       />
    );
  }

  return (
      <BotProvider 
          userEmail={userEmail} 
          isAuthenticated={isAuthenticated} 
          systemSettings={systemSettings}
          onUpdateSettings={handleSettingsUpdate}
      >
          <DashboardLayout 
             isTrialMode={isTrialMode}
             daysRemaining={daysRemaining}
             handleLogout={handleLogout}
             isAdmin={userRole === 'ADMIN'}
             setShowAdminPanel={setShowAdminPanel}
          />
      </BotProvider>
  );
};

export default App;

import React, { useState, useEffect } from 'react';
import AuthModal from './components/AuthModal';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import UserSearch from './components/UserSearch';
import FriendRequests from './components/FriendRequests';
import SecuritySettings from './components/SecuritySettings';

import {
  getCurrentSession,
  clearSession,
  getContacts,
  getFriendRequests,
  subscribeToRealtime
} from './services/storage';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => getCurrentSession());
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'search' | 'requests' | 'security'
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const refreshData = async () => {
    if (!currentUser) return;

    const userContacts = await getContacts(currentUser.id);
    setContacts(userContacts);

    if (!activeContact && userContacts.length > 0 && !isMobile) {
      setActiveContact(userContacts[0]);
    } else if (activeContact) {
      const updatedActive = userContacts.find(c => c.id === activeContact.id);
      if (updatedActive) setActiveContact(updatedActive);
    }

    const requests = await getFriendRequests();
    const pendingIncoming = requests.filter(r => r.toUserId === currentUser.id && r.status === 'pending');
    setPendingRequestsCount(pendingIncoming.length);
  };

  useEffect(() => {
    refreshData();
  }, [currentUser]);

  useEffect(() => {
    const unsubscribe = subscribeToRealtime(() => {
      refreshData();
    });
    return () => unsubscribe();
  }, [currentUser, activeContact]);

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    setActiveContact(null);
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setActiveTab('chats');
  };

  if (!currentUser) {
    return <AuthModal onLoginSuccess={handleLoginSuccess} />;
  }

  // On mobile: show chat view if contact selected & on chats tab, otherwise show sidebar/nav
  const showMobileChatView = isMobile && activeTab === 'chats' && activeContact;

  return (
    <div className="app-container" style={{ display: 'flex', width: '100vw', height: '100vh', height: '100dvh', overflow: 'hidden' }}>
      {(!isMobile || !showMobileChatView) && (
        <Sidebar
          currentUser={currentUser}
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            if (tab !== 'chats') setActiveContact(null);
          }}
          contacts={contacts}
          activeContact={activeContact}
          setActiveContact={(contact) => {
            setActiveContact(contact);
            setActiveTab('chats');
          }}
          pendingRequestsCount={pendingRequestsCount}
          onLogout={handleLogout}
        />
      )}

      {(!isMobile || showMobileChatView || activeTab !== 'chats') && (
        <main className="main-content" style={{ flex: 1, display: 'flex', height: '100vh', height: '100dvh', overflow: 'hidden' }}>
          {activeTab === 'chats' && (
            <ChatArea
              currentUser={currentUser}
              activeContact={activeContact}
              onBackToContacts={isMobile ? () => setActiveContact(null) : undefined}
            />
          )}

          {activeTab === 'search' && (
            <UserSearch
              currentUser={currentUser}
              onRefreshData={refreshData}
            />
          )}

          {activeTab === 'requests' && (
            <FriendRequests
              currentUser={currentUser}
              onRefreshData={refreshData}
              onSelectContact={(contact) => {
                setActiveContact(contact);
                setActiveTab('chats');
              }}
            />
          )}

          {activeTab === 'security' && (
            <SecuritySettings
              currentUser={currentUser}
              onLogout={handleLogout}
              onRefreshUser={() => setCurrentUser(getCurrentSession())}
            />
          )}
        </main>
      )}
    </div>
  );
}

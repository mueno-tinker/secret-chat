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

  // Refresh user data & contacts
  const refreshData = async () => {
    if (!currentUser) return;

    const userContacts = await getContacts(currentUser.id);
    setContacts(userContacts);

    // Auto-select first contact if none selected and contacts exist
    if (!activeContact && userContacts.length > 0) {
      setActiveContact(userContacts[0]);
    } else if (activeContact) {
      // Keep active contact updated if in contact list
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

  // Realtime Broadcast Listener
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

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        contacts={contacts}
        activeContact={activeContact}
        setActiveContact={(contact) => {
          setActiveContact(contact);
          setActiveTab('chats');
        }}
        pendingRequestsCount={pendingRequestsCount}
        onLogout={handleLogout}
      />

      <main style={{ flex: 1, display: 'flex', height: '100vh', overflow: 'hidden' }}>
        {activeTab === 'chats' && (
          <ChatArea
            currentUser={currentUser}
            activeContact={activeContact}
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
    </div>
  );
}

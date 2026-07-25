// Storage and Cross-Tab Realtime Sync Engine for Secret Chat

const USERS_KEY = 'secret_chat_users_v1';
const SESSION_KEY = 'secret_chat_session_v1';
const REQUESTS_KEY = 'secret_chat_requests_v1';
const MESSAGES_KEY = 'secret_chat_messages_v1';

// BroadcastChannel for instant cross-tab updates
const broadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('secret_chat_realtime_channel')
  : null;

const eventListeners = new Set();

if (broadcastChannel) {
  broadcastChannel.onmessage = (event) => {
    eventListeners.forEach(listener => listener(event.data));
  };
}

export function subscribeToRealtime(listener) {
  eventListeners.add(listener);
  return () => eventListeners.delete(listener);
}

export function broadcastEvent(type, payload = {}) {
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type, payload, timestamp: Date.now() });
  }
}

// Generate 16-Digit Secret Code (e.g., 4829-1049-8302-9912)
export function generate16DigitCode() {
  const parts = [];
  for (let i = 0; i < 4; i++) {
    const chunk = Math.floor(1000 + Math.random() * 9000);
    parts.push(chunk);
  }
  return parts.join('-');
}

// Seed Demo Users if empty
function initializeStorage() {
  const existingUsers = localStorage.getItem(USERS_KEY);
  if (!existingUsers) {
    const demoUsers = [
      {
        id: 'usr_demo_cipher99',
        username: 'Cipher99',
        password: 'password123',
        secretCode: '1111-2222-3333-4444',
        createdAt: Date.now() - 86400000 * 2,
        isBot: true,
      },
      {
        id: 'usr_demo_shadowagent',
        username: 'ShadowAgent',
        password: 'password123',
        secretCode: '5555-6666-7777-8888',
        createdAt: Date.now() - 86400000 * 5,
        isBot: true,
      }
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(demoUsers));
  }

  if (!localStorage.getItem(REQUESTS_KEY)) {
    localStorage.setItem(REQUESTS_KEY, JSON.stringify([]));
  }

  if (!localStorage.getItem(MESSAGES_KEY)) {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify([]));
  }
}

initializeStorage();

// User Operations
export function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

export function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function registerUser({ username, password, secretCode }) {
  const users = getUsers();
  const trimmedUsername = username.trim();

  // Check username uniqueness
  const existing = users.find(u => u.username.toLowerCase() === trimmedUsername.toLowerCase());
  if (existing) {
    throw new Error('Username is already taken. Please choose another.');
  }

  const newUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    username: trimmedUsername,
    password: password,
    secretCode: secretCode,
    createdAt: Date.now(),
    isBot: false,
  };

  users.push(newUser);
  saveUsers(users);
  setCurrentSession(newUser);
  broadcastEvent('USER_REGISTERED', { userId: newUser.id });
  return newUser;
}

export function loginUser({ username, password }) {
  const users = getUsers();
  const trimmedUsername = username.trim();
  const user = users.find(u => u.username.toLowerCase() === trimmedUsername.toLowerCase() && u.password === password);
  
  if (!user) {
    throw new Error('Invalid Username or Password.');
  }

  setCurrentSession(user);
  return user;
}

export function recoverPasswordWithSecretCode({ secretCode, newPassword }) {
  const users = getUsers();
  const cleanCode = secretCode.trim();
  const userIndex = users.findIndex(u => u.secretCode === cleanCode);

  if (userIndex === -1) {
    throw new Error('Invalid 16-Digit Secret Security Code.');
  }

  users[userIndex].password = newPassword;
  saveUsers(users);
  broadcastEvent('PASSWORD_CHANGED', { userId: users[userIndex].id });
  return users[userIndex];
}

export function changePasswordWithCode({ userId, currentPassword, secretCode, newPassword }) {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) throw new Error('User not found');
  const user = users[userIndex];

  if (user.password !== currentPassword) {
    throw new Error('Current password is incorrect.');
  }

  if (user.secretCode.trim() !== secretCode.trim()) {
    throw new Error('Invalid 16-Digit Secret Security Code! Action denied.');
  }

  users[userIndex].password = newPassword;
  saveUsers(users);
  setCurrentSession(users[userIndex]);
  broadcastEvent('PASSWORD_CHANGED', { userId });
  return true;
}

export function deleteAccountWithCode({ userId, password, secretCode }) {
  let users = getUsers();
  const user = users.find(u => u.id === userId);

  if (!user) throw new Error('User not found.');
  if (user.password !== password) throw new Error('Password does not match.');
  if (user.secretCode.trim() !== secretCode.trim()) {
    throw new Error('Invalid 16-Digit Secret Security Code! Action denied.');
  }

  // Remove user
  users = users.filter(u => u.id !== userId);
  saveUsers(users);

  // Clean up friend requests & messages
  const requests = getFriendRequests().filter(r => r.fromUserId !== userId && r.toUserId !== userId);
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));

  const messages = getMessages().filter(m => m.senderId !== userId && m.receiverId !== userId);
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));

  clearSession();
  broadcastEvent('ACCOUNT_DELETED', { userId });
  return true;
}

// Session Operations
export function getCurrentSession() {
  try {
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

export function setCurrentSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// Friend Requests
export function getFriendRequests() {
  try {
    return JSON.parse(localStorage.getItem(REQUESTS_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

export function sendFriendRequest({ fromUserId, toUserId }) {
  const requests = getFriendRequests();
  
  // Check if request already exists
  const existing = requests.find(r => 
    (r.fromUserId === fromUserId && r.toUserId === toUserId) ||
    (r.fromUserId === toUserId && r.toUserId === fromUserId)
  );

  if (existing) {
    if (existing.status === 'accepted') {
      throw new Error('You are already secret contacts with this user.');
    }
    if (existing.status === 'pending') {
      throw new Error('Friend request is already pending.');
    }
  }

  const newRequest = {
    id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    fromUserId,
    toUserId,
    status: 'pending',
    createdAt: Date.now(),
  };

  requests.push(newRequest);
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
  broadcastEvent('FRIEND_REQUEST_SENT', newRequest);
  return newRequest;
}

export function respondToFriendRequest({ requestId, status }) {
  const requests = getFriendRequests();
  const reqIndex = requests.findIndex(r => r.id === requestId);

  if (reqIndex === -1) throw new Error('Request not found.');

  requests[reqIndex].status = status; // 'accepted' | 'declined'
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
  
  broadcastEvent('FRIEND_REQUEST_UPDATED', requests[reqIndex]);
  return requests[reqIndex];
}

export function getContacts(userId) {
  const requests = getFriendRequests();
  const users = getUsers();

  const acceptedRequests = requests.filter(r => 
    (r.fromUserId === userId || r.toUserId === userId) && r.status === 'accepted'
  );

  const contactUserIds = acceptedRequests.map(r => 
    r.fromUserId === userId ? r.toUserId : r.fromUserId
  );

  return users.filter(u => contactUserIds.includes(u.id));
}

// Messaging Operations
export function getMessages() {
  try {
    return JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

export function sendMessage({ senderId, receiverId, text, selfDestructIn = null }) {
  const messages = getMessages();
  const newMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    senderId,
    receiverId,
    text,
    timestamp: Date.now(),
    selfDestructIn, // seconds or null
    isSelfDestructed: false,
  };

  messages.push(newMessage);
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  broadcastEvent('NEW_MESSAGE', newMessage);

  // Check if receiving user is a demo Bot -> triggering bot response after delay
  const users = getUsers();
  const receiver = users.find(u => u.id === receiverId);

  if (receiver && receiver.isBot) {
    setTimeout(() => {
      triggerBotReply(receiver, senderId, text);
    }, 1200);
  }

  return newMessage;
}

function triggerBotReply(botUser, targetUserId, userMsgText) {
  const replies = [
    `[ENCRYPTED]: Secret handshake confirmed. Message received loud and clear.`,
    `Agent ${botUser.username} acknowledges your update. Proceed with caution.`,
    `Received. Transferring code sequence now... 🔒`,
    `Copy that. Standard operating protocol is active.`,
    `16-Digit verification code verified. All channels secure.`
  ];
  const randomReply = replies[Math.floor(Math.random() * replies.length)];

  sendMessage({
    senderId: botUser.id,
    receiverId: targetUserId,
    text: randomReply,
  });
}

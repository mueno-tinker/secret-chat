import { supabase, isSupabaseConfigured } from './supabaseClient';

const USERS_KEY = 'secret_chat_users_v1';
const SESSION_KEY = 'secret_chat_session_v1';
const REQUESTS_KEY = 'secret_chat_requests_v1';
const MESSAGES_KEY = 'secret_chat_messages_v1';

// BroadcastChannel for local cross-tab fallback
const broadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('secret_chat_realtime_channel')
  : null;

const eventListeners = new Set();

if (broadcastChannel) {
  broadcastChannel.onmessage = (event) => {
    eventListeners.forEach(listener => listener(event.data));
  };
}

// Supabase Realtime Channel Subscription
if (isSupabaseConfigured && supabase) {
  supabase
    .channel('global_secret_chat')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
      eventListeners.forEach(listener => listener({ type: 'NEW_MESSAGE', payload }));
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests' }, (payload) => {
      eventListeners.forEach(listener => listener({ type: 'FRIEND_REQUEST_UPDATED', payload }));
    })
    .subscribe();
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

export function generate16DigitCode() {
  const parts = [];
  for (let i = 0; i < 4; i++) {
    const chunk = Math.floor(1000 + Math.random() * 9000);
    parts.push(chunk);
  }
  return parts.join('-');
}

// Local Storage Initializer (Fallback when Supabase env variables are not present)
function initializeLocalStorage() {
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
  if (!localStorage.getItem(REQUESTS_KEY)) localStorage.setItem(REQUESTS_KEY, JSON.stringify([]));
  if (!localStorage.getItem(MESSAGES_KEY)) localStorage.setItem(MESSAGES_KEY, JSON.stringify([]));
}

if (!isSupabaseConfigured) {
  initializeLocalStorage();
}

// --- USER OPERATIONS ---
export async function getUsers() {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
      console.error('Error fetching Supabase users:', error);
      return [];
    }
    return (data || []).map(u => ({
      id: u.id,
      username: u.username,
      password: u.password,
      secretCode: u.secret_code,
      isBot: u.is_bot || false,
      createdAt: u.created_at,
    }));
  }

  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

export async function registerUser({ username, password, secretCode }) {
  const trimmedUsername = username.trim();

  if (isSupabaseConfigured && supabase) {
    // Check existing username
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .ilike('username', trimmedUsername)
      .maybeSingle();

    if (existing) {
      throw new Error('Username is already taken. Please choose another.');
    }

    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{
        username: trimmedUsername,
        password: password,
        secret_code: secretCode,
        is_bot: false
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);

    const userObj = {
      id: newUser.id,
      username: newUser.username,
      password: newUser.password,
      secretCode: newUser.secret_code,
      isBot: false,
      createdAt: newUser.created_at
    };

    setCurrentSession(userObj);
    return userObj;
  }

  // Local Storage Fallback
  const users = await getUsers();
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
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  setCurrentSession(newUser);
  broadcastEvent('USER_REGISTERED', { userId: newUser.id });
  return newUser;
}

export async function loginUser({ username, password }) {
  const trimmedUsername = username.trim();

  if (isSupabaseConfigured && supabase) {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .ilike('username', trimmedUsername)
      .eq('password', password)
      .maybeSingle();

    if (error || !user) {
      throw new Error('Invalid Username or Password.');
    }

    const userObj = {
      id: user.id,
      username: user.username,
      password: user.password,
      secretCode: user.secret_code,
      isBot: user.is_bot || false,
      createdAt: user.created_at
    };

    setCurrentSession(userObj);
    return userObj;
  }

  const users = await getUsers();
  const user = users.find(u => u.username.toLowerCase() === trimmedUsername.toLowerCase() && u.password === password);
  
  if (!user) {
    throw new Error('Invalid Username or Password.');
  }

  setCurrentSession(user);
  return user;
}

export async function recoverPasswordWithSecretCode({ secretCode, newPassword }) {
  const cleanCode = secretCode.trim();

  if (isSupabaseConfigured && supabase) {
    const { data: user, error: findErr } = await supabase
      .from('users')
      .select('*')
      .eq('secret_code', cleanCode)
      .maybeSingle();

    if (findErr || !user) {
      throw new Error('Invalid 16-Digit Secret Security Code.');
    }

    const { error: updateErr } = await supabase
      .from('users')
      .update({ password: newPassword })
      .eq('id', user.id);

    if (updateErr) throw new Error(updateErr.message);

    return true;
  }

  const users = await getUsers();
  const userIndex = users.findIndex(u => u.secretCode === cleanCode);

  if (userIndex === -1) {
    throw new Error('Invalid 16-Digit Secret Security Code.');
  }

  users[userIndex].password = newPassword;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  broadcastEvent('PASSWORD_CHANGED', { userId: users[userIndex].id });
  return users[userIndex];
}

export async function changePasswordWithCode({ userId, currentPassword, secretCode, newPassword }) {
  if (isSupabaseConfigured && supabase) {
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (!user) throw new Error('User not found.');
    if (user.password !== currentPassword) throw new Error('Current password is incorrect.');
    if (user.secret_code.trim() !== secretCode.trim()) {
      throw new Error('Invalid 16-Digit Secret Security Code! Action denied.');
    }

    const { error } = await supabase
      .from('users')
      .update({ password: newPassword })
      .eq('id', userId);

    if (error) throw new Error(error.message);

    const updatedUser = { ...user, password: newPassword, secretCode: user.secret_code };
    setCurrentSession(updatedUser);
    return true;
  }

  const users = await getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) throw new Error('User not found.');
  const user = users[userIndex];

  if (user.password !== currentPassword) throw new Error('Current password is incorrect.');
  if (user.secretCode.trim() !== secretCode.trim()) {
    throw new Error('Invalid 16-Digit Secret Security Code! Action denied.');
  }

  users[userIndex].password = newPassword;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  setCurrentSession(users[userIndex]);
  broadcastEvent('PASSWORD_CHANGED', { userId });
  return true;
}

export async function deleteAccountWithCode({ userId, password, secretCode }) {
  if (isSupabaseConfigured && supabase) {
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (!user) throw new Error('User not found.');
    if (user.password !== password) throw new Error('Password does not match.');
    if (user.secret_code.trim() !== secretCode.trim()) {
      throw new Error('Invalid 16-Digit Secret Security Code! Action denied.');
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw new Error(error.message);

    clearSession();
    return true;
  }

  const users = await getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) throw new Error('User not found.');
  if (user.password !== password) throw new Error('Password does not match.');
  if (user.secretCode.trim() !== secretCode.trim()) {
    throw new Error('Invalid 16-Digit Secret Security Code! Action denied.');
  }

  const filteredUsers = users.filter(u => u.id !== userId);
  localStorage.setItem(USERS_KEY, JSON.stringify(filteredUsers));
  clearSession();
  broadcastEvent('ACCOUNT_DELETED', { userId });
  return true;
}

// --- SESSION OPERATIONS ---
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

// --- FRIEND REQUEST OPERATIONS ---
export async function getFriendRequests() {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('friend_requests').select('*');
    if (error) {
      console.error('Error fetching friend requests:', error);
      return [];
    }
    return (data || []).map(r => ({
      id: r.id,
      fromUserId: r.from_user_id,
      toUserId: r.to_user_id,
      status: r.status,
      createdAt: r.created_at
    }));
  }

  try {
    return JSON.parse(localStorage.getItem(REQUESTS_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

export async function sendFriendRequest({ fromUserId, toUserId }) {
  if (isSupabaseConfigured && supabase) {
    const { data: existing } = await supabase
      .from('friend_requests')
      .select('*')
      .or(`and(from_user_id.eq.${fromUserId},to_user_id.eq.${toUserId}),and(from_user_id.eq.${toUserId},to_user_id.eq.${fromUserId})`)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'accepted') {
        throw new Error('You are already secret contacts with this user.');
      }
      if (existing.status === 'pending') {
        throw new Error('Friend request is already pending.');
      }
    }

    const { data, error } = await supabase
      .from('friend_requests')
      .insert([{
        from_user_id: fromUserId,
        to_user_id: toUserId,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      fromUserId: data.from_user_id,
      toUserId: data.to_user_id,
      status: data.status,
      createdAt: data.created_at
    };
  }

  const requests = await getFriendRequests();
  const existing = requests.find(r => 
    (r.fromUserId === fromUserId && r.toUserId === toUserId) ||
    (r.fromUserId === toUserId && r.toUserId === fromUserId)
  );

  if (existing) {
    if (existing.status === 'accepted') throw new Error('You are already secret contacts with this user.');
    if (existing.status === 'pending') throw new Error('Friend request is already pending.');
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

export async function respondToFriendRequest({ requestId, status }) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('friend_requests')
      .update({ status })
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      fromUserId: data.from_user_id,
      toUserId: data.to_user_id,
      status: data.status,
      createdAt: data.created_at
    };
  }

  const requests = await getFriendRequests();
  const reqIndex = requests.findIndex(r => r.id === requestId);
  if (reqIndex === -1) throw new Error('Request not found.');

  requests[reqIndex].status = status;
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
  broadcastEvent('FRIEND_REQUEST_UPDATED', requests[reqIndex]);
  return requests[reqIndex];
}

export async function getContacts(userId) {
  const requests = await getFriendRequests();
  const users = await getUsers();

  const acceptedRequests = requests.filter(r => 
    (r.fromUserId === userId || r.toUserId === userId) && r.status === 'accepted'
  );

  const contactUserIds = acceptedRequests.map(r => 
    r.fromUserId === userId ? r.toUserId : r.fromUserId
  );

  return users.filter(u => contactUserIds.includes(u.id));
}

// --- MESSAGING OPERATIONS ---
export async function getMessages() {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    return (data || []).map(m => ({
      id: m.id,
      senderId: m.sender_id,
      receiverId: m.receiver_id,
      text: m.text,
      timestamp: new Date(m.created_at).getTime(),
      selfDestructIn: m.self_destruct_in,
      isSelfDestructed: m.is_self_destructed || false
    }));
  }

  try {
    return JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

export async function sendMessage({ senderId, receiverId, text, selfDestructIn = null }) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        sender_id: senderId,
        receiver_id: receiverId,
        text,
        self_destruct_in: selfDestructIn
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);

    const msgObj = {
      id: data.id,
      senderId: data.sender_id,
      receiverId: data.receiver_id,
      text: data.text,
      timestamp: new Date(data.created_at).getTime(),
      selfDestructIn: data.self_destruct_in,
      isSelfDestructed: false
    };

    return msgObj;
  }

  const messages = await getMessages();
  const newMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    senderId,
    receiverId,
    text,
    timestamp: Date.now(),
    selfDestructIn,
    isSelfDestructed: false,
  };

  messages.push(newMessage);
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  broadcastEvent('NEW_MESSAGE', newMessage);

  const users = await getUsers();
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

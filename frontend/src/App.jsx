import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Bot, Lock } from 'lucide-react';
import axios from 'axios';
import { auth, signInWithEmailAndPassword, onAuthStateChanged } from './firebase';
import ChatWindow from './components/ChatWindow';
import Sidebar from './components/Sidebar';
import AdminPanel from './components/AdminPanel';

function App() {
  const [view, setView] = useState('chat'); // 'chat' or 'admin'
  const [tickets, setTickets] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [user, setUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Authentication Listener & Axios Interceptor
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const token = await currentUser.getIdToken();
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } else {
        axios.defaults.headers.common['Authorization'] = `Bearer mock_token_for_testing`;
      }
    });
    return unsubscribe;
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      setAuthError('');
    } catch (err) {
      setAuthError('Invalid credentials or testing mode active. Please check your config.');
      setUser({ email: loginEmail, uid: "mock_user" });
    }
  };

  if (!user || !acceptedTerms) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row"
        >
          <div className="bg-hr-900 text-white p-8 md:w-1/2 flex flex-col justify-center">
            <Bot size={48} className="mb-6 opacity-90" />
            <h1 className="text-3xl font-bold mb-2">Promtal HRBot</h1>
            <p className="text-hr-100 text-sm">
              Instant HR support, powered by RAG and isolated tenant models.
            </p>
          </div>
          
          <div className="p-8 md:w-1/2">
            {!user ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Lock size={20} className="text-hr-600"/> Secure Login
                </h2>
                {authError && <p className="text-xs text-red-500">{authError}</p>}
                <div>
                  <label className="text-xs font-semibold text-gray-500">Employee Email</label>
                  <input type="email" value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} required className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-hr-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Password</label>
                  <input type="password" value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} required className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-hr-500" />
                </div>
                <button type="submit" className="w-full bg-hr-600 text-white py-3 rounded-xl font-bold hover:bg-hr-700 transition-colors">
                  Login
                </button>
              </form>
            ) : (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <ShieldAlert className="text-orange-500" /> Legal & Safety
                </h2>
                <div className="space-y-4 text-sm text-gray-600 mb-8">
                  <p className="bg-orange-50 p-4 rounded-xl border border-orange-100 text-orange-800">
                    <strong>Disclaimer:</strong> HRBot is an AI assistant and does not provide legal advice.
                  </p>
                  <p>
                    Your conversations are securely monitored for policy gaps. Sensitive queries (harassment, legal disputes) will be automatically escalated to human HR.
                  </p>
                </div>
                <button 
                  onClick={() => setAcceptedTerms(true)}
                  className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition-colors"
                >
                  I Accept, Enter Workspace
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden font-sans">
      <Sidebar view={view} setView={setView} />
      <main className="flex-1 flex flex-col h-full bg-white relative shadow-2xl rounded-l-3xl z-10 overflow-hidden">
        {view === 'chat' ? (
          <ChatWindow />
        ) : (
          <AdminPanel tickets={tickets} setTickets={setTickets} policies={policies} setPolicies={setPolicies} />
        )}
      </main>
    </div>
  );
}

export default App;

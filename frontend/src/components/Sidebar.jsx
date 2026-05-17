import { MessageSquare, Shield, Users, LogOut } from 'lucide-react';

export default function Sidebar({ view, setView }) {
  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col justify-between py-6 px-4">
      <div>
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="bg-hr-500 p-2 rounded-lg">
            <Users size={24} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight">Promtal HR</h1>
            <p className="text-xs text-gray-400">Helpdesk Assistant</p>
          </div>
        </div>

        <nav className="space-y-2">
          <button
            onClick={() => setView('chat')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              view === 'chat' ? 'bg-hr-600 text-white shadow-lg' : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <MessageSquare size={20} />
            <span className="font-medium">Chat Support</span>
          </button>
          
          <button
            onClick={() => setView('admin')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              view === 'admin' ? 'bg-hr-600 text-white shadow-lg' : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <Shield size={20} />
            <span className="font-medium">Admin Dashboard</span>
          </button>
        </nav>
      </div>

      <div className="px-4">
        <button className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

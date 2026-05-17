import { Upload, FileText, AlertCircle, CheckCircle2, Clock, Loader2, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function AdminPanel({ policies }) {
  const [activeTab, setActiveTab] = useState('tickets');
  const [tickets, setTickets] = useState([]);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.6);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const fileInputRef = useRef(null);

  // Fetch tickets & config
  useEffect(() => {
    const fetchData = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        if (activeTab === 'tickets') {
          const res = await axios.get(`${baseUrl}/tickets`);
          setTickets(res.data);
        } else if (activeTab === 'settings') {
          const res = await axios.get(`${baseUrl}/config`);
          setConfidenceThreshold(res.data.confidence_threshold);
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
      }
    };
    fetchData();
  }, [activeTab]);

  const handleConfigUpdate = async (val) => {
    setConfidenceThreshold(val);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      await axios.post(`${baseUrl}/config`, { confidence_threshold: parseFloat(val) });
    } catch(err) {
      console.error(err);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await axios.post(`${baseUrl}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setUploadStatus({ type: 'success', msg: `Successfully indexed ${res.data.chunks_indexed} chunks.` });
    } catch (err) {
      setUploadStatus({ type: 'error', msg: "Failed to upload document." });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative overflow-y-auto p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Admin Dashboard</h2>
        <p className="text-gray-500 mt-2">Manage policies and employee escalations.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-gray-100 pb-4">
        <button 
          onClick={() => setActiveTab('tickets')}
          className={`font-semibold text-lg pb-2 border-b-2 transition-colors ${activeTab === 'tickets' ? 'border-hr-600 text-hr-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          Escalation Queue
        </button>
        <button 
          onClick={() => setActiveTab('policies')}
          className={`font-semibold text-lg pb-2 border-b-2 transition-colors ${activeTab === 'policies' ? 'border-hr-600 text-hr-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          Policy Knowledge Base
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`font-semibold text-lg pb-2 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'settings' ? 'border-hr-600 text-hr-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          <Settings size={20} /> Settings
        </button>
      </div>

      {activeTab === 'tickets' ? (
        <div className="space-y-4">
          {tickets.length === 0 ? (
            <div className="text-gray-500 text-center py-10">No escalation tickets found.</div>
          ) : (
            tickets.map((ticket) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={ticket.id} 
                className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow"
              >
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-bold text-gray-400">{ticket.id}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    ticket.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {ticket.priority.toUpperCase()}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    ticket.topic === 'POLICY_GAP' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {ticket.topic === 'POLICY_GAP' ? '🚨 POLICY GAP' : ticket.topic}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">{ticket.description || ticket.desc}</h3>
                <p className="text-sm text-gray-500 mt-1">Requested by: {ticket.employee}</p>
              </div>
              <div className="flex items-center gap-4">
                {ticket.status === 'open' ? (
                  <span className="flex items-center gap-2 text-yellow-600 bg-yellow-50 px-4 py-2 rounded-xl text-sm font-medium">
                    <Clock size={16} /> Open
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-xl text-sm font-medium">
                    <CheckCircle2 size={16} /> Resolved
                  </span>
                )}
                <button className="text-hr-600 font-semibold hover:text-hr-700 transition-colors">
                  View Details
                </button>
              </div>
            </motion.div>
            ))
          )}
        </div>
      ) : activeTab === 'policies' ? (
        <div className="space-y-8">
          {/* Upload Box */}
          <div onClick={handleUploadClick} className="border-2 border-dashed border-gray-300 rounded-3xl p-12 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative overflow-hidden">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept=".pdf,.docx" 
            />
            {isUploading ? (
              <div className="flex flex-col items-center">
                <Loader2 size={40} className="animate-spin text-hr-500 mb-4" />
                <h3 className="text-xl font-bold text-gray-800">Processing Document...</h3>
                <p className="text-gray-500 mt-2 text-center max-w-md">Extracting text, generating embeddings, and storing in vector DB.</p>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                  <Upload size={28} className="text-hr-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Upload New Policy Document</h3>
                <p className="text-gray-500 mt-2 text-center max-w-md">Drag and drop PDF or DOCX files here, or click to browse. The document will be indexed and available to HRBot instantly.</p>
              </>
            )}
          </div>

          {uploadStatus && (
            <div className={`p-4 rounded-xl ${uploadStatus.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {uploadStatus.msg}
            </div>
          )}

          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Active Knowledge Base</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'Company_Leave_Policy_2024.pdf', date: 'Oct 12, 2023', chunks: 142 },
                { name: 'Employee_Code_of_Conduct.pdf', date: 'Jan 5, 2024', chunks: 85 }
              ].map((doc, idx) => (
                <div key={idx} className="p-5 rounded-2xl border border-gray-200 flex items-start gap-4 bg-white">
                  <div className="bg-blue-50 p-3 rounded-xl">
                    <FileText size={24} className="text-blue-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 truncate">{doc.name}</h4>
                    <p className="text-sm text-gray-500 mt-1">Uploaded: {doc.date}</p>
                    <p className="text-xs text-hr-600 font-medium mt-2">{doc.chunks} embeddings generated</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8 max-w-2xl">
          <h3 className="text-xl font-bold text-gray-800 mb-2">Bot Settings</h3>
          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
            <h4 className="font-semibold text-gray-800 mb-2">Confidence Threshold Tuning</h4>
            <p className="text-sm text-gray-500 mb-6">
              Adjust how confident HRBot needs to be before it answers a query. 
              If the confidence score is below this threshold, the query will be escalated to a human.
            </p>
            <div className="flex items-center gap-6">
              <input 
                type="range" 
                min="0.1" max="0.9" step="0.1" 
                value={confidenceThreshold}
                onChange={(e) => handleConfigUpdate(e.target.value)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-hr-600"
              />
              <span className="font-bold text-hr-600 text-xl">{confidenceThreshold}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>Escalate Everything</span>
              <span>Answer Everything</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

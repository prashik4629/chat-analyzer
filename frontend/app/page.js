'use client';
import { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function Home() {
  const [file, setFile] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return alert('Please select a file!');
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('https://prashik4629-chat-analyzer-backend.hf.space/upload', {
      method: 'POST',
      body: formData,
    });
    const result = await res.json();
    setData(result);
    setLoading(false);
  };

  const senderEntries = data?.messages_per_sender ? Object.entries(data.messages_per_sender) : [];
  const topWords = data?.top_words ? Object.entries(data.top_words).map(([word, count]) => ({ word, count })) : [];
  const hourlyData = data?.hourly_activity ? Object.entries(data.hourly_activity).map(([hour, count]) => ({ hour: hour + ':00', count })) : [];
  const mostActive = senderEntries.length > 0 ? senderEntries.sort((a, b) => b[1] - a[1])[0][0] : 'N/A';
  const COLORS = ['#A78BFA', '#60A5FA', '#34D399', '#FBBF24', '#F87171', '#C084FC', '#22D3EE', '#FCD34D', '#FB7185', '#6EE7B7'];

  return (
    <main className="min-h-screen bg-[#0A0A0F] text-white">

      {/* Header */}
      <div className="border-b border-white/5 px-8 py-4 flex items-center justify-between backdrop-blur-sm sticky top-0 z-10 bg-[#0A0A0F]/80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-sm">💬</div>
          <span className="font-semibold text-white/90">ChatAnalyzer</span>
        </div>
        <span className="text-xs text-white/30">AI-Powered WhatsApp Analytics</span>
      </div>

      {/* Hero */}
      {!data && (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-3xl mb-6 shadow-lg shadow-violet-500/20">💬</div>
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent">
            Understand your chats<br />like never before
          </h1>
          <p className="text-white/40 text-center mb-10 max-w-md">Upload any WhatsApp conversation and get deep AI-powered insights about communication patterns, sentiment, and relationship dynamics.</p>

          <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-6">
            <label className="block mb-4 cursor-pointer">
              <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-violet-500/50 transition-all">
                <p className="text-white/60 text-sm">{file ? file.name : 'Click to select WhatsApp chat .txt file'}</p>
              </div>
              <input type="file" accept=".txt" onChange={(e) => setFile(e.target.files[0])} className="hidden" />
            </label>
            <button
              onClick={handleUpload}
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Analyzing...
                </span>
              ) : 'Analyze Chat →'}
            </button>
          </div>
        </div>
      )}

      {/* Dashboard */}
      {data && (
        <div className="px-4 md:px-8 py-8 max-w-6xl mx-auto">

          {/* Upload another */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold">Analysis Results</h2>
              <p className="text-white/40 text-sm mt-1">Based on {data.total_messages?.toLocaleString()} messages</p>
            </div>
            <button
              onClick={() => { setData(null); setFile(null); }}
              className="text-sm px-4 py-2 rounded-lg border border-white/10 hover:border-white/20 transition-all text-white/60"
            >
              New Analysis
            </button>
          </div>

          {/* Top Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Messages', value: data.total_messages?.toLocaleString(), color: 'from-violet-500/10 to-violet-500/5', border: 'border-violet-500/20' },
              { label: 'Participants', value: data.senders?.length, color: 'from-blue-500/10 to-blue-500/5', border: 'border-blue-500/20' },
              { label: 'Most Active', value: mostActive?.split(' ')[0], color: 'from-amber-500/10 to-amber-500/5', border: 'border-amber-500/20' },
              { label: 'Compatibility', value: data.compatibility_score ? `${data.compatibility_score}%` : 'Group', color: 'from-pink-500/10 to-pink-500/5', border: 'border-pink-500/20' },
            ].map((stat, i) => (
              <div key={i} className={`bg-gradient-to-br ${stat.color} border ${stat.border} rounded-2xl p-5`}>
                <div className="text-2xl font-bold truncate">{stat.value}</div>
                <div className="text-white/40 text-xs mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* AI Summary */}
          {data.ai_summary && (
            <div className="bg-gradient-to-br from-violet-500/10 to-blue-500/5 border border-violet-500/20 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-semibold text-white/80">AI Summary</span>
              </div>
              <p className="text-white/70 leading-relaxed text-sm">{data.ai_summary}</p>
            </div>
          )}

          {/* Sentiment */}
          {data.sentiment && (
            <div className="bg-white/3 border border-white/8 rounded-2xl p-6 mb-6">
              <h3 className="font-semibold text-white/80 mb-4">Sentiment Analysis</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Positive', value: data.sentiment.positive, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                  { label: 'Neutral', value: data.sentiment.neutral, color: 'text-white/60', bg: 'bg-white/5 border-white/10' },
                  { label: 'Negative', value: data.sentiment.negative, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
                ].map((s, i) => (
                  <div key={i} className={`${s.bg} border rounded-xl p-4 text-center`}>
                    <div className={`text-3xl font-bold ${s.color}`}>{s.value}%</div>
                    <div className="text-white/40 text-xs mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Messages + Reply Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
              <h3 className="font-semibold text-white/80 mb-4">Messages per Person</h3>
              {senderEntries.map(([sender, count], i) => (
                <div key={sender} className="mb-4">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-sm text-white/70 truncate max-w-[60%]">{sender}</span>
                    <span className="text-sm font-semibold" style={{ color: COLORS[i % COLORS.length] }}>{count}</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${(count / data.total_messages) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              ))}
            </div>

            {data.avg_reply_time && (
              <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
                <h3 className="font-semibold text-white/80 mb-4">Average Reply Time</h3>
                <div className="space-y-3">
                  {Object.entries(data.avg_reply_time).map(([sender, time], i) => (
                    <div key={sender} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                      <span className="text-sm text-white/70 truncate max-w-[60%]">{sender}</span>
                      <span className="font-bold text-sm" style={{ color: COLORS[i % COLORS.length] }}>{time} min</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Pie + Starter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
              <h3 className="font-semibold text-white/80 mb-4">Message Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={senderEntries.map(([name, value]) => ({ name, value }))} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={3}>
                    {senderEntries.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {data.conversation_starter && (
              <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
                <h3 className="font-semibold text-white/80 mb-4">Conversation Starter</h3>
                <div className="space-y-3">
                  {Object.entries(data.conversation_starter).sort((a, b) => b[1] - a[1]).map(([sender, count], i) => (
                    <div key={sender} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                      <span className="text-sm text-white/70 truncate max-w-[60%]">{sender}</span>
                      <span className="font-bold text-sm" style={{ color: COLORS[i % COLORS.length] }}>{count} times</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Top Words */}
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6 mb-6">
            <h3 className="font-semibold text-white/80 mb-4">Top Words Used</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topWords} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="word" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} />
                <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Bar dataKey="count" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Active Hours */}
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
            <h3 className="font-semibold text-white/80 mb-4">Active Hours</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={hourlyData} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="hour" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
                <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>
      )}
    </main>
  );
}
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

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-4xl font-bold text-center mb-2 text-purple-400">Chat Analyzer</h1>
      <p className="text-center text-gray-400 mb-8">Upload your WhatsApp chat and get insights</p>

      <div className="max-w-xl mx-auto bg-gray-900 rounded-2xl p-6 mb-8">
        <input type="file" accept=".txt" onChange={(e) => setFile(e.target.files[0])} className="w-full mb-4 text-gray-300" />
        <button onClick={handleUpload} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition">
          {loading ? 'Analyzing...' : 'Analyze Chat'}
        </button>
      </div>

      {data && (
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

          {/* Stats Cards */}
          <div className="bg-gray-900 rounded-2xl p-6 text-center">
            <p className="text-gray-400 mb-2">Total Messages</p>
            <p className="text-5xl font-bold text-purple-400">{data.total_messages}</p>
          </div>
          <div className="bg-gray-900 rounded-2xl p-6 text-center">
            <p className="text-gray-400 mb-2">Participants</p>
            <p className="text-5xl font-bold text-blue-400">{data.senders?.length ?? 0}</p>
          </div>
          <div className="bg-gray-900 rounded-2xl p-6 text-center">
            <p className="text-gray-400 mb-2">Most Active</p>
            <p className="text-2xl font-bold text-green-400">{mostActive}</p>
          </div>

          {/* Compatibility Score */}
          {data.compatibility_score !== undefined && (
            <div className="bg-gray-900 rounded-2xl p-6 md:col-span-3 text-center">
              <h2 className="text-xl font-bold mb-4 text-gray-200">Compatibility Score</h2>
              <div className="flex items-center justify-center gap-6">
                <div className="relative w-40 h-40">
                  <svg viewBox="0 0 36 36" className="w-40 h-40 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#374151" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#a855f7" strokeWidth="3"
                      strokeDasharray={`${data.compatibility_score} ${100 - data.compatibility_score}`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-bold text-purple-400">{data.compatibility_score}%</span>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-gray-400 text-sm mb-1">Based on:</p>
                  <p className="text-gray-300 text-sm">✅ Message balance</p>
                  <p className="text-gray-300 text-sm">✅ Positivity score</p>
                  <p className="text-gray-300 text-sm">✅ Reply time balance</p>
                  <p className="text-gray-300 text-sm">✅ Toxicity penalty</p>
                </div>
              </div>
            </div>
          )}

          {/* AI Summary */}
{data.ai_summary && (
  <div className="bg-gray-900 rounded-2xl p-6 md:col-span-3">
    <h2 className="text-xl font-bold mb-4 text-gray-200">AI Summary</h2>
    <div className="bg-gray-800 rounded-xl p-6 text-gray-300 leading-relaxed whitespace-pre-wrap">
      {data.ai_summary}
    </div>
  </div>
)}
          


          {/* Messages per Person */}
          <div className="bg-gray-900 rounded-2xl p-6 md:col-span-3">
            <h2 className="text-xl font-bold mb-4 text-gray-200">Messages per Person</h2>
            {senderEntries.map(([sender, count]) => (
              <div key={sender} className="mb-3">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-300">{sender}</span>
                  <span className="text-purple-400 font-bold">{count}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div className="bg-purple-500 h-3 rounded-full" style={{ width: `${(count / data.total_messages) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Reply Time */}
          {data.avg_reply_time && (
            <div className="bg-gray-900 rounded-2xl p-6 md:col-span-3">
              <h2 className="text-xl font-bold mb-4 text-gray-200">Average Reply Time</h2>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(data.avg_reply_time).map(([sender, time], i) => (
                  <div key={sender} className="bg-gray-800 rounded-xl p-4 text-center">
                    <p className="text-gray-400 mb-1 text-sm">{sender}</p>
                    <p className={`text-3xl font-bold ${i === 0 ? 'text-blue-400' : 'text-purple-400'}`}>{time} min</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conversation Starter */}
          {data.conversation_starter && (
            <div className="bg-gray-900 rounded-2xl p-6 md:col-span-3">
              <h2 className="text-xl font-bold mb-4 text-gray-200">Conversation Starter</h2>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(data.conversation_starter).map(([sender, count], i) => (
                  <div key={sender} className="bg-gray-800 rounded-xl p-4 text-center">
                    <p className="text-gray-400 mb-1 text-sm">{sender}</p>
                    <p className={`text-3xl font-bold ${i === 0 ? 'text-green-400' : 'text-yellow-400'}`}>{count} times</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pie Chart */}
          <div className="bg-gray-900 rounded-2xl p-6 md:col-span-3">
            <h2 className="text-xl font-bold mb-4 text-gray-200">Message Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={senderEntries.map(([name, value]) => ({ name, value }))} cx="50%" cy="50%" outerRadius={100} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {senderEntries.map((_, index) => (
                    <Cell key={index} fill={['#a855f7', '#3b82f6', '#22c55e', '#f59e0b'][index % 4]} />
                  ))}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top Words */}
          <div className="bg-gray-900 rounded-2xl p-6 md:col-span-3">
            <h2 className="text-xl font-bold mb-4 text-gray-200">Top Words Used</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topWords}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="word" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
                <Bar dataKey="count" fill="#a855f7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Active Hours */}
          <div className="bg-gray-900 rounded-2xl p-6 md:col-span-3">
            <h2 className="text-xl font-bold mb-4 text-gray-200">Active Hours</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="hour" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Sentiment */}
          {data.sentiment && (
            <div className="bg-gray-900 rounded-2xl p-6 md:col-span-3">
              <h2 className="text-xl font-bold mb-6 text-gray-200">Sentiment Analysis</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-900/30 rounded-xl p-4 text-center border border-green-700">
                  <p className="text-green-400 text-4xl font-bold mb-1">{data.sentiment.positive}%</p>
                  <p className="text-gray-400">Positive 😊</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-4 text-center border border-gray-600">
                  <p className="text-gray-300 text-4xl font-bold mb-1">{data.sentiment.neutral}%</p>
                  <p className="text-gray-400">Neutral 😐</p>
                </div>
                <div className="bg-red-900/30 rounded-xl p-4 text-center border border-red-700">
                  <p className="text-red-400 text-4xl font-bold mb-1">{data.sentiment.negative}%</p>
                  <p className="text-gray-400">Negative 😢</p>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </main>
  );
}
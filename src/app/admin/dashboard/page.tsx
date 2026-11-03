'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface ChatRecord {
  id: number;
  user_message: string;
  assistant_message: string;
  message_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  created_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [records, setRecords] = useState<ChatRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<ChatRecord | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '15',
        ...(search ? { search } : {}),
      });
      const res = await fetch(`/api/admin/history?${params}`);
      if (res.status === 401) {
        router.push('/admin');
        return;
      }
      const data = await res.json();
      setRecords(data.data || []);
      setPagination(data.pagination);
    } catch {
      console.error('Failed to fetch history');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, router]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleLogout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' });
    router.push('/admin');
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/admin/export');
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-history-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Gagal mengexport data');
    } finally {
      setExporting(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setCurrentPage(1);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const truncate = (text: string, max = 80) =>
    text.length > max ? text.slice(0, max) + '...' : text;

  return (
    <div className="h-screen overflow-y-auto bg-slate-950 text-slate-100">
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/icons/icon-72x72.png"
              alt=""
              width={32}
              height={32}
              className="rounded-lg"
            />
            <div>
              <span className="font-bold text-white text-sm">Ferdii-AI-Asissten</span>
              <span className="text-xs text-teal-300 ml-2">Admin Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-lg transition-colors disabled:opacity-50"
            >
              <i className={`fas ${exporting ? 'fa-spinner animate-spin' : 'fa-download'}`} />
              <span>{exporting ? 'Mengexport...' : 'Export JSON'}</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg transition-colors"
            >
              <i className="fas fa-right-from-bracket" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 pt-20 pb-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <p className="text-xs text-slate-400 mb-1">Total Chat</p>
            <p className="text-2xl font-bold text-white">{pagination?.total ?? '—'}</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <p className="text-xs text-slate-400 mb-1">Halaman</p>
            <p className="text-2xl font-bold text-white">
              {pagination ? `${pagination.page}/${pagination.totalPages}` : '—'}
            </p>
          </div>
          <div className="col-span-2 md:col-span-1 bg-teal-900/20 border border-teal-700/30 rounded-xl p-4">
            <p className="text-xs text-teal-300 mb-1">Status</p>
            <p className="text-sm font-semibold text-teal-200 flex items-center gap-2">
              <i className="fas fa-circle text-emerald-400 text-xs" />
              Database Terhubung
            </p>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari pesan pengguna atau AI..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-teal-700 hover:bg-teal-600 text-white text-sm rounded-lg transition-colors"
          >
            Cari
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setSearchInput(''); setCurrentPage(1); }}
              className="px-3 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors"
            >
              <i className="fas fa-xmark" />
            </button>
          )}
        </form>

        {/* Table */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <i className="fas fa-spinner animate-spin text-2xl text-teal-300 mb-3" />
                <p className="text-slate-400 text-sm">Memuat data...</p>
              </div>
            </div>
          ) : records.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <i className="fas fa-inbox text-3xl text-slate-600 mb-3" />
                <p className="text-slate-500">Belum ada data chat</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/50">
                    <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium w-12">#</th>
                    <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Pesan User</th>
                    <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium hidden md:table-cell">Respons AI</th>
                    <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium hidden lg:table-cell">Tokens</th>
                    <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Waktu</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {records.map((record) => (
                    <tr
                      key={record.id}
                      className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedRecord(record)}
                    >
                      <td className="px-4 py-3 text-slate-500 text-xs">{record.id}</td>
                      <td className="px-4 py-3">
                        <p className="text-slate-200 text-xs leading-relaxed">
                          {truncate(record.user_message)}
                        </p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-slate-400 text-xs leading-relaxed">
                          {truncate(record.assistant_message)}
                        </p>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="bg-slate-700 text-slate-200 text-xs px-2 py-0.5 rounded-full">
                          {record.total_tokens} tok
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                        {formatDate(record.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <i className="fas fa-chevron-right text-slate-600 text-xs" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-slate-500">
              Menampilkan {((pagination.page - 1) * pagination.limit) + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} data
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg disabled:opacity-40 transition-colors"
              >
                <i className="fas fa-chevron-left" />
              </button>
              <span className="px-3 py-1.5 text-xs text-slate-400">
                {currentPage} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage === pagination.totalPages}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg disabled:opacity-40 transition-colors"
              >
                <i className="fas fa-chevron-right" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {selectedRecord && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div>
                <h3 className="font-semibold text-white">Detail Chat #{selectedRecord.id}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{formatDate(selectedRecord.created_at)}</p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-700 text-slate-400 transition-colors"
              >
                <i className="fas fa-xmark" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Token info */}
              <div className="flex gap-3">
                <div className="flex-1 bg-slate-800/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-400">Pesan</p>
                  <p className="text-lg font-bold text-white">{selectedRecord.message_tokens}</p>
                </div>
                <div className="flex-1 bg-slate-800/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-400">Respons</p>
                  <p className="text-lg font-bold text-white">{selectedRecord.completion_tokens}</p>
                </div>
                <div className="flex-1 bg-teal-900/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-teal-300">Total Tokens</p>
                  <p className="text-lg font-bold text-teal-200">{selectedRecord.total_tokens}</p>
                </div>
              </div>

              {/* User message */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center">
                    <i className="fas fa-user text-xs text-slate-300" />
                  </div>
                  <span className="text-xs font-medium text-slate-300">Pengguna</span>
                </div>
                <div className="bg-slate-800 rounded-xl p-4">
                  <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {selectedRecord.user_message}
                  </p>
                </div>
              </div>

              {/* Assistant message */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-teal-700 rounded-full flex items-center justify-center">
                    <i className="fas fa-robot text-xs text-white" />
                  </div>
                  <span className="text-xs font-medium text-teal-300">Ferdii-AI-Asissten</span>
                </div>
                <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4">
                  <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {selectedRecord.assistant_message}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

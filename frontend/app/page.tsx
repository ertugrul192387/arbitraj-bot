"use client";

import { useState, useEffect } from "react";

interface CoinData {
  symbol: string;
  binance_fiyat: number;
  gateio_fiyat: number;
  fark_yuzde: number;
  ucuz_borsa: string;
  pahali_borsa: string;
  arbitraj_firsati: boolean;
}

interface ApiResponse {
  firsatlar: CoinData[];
  tum_coinler: CoinData[];
  guncelleme_zamani: string;
}

export default function Dashboard() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedView, setSelectedView] = useState<"all" | "opportunities">("all");

  const fetchData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const res = await fetch(`${apiUrl}/coins`);
      if (!res.ok) throw new Error("API hatası");
      const json = await res.json();
      setData(json);
      setError(null);
    } catch {
      setError("Veri alınamadı. Backend çalışıyor mu?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return "$" + price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else if (price >= 1) {
      return "$" + price.toFixed(4);
    } else if (price >= 0.0001) {
      return "$" + price.toFixed(6);
    } else {
      return "$" + price.toFixed(8);
    }
  };

  const filteredCoins = data?.tum_coinler.filter(coin =>
    coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const displayCoins = selectedView === "opportunities" ? data?.firsatlar || [] : filteredCoins;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-purple-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
          </div>
          <p className="text-gray-400 text-lg">Piyasa verileri yükleniyor...</p>
          <p className="text-gray-600 text-sm mt-2">100 coin analiz ediliyor</p>
        </div>
      </div>
    );
  }

  const totalOpportunities = data?.firsatlar.length || 0;
  const avgDiff = data?.firsatlar.length
    ? (data.firsatlar.reduce((acc, c) => acc + c.fark_yuzde, 0) / data.firsatlar.length).toFixed(2)
    : "0";
  const maxDiff = data?.firsatlar[0]?.fark_yuzde.toFixed(2) || "0";
  const totalCoins = data?.tum_coinler.length || 0;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  Arbitraj Pro
                </h1>
                <p className="text-xs text-gray-500">Real-time Cross-Exchange Scanner</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Live Indicator */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-400 text-sm font-medium">CANLI</span>
              </div>

              {/* Time */}
              <div className="text-right">
                <p className="text-xs text-gray-500">Son Güncelleme</p>
                <p className="text-sm font-mono text-gray-300">{data?.guncelleme_zamani}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-[1600px] mx-auto px-6 py-8">
        {error ? (
          <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-red-400 text-lg font-medium">{error}</p>
            <button
              onClick={fetchData}
              className="mt-6 px-6 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition"
            >
              Tekrar Dene
            </button>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/10 p-5 hover:border-purple-500/30 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Fırsatlar</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{totalOpportunities}</p>
                  <p className="text-xs text-purple-400 mt-1">Aktif arbitraj</p>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/10 p-5 hover:border-emerald-500/30 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Max Fark</span>
                  </div>
                  <p className="text-3xl font-bold text-white">%{maxDiff}</p>
                  <p className="text-xs text-emerald-400 mt-1">En yüksek spread</p>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/10 p-5 hover:border-blue-500/30 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Ort. Fark</span>
                  </div>
                  <p className="text-3xl font-bold text-white">%{avgDiff}</p>
                  <p className="text-xs text-blue-400 mt-1">Ortalama spread</p>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/10 p-5 hover:border-orange-500/30 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Toplam</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{totalCoins}</p>
                  <p className="text-xs text-orange-400 mt-1">Takip edilen coin</p>
                </div>
              </div>
            </div>

            {/* Top Opportunities */}
            {data?.firsatlar && data.firsatlar.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    En İyi Fırsatlar
                  </h2>
                  <span className="text-xs text-gray-500">{data.firsatlar.length} aktif fırsat</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {data.firsatlar.slice(0, 4).map((coin, index) => (
                    <div
                      key={coin.symbol}
                      className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 via-[#12121a] to-[#12121a] border border-emerald-500/20 p-5 hover:border-emerald-500/40 transition-all duration-300"
                    >
                      <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>

                      {/* Rank Badge */}
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-emerald-400">#{index + 1}</span>
                      </div>

                      <div className="relative">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center border border-emerald-500/20">
                            <span className="font-bold text-emerald-400">{coin.symbol.slice(0, 2)}</span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{coin.symbol}</h3>
                            <p className="text-xs text-gray-500">USDT</p>
                          </div>
                        </div>

                        <div className="flex items-end justify-between mb-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Fark</p>
                            <p className="text-2xl font-bold text-emerald-400">%{coin.fark_yuzde}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Strateji</p>
                            <p className="text-sm text-gray-300">{coin.ucuz_borsa} → {coin.pahali_borsa}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className={`p-2.5 rounded-xl ${coin.ucuz_borsa === "Binance" ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-white/5"}`}>
                            <p className="text-[10px] text-gray-500 uppercase">Binance</p>
                            <p className="text-sm font-medium text-white truncate">{formatPrice(coin.binance_fiyat)}</p>
                          </div>
                          <div className={`p-2.5 rounded-xl ${coin.ucuz_borsa === "Gate.io" ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-white/5"}`}>
                            <p className="text-[10px] text-gray-500 uppercase">Gate.io</p>
                            <p className="text-sm font-medium text-white truncate">{formatPrice(coin.gateio_fiyat)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filters & Table */}
            <div className="rounded-2xl bg-[#12121a] border border-white/5 overflow-hidden">
              {/* Table Header */}
              <div className="p-5 border-b border-white/5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedView("all")}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        selectedView === "all"
                          ? "bg-white/10 text-white"
                          : "text-gray-500 hover:text-white"
                      }`}
                    >
                      Tüm Coinler
                    </button>
                    <button
                      onClick={() => setSelectedView("opportunities")}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                        selectedView === "opportunities"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "text-gray-500 hover:text-white"
                      }`}
                    >
                      Fırsatlar
                      <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-[10px]">
                        {totalOpportunities}
                      </span>
                    </button>
                  </div>

                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Coin ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500/50 w-full md:w-64"
                    />
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-white/[0.02]">
                      <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                      <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coin</th>
                      <th className="px-5 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                          Binance
                        </span>
                      </th>
                      <th className="px-5 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          Gate.io
                        </span>
                      </th>
                      <th className="px-5 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Fark</th>
                      <th className="px-5 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Strateji</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {displayCoins.map((coin, index) => (
                      <tr
                        key={coin.symbol}
                        className={`hover:bg-white/[0.02] transition-colors ${coin.arbitraj_firsati ? "bg-emerald-500/[0.03]" : ""}`}
                      >
                        <td className="px-5 py-4 text-sm text-gray-600">{index + 1}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                              <span className="text-xs font-bold text-white">{coin.symbol.slice(0, 2)}</span>
                            </div>
                            <div>
                              <span className="font-medium text-white">{coin.symbol}</span>
                              <span className="text-gray-600 text-xs ml-1">/USDT</span>
                            </div>
                            {coin.arbitraj_firsati && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium">
                                FIRSAT
                              </span>
                            )}
                          </div>
                        </td>
                        <td className={`px-5 py-4 text-right text-sm font-mono ${coin.ucuz_borsa === "Binance" ? "text-emerald-400" : "text-gray-300"}`}>
                          {formatPrice(coin.binance_fiyat)}
                          {coin.ucuz_borsa === "Binance" && <span className="ml-1 text-emerald-400">↓</span>}
                        </td>
                        <td className={`px-5 py-4 text-right text-sm font-mono ${coin.ucuz_borsa === "Gate.io" ? "text-emerald-400" : "text-gray-300"}`}>
                          {formatPrice(coin.gateio_fiyat)}
                          {coin.ucuz_borsa === "Gate.io" && <span className="ml-1 text-emerald-400">↓</span>}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className={`text-sm font-semibold ${
                            coin.fark_yuzde > 1 ? "text-emerald-400" :
                            coin.fark_yuzde > 0.5 ? "text-yellow-400" :
                            coin.fark_yuzde > 0.3 ? "text-orange-400" :
                            "text-gray-500"
                          }`}>
                            %{coin.fark_yuzde.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-xs text-gray-400">
                            <span className={coin.ucuz_borsa === "Binance" ? "text-yellow-500" : "text-blue-500"}>
                              {coin.ucuz_borsa}
                            </span>
                            <svg className="w-3 h-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                            <span className={coin.pahali_borsa === "Binance" ? "text-yellow-500" : "text-blue-500"}>
                              {coin.pahali_borsa}
                            </span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Bottom Ticker */}
      {data && data.firsatlar.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-emerald-500/20 overflow-hidden z-40">
          <div className="ticker-wrapper py-3">
            <div className="ticker-content flex items-center">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-8 px-8">
                  {data.firsatlar.slice(0, 8).map((coin) => (
                    <div key={`${i}-${coin.symbol}`} className="flex items-center gap-3 whitespace-nowrap">
                      <span className="w-6 h-6 rounded-md bg-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-400">
                        {coin.symbol.slice(0, 2)}
                      </span>
                      <span className="font-medium text-white">{coin.symbol}</span>
                      <span className="text-emerald-400 font-bold">%{coin.fark_yuzde}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .ticker-wrapper {
          width: 100%;
        }
        .ticker-content {
          animation: ticker 60s linear infinite;
          width: fit-content;
        }
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-content:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Spacer for ticker */}
      <div className="h-16"></div>
    </div>
  );
}

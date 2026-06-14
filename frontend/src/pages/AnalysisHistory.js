import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const scorePillStyle = (score) => {
  if (score >= 80) return "bg-green-100 text-green-700";
  if (score >= 65) return "bg-blue-100 text-blue-700";
  if (score >= 50) return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
};

function AnalysisHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, hasNext: false, hasPrev: false });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [role, setRole] = useState("");
  const [minScore, setMinScore] = useState("");
  const [maxScore, setMaxScore] = useState("");

  const [appliedFilters, setAppliedFilters] = useState({ q: "", role: "", minScore: "", maxScore: "" });
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailSuggestions, setDetailSuggestions] = useState("");
  const [detailExplanation, setDetailExplanation] = useState(null);

  const fetchHistory = useCallback(async (pageNumber = 1, filters = appliedFilters) => {
    if (!user?._id) return;

    try {
      setIsLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(pageNumber),
        limit: "8",
      });

      if (filters.q) params.set("q", filters.q);
      if (filters.role) params.set("role", filters.role);
      if (filters.minScore !== "") params.set("minScore", filters.minScore);
      if (filters.maxScore !== "") params.set("maxScore", filters.maxScore);

      const response = await fetch(`${API_URL}/analysis/history/${user._id}?${params.toString()}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Unable to fetch analysis history");
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "History fetch failed");
      }

      setRows(Array.isArray(result.data) ? result.data : []);
      setPagination(result.pagination || { page: 1, totalPages: 1, total: 0, hasNext: false, hasPrev: false });
    } catch (fetchError) {
      setError(fetchError.message || "Failed to load history");
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters, user]);

  useEffect(() => {
    fetchHistory(1, appliedFilters);
  }, [fetchHistory, appliedFilters]);

  const applyFilters = (event) => {
    event.preventDefault();
    const next = {
      q: searchTerm.trim(),
      role: role.trim(),
      minScore: minScore.trim(),
      maxScore: maxScore.trim(),
    };
    setAppliedFilters(next);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setRole("");
    setMinScore("");
    setMaxScore("");
    setAppliedFilters({ q: "", role: "", minScore: "", maxScore: "" });
  };

  const pageLabel = useMemo(
    () => `Page ${pagination.page} of ${Math.max(1, pagination.totalPages)}`,
    [pagination.page, pagination.totalPages]
  );

  const handleViewDetails = useCallback(async (entry) => {
    setSelectedEntry(entry);
    setDetailError("");
    setDetailSuggestions("");
    setDetailExplanation(entry?.explanation || null);
    setIsDetailLoading(true);

    try {
      const roleLabel = encodeURIComponent(entry?.jobRole || entry?.role || "");
      const response = await fetch(
        `${API_URL}/analysis/${user._id}?includeSuggestions=true&jobRole=${roleLabel}`,
        { credentials: "include" }
      );

      if (!response.ok) {
        throw new Error("Unable to load detailed AI recommendations");
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Unable to load detailed AI recommendations");
      }

      setDetailSuggestions(result.suggestions || "");
      setDetailExplanation(result.explanation || result?.data?.explanation || entry?.explanation || null);
    } catch (err) {
      setDetailError(err.message || "Unable to load detailed AI recommendations");
    } finally {
      setIsDetailLoading(false);
    }
  }, [user]);

  const detailRole = selectedEntry?.jobRole || selectedEntry?.role || "Job Role Not Specified";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/40 to-indigo-50/40 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="bg-white/95 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-lg p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 mb-2 font-medium"
              >
                <span className="mr-2">←</span> Back
              </button>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">Analysis History</h1>
              <p className="text-gray-600 mt-1">Browse, filter, and inspect your past profile-job analyses.</p>
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 font-medium shadow-sm">
              Total Records: <span className="font-bold text-blue-900">{pagination.total || 0}</span>
            </div>
          </div>
        </header>

        <section className="bg-white/95 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-lg p-6">
          <form onSubmit={applyFilters} className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search role or description"
              className="md:col-span-2 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Role (web / sde / data)"
              className="border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
            <input
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
              placeholder="Min score"
              type="number"
              min="0"
              max="100"
              className="border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
            <input
              value={maxScore}
              onChange={(e) => setMaxScore(e.target.value)}
              placeholder="Max score"
              type="number"
              min="0"
              max="100"
              className="border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
            <div className="md:col-span-5 flex gap-3">
              <button type="submit" className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5">
                Apply Filters
              </button>
              <button type="button" onClick={clearFilters} className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-xl hover:bg-gray-200 font-semibold border border-gray-200 transition-all duration-200">
                Clear
              </button>
            </div>
          </form>
        </section>

        <section className="bg-white/95 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-lg p-6">
          {isLoading ? (
            <div className="text-center py-10 text-gray-600">Loading history...</div>
          ) : error ? (
            <div className="text-center py-10 text-red-600">{error}</div>
          ) : rows.length === 0 ? (
            <div className="text-center py-10 text-gray-600">No history found for current filters.</div>
          ) : (
            <div className="space-y-3">
              {rows.map((entry) => {
                const finalScore = Math.round(Number(entry.finalScore || 0));
                const confidence = Number(entry.confidenceScore || 0).toFixed(1);
                const title = entry.jobRole || entry.role || "Job Role Not Specified";
                return (
                  <div key={entry._id} className="border border-gray-100 rounded-2xl p-4 hover:bg-blue-50/50 hover:border-blue-200 transition-all duration-200 shadow-sm hover:shadow-md">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                        <p className="text-sm text-gray-500">
                          {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "Unknown time"}
                        </p>
                        {entry.jobDescription && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{entry.jobDescription}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${scorePillStyle(finalScore)}`}>
                          {finalScore}%
                        </span>
                        <span className="px-3 py-1 rounded-full text-sm font-semibold bg-slate-100 text-slate-700">
                          Confidence {confidence}%
                        </span>
                        <button
                          onClick={() => handleViewDetails(entry)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 text-sm font-semibold shadow-sm transition-all duration-200"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <button
              disabled={!pagination.hasPrev || isLoading}
              onClick={() => fetchHistory(Math.max(1, (pagination.page || 1) - 1))}
              className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 disabled:opacity-50 hover:bg-gray-50 font-medium"
            >
              Previous
            </button>
            <p className="text-sm text-gray-600 font-medium">{pageLabel}</p>
            <button
              disabled={!pagination.hasNext || isLoading}
              onClick={() => fetchHistory((pagination.page || 1) + 1)}
              className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 disabled:opacity-50 hover:bg-gray-50 font-medium"
            >
              Next
            </button>
          </div>
        </section>
      </div>

      {selectedEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-100 p-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-6 pb-4 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{detailRole}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedEntry.createdAt ? new Date(selectedEntry.createdAt).toLocaleString() : "Unknown time"}
                </p>
                {selectedEntry.jobDescription && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2 italic">"{selectedEntry.jobDescription}"</p>
                )}
              </div>
              <button onClick={() => setSelectedEntry(null)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">×</button>
            </div>

            <div className="space-y-6">
              {/* Overall Score Card */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
                <div className="text-center">
                  <p className="text-gray-700 font-medium mb-2">Overall Score</p>
                  <p className="text-5xl font-bold text-blue-600">{Math.round(Number(selectedEntry.finalScore || 0))}/100</p>
                  <p className="text-sm text-gray-600 mt-2">
                    {selectedEntry.finalScore >= 80 ? '🎉 Excellent Profile!' :
                     selectedEntry.finalScore >= 60 ? '👍 Good Profile' :
                     selectedEntry.finalScore >= 40 ? '⚠️ Needs Improvement' :
                     '🔴 Significant Gaps'}
                  </p>
                </div>
              </div>

              {/* Confidence Score */}
              {selectedEntry.confidenceScore !== undefined && (
                <div className={`p-4 rounded-xl border-2 ${
                  selectedEntry.confidenceScore >= 70 ? 'bg-green-50 border-green-200' :
                  selectedEntry.confidenceScore >= 40 ? 'bg-yellow-50 border-yellow-200' :
                  'bg-orange-50 border-orange-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        Confidence Score: {Number(selectedEntry.confidenceScore || 0).toFixed(0)}%
                      </h3>
                      <p className={`text-sm font-medium ${
                        selectedEntry.confidenceScore >= 70 ? 'text-green-700' :
                        selectedEntry.confidenceScore >= 40 ? 'text-yellow-700' :
                        'text-orange-700'
                      }`}>
                        {selectedEntry.confidenceScore >= 70 ? 'High Reliability - Strong data coverage' :
                         selectedEntry.confidenceScore >= 40 ? 'Medium Reliability - Moderate data coverage' :
                         'Low Reliability - Limited data available'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Skill Match Analysis */}
              {selectedEntry?.skillGaps?.match_percentage !== undefined && (
                <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                    <span>🎯</span> Skills Analysis for Target Role
                  </h3>
                  
                  {/* Match Score Card */}
                  <div className="bg-white rounded-lg p-5 mb-5 border-2 border-purple-200 shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-gray-600 font-medium">Skill Match Score</p>
                        <p className="text-sm text-gray-500 mt-1">How well your skills align with the role</p>
                      </div>
                      <div className="text-center">
                        <div className="text-5xl font-bold text-purple-600">{selectedEntry.skillGaps.match_percentage}%</div>
                        <p className={`text-sm font-medium mt-2 ${
                          selectedEntry.skillGaps.match_percentage >= 70 ? 'text-green-600' :
                          selectedEntry.skillGaps.match_percentage >= 40 ? 'text-blue-600' :
                          'text-red-600'
                        }`}>
                          {selectedEntry.skillGaps.match_percentage >= 70 ? '✓ Great Match!' :
                           selectedEntry.skillGaps.match_percentage >= 40 ? '◐ Partial Match' :
                           '✗ Needs Work'}
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-300 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all ${
                          selectedEntry.skillGaps.match_percentage >= 70 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                          selectedEntry.skillGaps.match_percentage >= 40 ? 'bg-gradient-to-r from-blue-500 to-purple-500' :
                          'bg-gradient-to-r from-orange-500 to-red-500'
                        }`}
                        style={{ width: `${selectedEntry.skillGaps.match_percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-3">
                      {selectedEntry.skillGaps.matched_count} matched • {selectedEntry.skillGaps.missing_count} missing • {selectedEntry.skillGaps.required_count} total required
                    </p>
                  </div>

                  {/* Skills Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Matched Skills */}
                    {selectedEntry.skillGaps.matched && selectedEntry.skillGaps.matched.length > 0 && (
                      <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <span className="text-xl">✅</span> Matching Skills ({selectedEntry.skillGaps.matched_count || selectedEntry.skillGaps.matched.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedEntry.skillGaps.matched.map((skill, idx) => (
                            <span key={idx} className="px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Missing Skills */}
                    {selectedEntry.skillGaps.missing && selectedEntry.skillGaps.missing.length > 0 && (
                      <div className="bg-white rounded-lg p-4 border-l-4 border-red-500">
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <span className="text-xl">❌</span> Skills to Learn ({selectedEntry.skillGaps.missing_count || selectedEntry.skillGaps.missing.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedEntry.skillGaps.missing.map((skill, idx) => (
                            <span key={idx} className="px-3 py-1.5 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Learning Path */}
                  {selectedEntry.skillRecommendations && selectedEntry.skillRecommendations.length > 0 && (
                    <div className="bg-white rounded-lg p-5 border-2 border-orange-200 mt-5">
                      <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <span>🚀</span> Recommended Learning Path
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">Start with these skills to improve your match score:</p>
                      <ol className="space-y-2">
                        {selectedEntry.skillRecommendations.map((skill, idx) => (
                          <li key={idx} className="flex items-center p-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
                            <span className="inline-flex items-center justify-center w-7 h-7 bg-orange-500 text-white rounded-full font-bold mr-3 text-sm">{idx + 1}</span>
                            <span className="text-gray-800 font-semibold flex-1">{skill}</span>
                            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-medium">Priority</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}

              {/* Detailed Explanation */}
              {detailExplanation && (
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span>🧠</span> Detailed Explanation
                  </h3>

                  {detailExplanation?.topPositiveFactors?.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-green-700 mb-2">Top Strengths</p>
                      <div className="space-y-2">
                        {detailExplanation.topPositiveFactors.map((item, idx) => (
                          <div key={`pos-${idx}`} className="p-3 bg-green-50 rounded-lg border border-green-100 text-sm text-gray-700">
                            {item.factor || "Strength"} {item.score !== undefined ? `(${Math.round(Number(item.score))}%)` : ""}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {detailExplanation?.improvementActions?.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-orange-700 mb-2">Improvement Actions</p>
                      <div className="space-y-2">
                        {detailExplanation.improvementActions.map((item, idx) => (
                          <div key={`imp-${idx}`} className="p-3 bg-orange-50 rounded-lg border border-orange-100 text-sm text-gray-700">
                            {item.action || item.description || "Improve highlighted areas"}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* AI Recommendations */}
              <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span>✨</span> AI Recommendations
                </h3>

                {isDetailLoading ? (
                  <p className="text-sm text-gray-600">Loading AI recommendations...</p>
                ) : detailError ? (
                  <p className="text-sm text-red-600">{detailError}</p>
                ) : detailSuggestions ? (
                  <div className="space-y-2">
                    {detailSuggestions
                      .split("\n")
                      .map((line) => line.trim())
                      .filter(Boolean)
                      .map((line, idx) => (
                        <p key={`ai-${idx}`} className="text-sm text-gray-700 leading-relaxed">
                          {line}
                        </p>
                      ))}
                  </div>
                ) : selectedEntry?.skillRecommendations?.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedEntry.skillRecommendations.map((item, idx) => (
                      <li key={`fallback-ai-${idx}`} className="text-sm text-gray-700">• {item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600">No AI recommendations available for this analysis.</p>
                )}
              </div>

              {/* Platform Scores Breakdown */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>📊</span> Platform Scores Breakdown
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: "github", label: "GitHub" },
                    { key: "leetcode", label: "LeetCode" },
                    { key: "codeforces", label: "Codeforces" },
                    { key: "codechef", label: "CodeChef" },
                    { key: "resume", label: "Resume" },
                  ].map((item) => {
                    const score = Math.round(Number(selectedEntry?.scores?.[item.key] || 0));
                    return (
                      <div key={item.key} className={`p-4 rounded-lg border-2 transition-all ${
                        score >= 70 ? 'bg-green-50 border-green-200' :
                        score >= 40 ? 'bg-yellow-50 border-yellow-200' :
                        'bg-red-50 border-red-200'
                      }`}>
                        <p className="text-sm text-gray-600 font-medium mb-1">{item.label}</p>
                        <p className={`text-3xl font-bold ${
                          score >= 70 ? 'text-green-600' :
                          score >= 40 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>{score}%</p>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              score >= 70 ? 'bg-green-600' :
                              score >= 40 ? 'bg-yellow-500' :
                              'bg-red-600'
                            }`}
                            style={{ width: `${score}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Gaps Identified */}
              {selectedEntry.scores && Object.entries(selectedEntry.scores).filter(([_, score]) => score < 70).length > 0 && (
                <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span>📉</span> Gaps Identified
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(selectedEntry.scores)
                      .filter(([_, score]) => score < 70)
                      .map(([platform, score]) => (
                        <div key={platform} className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <span className="text-gray-700 font-medium capitalize">{platform}</span>
                          <span className="text-red-600 font-bold">{70 - score}% gap</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={() => setSelectedEntry(null)}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 rounded-xl font-semibold transition-all shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnalysisHistory;

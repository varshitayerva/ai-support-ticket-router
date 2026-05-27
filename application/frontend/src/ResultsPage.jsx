import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import axios from 'axios';

function ResultsPage() {
    const location = useLocation();
    const { analysis, ticket } = location.state || {};

    const [guidance, setGuidance] = useState(null);
    const [finalEmail, setFinalEmail] = useState(null);
    const [judgeResult, setJudgeResult] = useState(null);
    const [analysisJudge, setAnalysisJudge] = useState(null);
    const [translatedGuidance, setTranslatedGuidance] = useState(null);
    const [translationLanguage, setTranslationLanguage] = useState(null);
    const [loading, setLoading] = useState({ guidance: false, email: false, judge: false, analysisJudge: false, translate: false });
    const [error, setError] = useState({ guidance: '', email: '', judge: '', analysisJudge: '', translate: '' });

    useEffect(() => {
        if (!analysis) {
            console.error("No analysis data found. Please start from the home page.");
        }
    }, [analysis]);

    const fetchJudgeAnalysis = async () => {
        setLoading(prev => ({ ...prev, analysisJudge: true }));
        setError(prev => ({ ...prev, analysisJudge: '' }));
        try {
            const response = await axios.post('http://localhost:8000/api/judge-analysis', {
                ticket,
                analysis
            });
            setAnalysisJudge(response.data);
            return response.data;
        } catch (err) {
            setError(prev => ({ ...prev, analysisJudge: 'Failed to validate analysis.' }));
            return null;
        } finally {
            setLoading(prev => ({ ...prev, analysisJudge: false }));
        }
    };

    const fetchGuidance = async () => {
        setLoading(prev => ({ ...prev, guidance: true }));
        setError(prev => ({ ...prev, guidance: '' }));
        setAnalysisJudge(null);
        setTranslatedGuidance(null);
        setTranslationLanguage(null);

        try {
            const analysisValidation = await fetchJudgeAnalysis();

            if (!analysisValidation || !analysisValidation.is_correct) {
                const feedback = analysisValidation?.feedback || 'Analysis validation failed.';
                setError(prev => ({ ...prev, guidance: `Cannot generate guidance: ${feedback}` }));
                setLoading(prev => ({ ...prev, guidance: false }));
                return;
            }

            const response = await axios.post('http://localhost:8000/api/guidance', { ticket, analysis });
            setGuidance(response.data.guidance);
        } catch (err) {
            setError(prev => ({ ...prev, guidance: 'Failed to fetch guidance.' }));
        } finally {
            setLoading(prev => ({ ...prev, guidance: false }));
        }
    };

    const translateGuidance = async (language) => {
        if (!guidance) {
            setError(prev => ({ ...prev, translate: 'Please generate guidance first.' }));
            return;
        }
        setLoading(prev => ({ ...prev, translate: true }));
        setError(prev => ({ ...prev, translate: '' }));
        try {
            const response = await axios.post('http://localhost:8000/api/translate-guidance', {
                guidance,
                target_language: language
            });
            setTranslatedGuidance(response.data.translated_guidance);
            setTranslationLanguage(language);
        } catch (err) {
            setError(prev => ({ ...prev, translate: `Failed to translate to ${language}.` }));
        } finally {
            setLoading(prev => ({ ...prev, translate: false }));
        }
    };

    const fetchEmail = async () => {
        if (!guidance) {
            setError(prev => ({ ...prev, email: 'Please generate guidance first.' }));
            return;
        }
        setLoading(prev => ({ ...prev, email: true }));
        setError(prev => ({ ...prev, email: '' }));
        try {
            const response = await axios.post('http://localhost:8000/api/email', { ticket, analysis, guidance });
            setFinalEmail(response.data.finalEmail);
        } catch (err) {
            setError(prev => ({ ...prev, email: 'Failed to fetch email.' }));
        } finally {
            setLoading(prev => ({ ...prev, email: false }));
        }
    };

    const fetchJudge = async () => {
        if (!finalEmail) {
            setError(prev => ({ ...prev, judge: 'Please generate email first.' }));
            return;
        }
        setLoading(prev => ({ ...prev, judge: true }));
        setError(prev => ({ ...prev, judge: '' }));
        try {
            const response = await axios.post('http://localhost:8000/api/judge', {
                ticket,
                analysis,
                guidance,
                finalEmail
            });
            setJudgeResult(response.data);
        } catch (err) {
            setError(prev => ({ ...prev, judge: 'Failed to judge response.' }));
        } finally {
            setLoading(prev => ({ ...prev, judge: false }));
        }
    };

    if (!analysis) {
        return (
            <div className="container">
                <h2>No Data</h2>
                <p>Please <Link to="/">submit a ticket</Link> first.</p>
            </div>
        );
    }

    const guidanceButtonText = analysis.urgency === 'High' ? 'Generate Troubleshooting Steps' : 'Generate Self-Service Guidance';

    return (
        <div className="container">
            <header>
                <h1>Ticket Analysis Results</h1>
                <Link to="/" style={{ color: 'var(--primary-color)' }}>&larr; Submit another ticket</Link>
            </header>

            <main className="results">
                <div className="card">
                    <h3>Initial Analysis</h3>
                    <div className="analysis-grid">
                        <span>Category</span><strong>{analysis.category}</strong>
                        <span>Urgency</span><strong className={`urgency-${analysis.urgency?.toLowerCase()}`}>{analysis.urgency}</strong>
                        <span>Sentiment</span><strong>{analysis.sentiment}</strong>
                    </div>
                </div>

                {analysisJudge && (
                    <div className="card" style={{ borderLeft: analysisJudge.is_correct ? '4px solid #51cf66' : '4px solid #ff6b6b' }}>
                        <h3>Analysis Validation {analysisJudge.is_correct ? '✓ Valid' : '✗ Invalid'}</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{ padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                                <strong>Confidence</strong>
                                <p style={{ fontSize: '1.5em', margin: '0.5rem 0', color: '#3498db' }}>{(analysisJudge.confidence * 100).toFixed(0)}%</p>
                            </div>
                            <div style={{ padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                                <strong>Status</strong>
                                <p style={{ fontSize: '1.5em', margin: '0.5rem 0', color: analysisJudge.is_correct ? '#51cf66' : '#ff6b6b' }}>
                                    {analysisJudge.is_correct ? 'Correct' : 'Incorrect'}
                                </p>
                            </div>
                        </div>
                        <div style={{ backgroundColor: '#f9f9f9', padding: '1rem', borderRadius: '4px' }}>
                            <strong>Validator Feedback:</strong>
                            <p>{analysisJudge.feedback}</p>
                        </div>
                    </div>
                )}

                <div className="card">
                    <h3>Next Steps</h3>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <button onClick={fetchGuidance} disabled={loading.guidance}>{loading.guidance ? 'Generating...' : guidanceButtonText}</button>
                        <button onClick={fetchEmail} disabled={loading.email || !guidance}>{loading.email ? 'Generating...' : 'Generate Suggested Email'}</button>
                        <button onClick={fetchJudge} disabled={loading.judge || !finalEmail} style={{ backgroundColor: '#ff6b6b' }}>{loading.judge ? 'Judging...' : 'Judge Response Quality'}</button>
                    </div>
                    {error.analysisJudge && <p className="error-box" style={{ marginTop: '1rem' }}>{error.analysisJudge}</p>}
                    {error.guidance && <p className="error-box" style={{ marginTop: '1rem' }}>{error.guidance}</p>}
                    {error.email && <p className="error-box" style={{ marginTop: '1rem' }}>{error.email}</p>}
                    {error.judge && <p className="error-box" style={{ marginTop: '1rem' }}>{error.judge}</p>}
                </div>

                {guidance && (
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0 }}>{guidanceButtonText.replace('Generate ', '')}</h3>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => translateGuidance('tamil')}
                                    disabled={loading.translate}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        fontSize: '0.9em',
                                        backgroundColor: translationLanguage === 'tamil' ? '#3498db' : '#95a5a6',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: loading.translate ? 'not-allowed' : 'pointer',
                                        opacity: loading.translate ? 0.6 : 1
                                    }}
                                    title="Translate to Tamil (தமிழ்)"
                                >
                                    {loading.translate && translationLanguage === 'tamil' ? '⏳ Tamil...' : '🇮🇳 Tamil'}
                                </button>
                                <button
                                    onClick={() => translateGuidance('telugu')}
                                    disabled={loading.translate}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        fontSize: '0.9em',
                                        backgroundColor: translationLanguage === 'telugu' ? '#3498db' : '#95a5a6',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: loading.translate ? 'not-allowed' : 'pointer',
                                        opacity: loading.translate ? 0.6 : 1
                                    }}
                                    title="Translate to Telugu (తెలుగు)"
                                >
                                    {loading.translate && translationLanguage === 'telugu' ? '⏳ Telugu...' : '🇮🇳 Telugu'}
                                </button>
                            </div>
                        </div>
                        {error.translate && <p className="error-box" style={{ marginBottom: '1rem' }}>{error.translate}</p>}
                        <pre style={{ backgroundColor: translatedGuidance && translationLanguage ? '#f0f8ff' : 'white' }}>
                            {translatedGuidance && translationLanguage ? (
                                <>
                                    <strong style={{ color: '#3498db' }}>
                                        {translationLanguage === 'tamil' ? 'தமிழ் மொழி (Tamil)' : 'తెలుగు (Telugu)'}
                                    </strong>
                                    <br /><br />
                                    {translatedGuidance}
                                    <br /><br />
                                    <hr style={{ border: '1px solid #ddd', margin: '1rem 0' }} />
                                    <strong style={{ color: '#666' }}>English (Original)</strong>
                                    <br /><br />
                                    {guidance}
                                </>
                            ) : (
                                guidance
                            )}
                        </pre>
                    </div>
                )}

                {finalEmail && (
                    <div className="card">
                        <h3>Suggested Customer Email</h3>
                        <pre>{finalEmail}</pre>
                    </div>
                )}

                {judgeResult && (
                    <div className="card" style={{ borderLeft: judgeResult.is_approved ? '4px solid #51cf66' : '4px solid #ff6b6b' }}>
                        <h3>Quality Judge Results {judgeResult.is_approved ? '✓ Approved' : '✗ Needs Review'}</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{ padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px', textAlign: 'center' }}>
                                <strong>Quality</strong>
                                <p style={{ fontSize: '2em', margin: '0.5rem 0', color: '#2ecc71' }}>{judgeResult.quality_score}/10</p>
                            </div>
                            <div style={{ padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px', textAlign: 'center' }}>
                                <strong>Correctness</strong>
                                <p style={{ fontSize: '2em', margin: '0.5rem 0', color: '#3498db' }}>{judgeResult.correctness_score}/10</p>
                            </div>
                            <div style={{ padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px', textAlign: 'center' }}>
                                <strong>Relevance</strong>
                                <p style={{ fontSize: '2em', margin: '0.5rem 0', color: '#9b59b6' }}>{judgeResult.relevance_score}/10</p>
                            </div>
                            <div style={{ padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px', textAlign: 'center' }}>
                                <strong>Overall</strong>
                                <p style={{ fontSize: '2em', margin: '0.5rem 0', color: '#e74c3c' }}>{judgeResult.overall_score}/10</p>
                            </div>
                        </div>
                        <div style={{ backgroundColor: '#f9f9f9', padding: '1rem', borderRadius: '4px' }}>
                            <strong>Feedback:</strong>
                            <p>{judgeResult.feedback}</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default ResultsPage;

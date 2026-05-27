import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function HomePage() {
    const [ticket, setTicket] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Step 1: Check if ticket is relevant to the support system
            const relevanceResponse = await axios.post('http://localhost:8000/api/judge-relevance', { ticket });

            if (!relevanceResponse.data.is_relevant) {
                setError(`❌ Not a Support Issue: ${relevanceResponse.data.feedback}`);
                setLoading(false);
                return;
            }

            // Step 2: If relevant, analyze the ticket
            const analysisResponse = await axios.post('http://localhost:8000/api/analyze', { ticket });

            // Step 3: Navigate to the results page, passing state
            navigate('/results', { state: { analysis: analysisResponse.data, ticket } });
        } catch (err) {
            const errorMessage = err.response?.data?.detail || 'An unexpected error occurred. Please try again later.';
            setError(errorMessage);
            console.error("API call failed:", err);
            setLoading(false);
        }
    };

    return (
        <>
            <header>
                <h1>AI Support Ticket Router</h1>
                <p>Enter a support ticket below and the AI will analyze it, generate guidance, and draft a response.</p>
            </header>

            <main>
                <form onSubmit={handleSubmit}>
                    <textarea
                        value={ticket}
                        onChange={(e) => setTicket(e.target.value)}
                        placeholder="Describe your issue here... (e.g., My payment failed and now my account is locked out. I need access urgently!)"
                        rows="8"
                        required
                        minLength="1"
                        disabled={loading}
                    />
                    <button type="submit" disabled={loading || !ticket}>
                        {loading ? 'Analyzing...' : 'Analyze Ticket'}
                    </button>
                </form>

                {error && (
                    <div className="error-box" style={{ marginTop: '1rem' }}>
                        <strong>Error:</strong> <p>{error}</p>
                    </div>
                )}
            </main>
        </>
    );
}

export default HomePage;
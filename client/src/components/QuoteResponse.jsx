import React, { useState, useEffect } from 'react';
import axios from 'axios';

const QuoteResponse = () => {
    const [quotes, setQuotes] = useState([]);
    const [selectedQuote, setSelectedQuote] = useState(null);
    const [counterPrice, setCounterPrice] = useState('');
    const [timeWindow, setTimeWindow] = useState('');
    const [note, setNote] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchPendingQuotes = async () => {
            try {
                const response = await axios.get('http://localhost:5000/quotes/pending', { withCredentials: true });
                setQuotes(response.data);
            } catch (err) {
                setError('Failed to fetch pending quotes. Please try again.');
            }
        };

        fetchPendingQuotes();
    }, []);

    const handleResponse = async (quoteId, action) => {
        setError('');
        setSuccess('');

        const data = {
            action,
            counterPrice: action === 'CounterOffer' ? counterPrice : null,
            timeWindow: action === 'CounterOffer' ? timeWindow : null,
            note: note || null,
        };

        console.log(`Making request to: http://localhost:5000/respond-quote/${quoteId}`);
        console.log('Request data:', data);

        try {
            const response = await axios.post(
                `http://localhost:5000/respond-quote/${quoteId}`, // Corrected URL
                data,
                { withCredentials: true }
            );

            setSuccess('Response submitted successfully.');
            // Update the quotes list to remove the responded quote
            setQuotes((prev) => prev.filter((quote) => quote.quote_request_id !== quoteId));
            setSelectedQuote(null);
            setCounterPrice('');
            setTimeWindow('');
            setNote('');
        } catch (err) {
            console.error('Error submitting response:', err);
            setError(err.response?.data?.message || 'Failed to submit response. Please try again.');
        }
    };

    return (
        <div>
            <h2>Pending Quote Responses</h2>
            {success && <p style={{ color: 'green' }}>{success}</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {quotes.length === 0 ? (
                <p>No pending quotes to respond to.</p>
            ) : (
                <div>
                    <table>
                        <thead>
                            <tr>
                                <th>Property Address</th>
                                <th>Square Feet</th>
                                <th>Proposed Price</th>
                                <th>Client Name</th>
                                <th>Client Email</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quotes.map((quote) => (
                                <tr key={quote.quote_request_id}>
                                    <td>{quote.property_address}</td>
                                    <td>{quote.square_feet}</td>
                                    <td>${quote.proposed_price.toFixed(2)}</td>
                                    <td>{quote.client_firstName} {quote.client_lastName}</td>
                                    <td>{quote.client_email}</td>
                                    <td>
                                        <button onClick={() => setSelectedQuote(quote)}>Respond</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {selectedQuote && (
                        <div>
                            <h3>Respond to Quote</h3>
                            <p><strong>Property Address:</strong> {selectedQuote.property_address}</p>
                            <p><strong>Proposed Price:</strong> ${selectedQuote.proposed_price.toFixed(2)}</p>
                            <p><strong>Client:</strong> {selectedQuote.client_firstName} {selectedQuote.client_lastName}</p>
                            <p><strong>Client Email:</strong> {selectedQuote.client_email}</p>

                            <div>
                                <label><strong>Note:</strong></label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Add a note (optional)"
                                />
                            </div>
                            <div>
                                <label><strong>Counter Price:</strong></label>
                                <input
                                    type="number"
                                    value={counterPrice}
                                    onChange={(e) => setCounterPrice(e.target.value)}
                                    placeholder="Enter a counter price"
                                />
                            </div>
                            <div>
                                <label><strong>Time Window:</strong></label>
                                <input
                                    type="text"
                                    placeholder="e.g., Dec 12 - Dec 14"
                                    value={timeWindow}
                                    onChange={(e) => setTimeWindow(e.target.value)}
                                />
                            </div>
                            <div>
                                <button onClick={() => handleResponse(selectedQuote.quote_request_id, 'Accept')}>
                                    Accept
                                </button>
                                <button onClick={() => handleResponse(selectedQuote.quote_request_id, 'Reject')}>
                                    Reject
                                </button>
                                <button onClick={() => handleResponse(selectedQuote.quote_request_id, 'CounterOffer')}>
                                    Propose Counteroffer
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default QuoteResponse;

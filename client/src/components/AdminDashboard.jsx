import React, { useState, useEffect } from "react";
import axios from 'axios';
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
    const [admin, setAdmin] = useState(null);
    const [quotes, setQuotes] = useState([]);
    const [selectedQuote, setSelectedQuote] = useState(null);
    const [counterPrice, setCounterPrice] = useState('');
    const [timeWindow, setTimeWindow] = useState('');
    const [note, setNote] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                const adminResponse = await axios.get('http://localhost:5000/admindashboard', { withCredentials: true });
                setAdmin(adminResponse.data.admin);

                const quotesResponse = await axios.get('http://localhost:5000/quotes/pending', { withCredentials: true });
                setQuotes(quotesResponse.data);
            } catch (err) {
                navigate('/adminsignin');
            }
        };

        fetchAdminData();
    }, [navigate]);

    const handleResponse = async (quoteId, action) => {
        setError('');
        setSuccess('');

        const data = {
            action,
            counter_price: action === 'CounterOffer' ? counterPrice : null,
            time_window: action === 'CounterOffer' ? timeWindow : null,
            note: note || null,
        };

        try {
            const response = await axios.post(`http://localhost:5000/quotes/${quoteId}/respond`, data, { withCredentials: true });
            setSuccess('Response submitted successfully.');
            setQuotes((prev) => prev.filter((quote) => quote.quote_request_id !== quoteId)); // Remove responded quote
            setSelectedQuote(null);
            setCounterPrice('');
            setTimeWindow('');
            setNote('');
        } catch (err) {
            setError('Failed to submit response. Please try again.');
        }
    };

    return (
        <div>
            {admin ? (
                <div>
                    <h2>Welcome, {admin.email}!</h2>

                    <h3>Pending Quotes</h3>
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    {success && <p style={{ color: 'green' }}>{success}</p>}
                    {quotes.length === 0 ? (
                        <p>No pending quotes.</p>
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
                                            <td>${quote.proposed_price}</td>
                                            <td>{quote.client_firstName} {quote.client_lastName}</td>
                                            <td>{quote.client_email}</td>
                                            <td>
                                                <button onClick={() => setSelectedQuote(quote)}>Respond</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {selectedQuote && (
                        <div>
                            <h3>Respond to Quote</h3>
                            <p>Property Address: {selectedQuote.property_address}</p>
                            <p>Proposed Price: ${selectedQuote.proposed_price}</p>
                            <p>Client: {selectedQuote.client_firstName} {selectedQuote.client_lastName}</p>
                            <p>Client Email: {selectedQuote.client_email}</p>

                            <div>
                                <label>Note:</label>
                                <textarea value={note} onChange={(e) => setNote(e.target.value)} />
                            </div>
                            <div>
                                <label>Counter Price:</label>
                                <input
                                    type="number"
                                    value={counterPrice}
                                    onChange={(e) => setCounterPrice(e.target.value)}
                                    disabled={!selectedQuote}
                                />
                            </div>
                            <div>
                                <label>Time Window:</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Dec 12 - Dec 14"
                                    value={timeWindow}
                                    onChange={(e) => setTimeWindow(e.target.value)}
                                    disabled={!selectedQuote}
                                />
                            </div>
                            <button onClick={() => handleResponse(selectedQuote.quote_request_id, 'Accept')}>Accept</button>
                            <button onClick={() => handleResponse(selectedQuote.quote_request_id, 'Reject')}>Reject</button>
                            <button onClick={() => handleResponse(selectedQuote.quote_request_id, 'CounterOffer')}>
                                Propose Counteroffer
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
};

export default AdminDashboard;

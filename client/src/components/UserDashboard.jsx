import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import QuoteForm from './QuoteForm';

const UserDashboard = () => {
    const [user, setUser] = useState(null);
    const [quotes, setQuotes] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUserDataAndQuotes();
    }, []);

    const fetchUserDataAndQuotes = async () => {
        try {
            setLoading(true);
            const userResponse = await axios.get('http://localhost:5000/userdashboard', { withCredentials: true });
            setUser(userResponse.data.user);

            const quotesResponse = await axios.get('http://localhost:5000/quotes', { withCredentials: true });
            setQuotes(quotesResponse.data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch user data or quotes:', err);
            setError('Failed to load user or quote information.');
            setLoading(false);
        }
    };

    const handleQuoteSubmission = async () => {
        try {
            await fetchUserDataAndQuotes();
        } catch (err) {
            console.error('Error refreshing quotes after submission:', err);
        }
    };

    if (loading) {
        return <p>Loading...</p>;
    }

    return (
        <div>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {user ? (
                <div>
                    <h2>Welcome, {user.firstname}!</h2>
                    <p>Email: {user.email}</p>

                    <h3>Your Quotes</h3>
                    {quotes.length === 0 ? (
                        <p>No quotes found. Submit one using the form below!</p>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Property Address</th>
                                    <th>Square Feet</th>
                                    <th>Proposed Price</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {quotes.map((quote) => (
                                    <tr key={quote.quote_request_id}>
                                        <td>{quote.property_address}</td>
                                        <td>{quote.square_feet}</td>
                                        <td>${quote.proposed_price}</td>
                                        <td>{quote.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    <h3>Submit a New Quote</h3>
                    <QuoteForm onSuccess={handleQuoteSubmission} />

                    <p>
                        <Link to="/quoteform">Go to Quote Form</Link>
                    </p>
                </div>
            ) : (
                <p>Failed to load user data. Please sign in again.</p>
            )}
        </div>
    );
};

export default UserDashboard;

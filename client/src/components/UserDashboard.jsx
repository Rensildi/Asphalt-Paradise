import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import Modal from 'react-modal';
import QuoteForm from './QuoteForm';

const UserDashboard = () => {
    const [user, setUser] = useState(null);
    const [quotes, setQuotes] = useState([]);
    const [bills, setBills] = useState([]); // Added for bills
    const [adminResponses, setAdminResponses] = useState({});
    const [error, setError] = useState('');
    const [billError, setBillError] = useState(''); // Added for bill errors
    const [billSuccess, setBillSuccess] = useState(''); // Added for bill success
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedNote, setSelectedNote] = useState('');
    const [negotiationMessages, setNegotiationMessages] = useState({});
    const [newMessage, setNewMessage] = useState('');

    const { userId } = useParams();

    useEffect(() => {
        fetchUserDataAndQuotes();
        fetchBills(); // Fetch bills when the component loads
    }, []);

    const fetchBills = async () => {
        try {
            const response = await axios.get('http://localhost:5000/user/bills', { withCredentials: true });
            setBills(response.data);
        } catch (err) {
            console.error('Error fetching bills:', err);
            setBillError('Failed to load bills. Please try again later.');
        }
    };

    //neogotiate
    const fetchNegotiationMessages = async (quoteRequestId) => {
        try {
            const response = await axios.get(`http://localhost:5000/negotiation_logs/${quoteRequestId}`, { withCredentials: true });
            setNegotiationMessages((prevMessages) => ({
                ...prevMessages,
                [quoteRequestId]: response.data,
            }));
        } catch (error) {
            console.error('Error fetching negotiation messages:', error);
        }
    };

    const fetchAdminResponses = async (quoteRequestId) => {
        try {
            const response = await axios.get(`http://localhost:5000/quote_responses/${quoteRequestId}`, { withCredentials: true });
            return response.data;
        } catch (error) {
            console.error('Error fetching admin responses:', error);
            return [];
        }
    };

    const fetchUserDataAndQuotes = async () => {
        try {
            setLoading(true);
            const userResponse = await axios.get('http://localhost:5000/userdashboard', { withCredentials: true });
            setUser(userResponse.data.user);
            const quotesResponse = await axios.get('http://localhost:5000/quote_requests', { withCredentials: true });
            const quotes = quotesResponse.data;
            setQuotes(quotes);

            const responses = {};
            for (const quote of quotes) {
                const adminResponse = await fetchAdminResponses(quote.quote_request_id);
                responses[quote.quote_request_id] = adminResponse.length > 0 ? adminResponse[0].note : 'No Admin Response Yet';
            }
            setAdminResponses(responses);
        } catch (err) {
            console.error('Failed to fetch user data or quotes:', err);
            setError('Failed to load user or quote information.');
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (quoteRequestId) => {
        try {
            const response = await axios.post(`http://localhost:5000/negotiation_logs/${quoteRequestId}`,
                { message: newMessage },
                { withCredentials: true }
            );
            setNegotiationMessages((prevMessages) => ({
                ...prevMessages,
                [quoteRequestId]: [...(prevMessages[quoteRequestId] || []), response.data],
            }));
            setNewMessage('');
        } catch (error) {
            console.error('Error sending negotiation message:', error);
        }
    };

    const handleBillResponse = async (billId, action) => {
        setBillError('');
        setBillSuccess('');
        try {
            const response = await axios.post(
                `http://localhost:5000/user/bills/${billId}/respond`,
                { action },
                { withCredentials: true }
            );
            setBillSuccess(response.data.message);
            setBills((prevBills) =>
                prevBills.map((bill) =>
                    bill.bill_id === billId ? { ...bill, status: action === 'Accept' ? 'Paid' : 'Disputed' } : bill
                )
            );
        } catch (err) {
            console.error('Error responding to bill:', err);
            setBillError('Failed to update bill status. Please try again.');
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
                                    <th>Notes</th>
                                    <th>Admin Response</th>
                                    <th>Negotiation</th>
                                </tr>
                            </thead>
                            <tbody>
                                {quotes.map(quote => (
                                    <tr key={quote.quote_request_id}>
                                        <td>{quote.property_address}</td>
                                        <td>{quote.square_feet}</td>
                                        <td>${quote.proposed_price}</td>
                                        <td>{quote.status}</td>
                                        <td>
                                            <button onClick={() => { setSelectedNote(quote.note); setShowModal(true); }}> View Full Note</button>
                                        </td>
                                        <td>{adminResponses[quote.quote_request_id]}</td>
                                        <td>
                                            <button onClick={() => fetchNegotiationMessages(quote.quote_request_id)}>View Messages</button>
                                            <div>
                                            {(negotiationMessages[quote.quote_request_id] || []).map((message, index) => (
                                                    <p key={index}>
                                                        <strong>{message.sender_role === 'admin' ? 'Admin' : 'You'}: </strong>
                                                        {message.message}
                                                    </p>
                                                ))}
                                                <input
                                                    type='text'
                                                    value={newMessage}
                                                    onChange={e => setNewMessage(e.target.value)}
                                                />
                                                <button onClick={() => handleSendMessage(quote.quote_request_id)}>Send</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                <Modal isOpen={showModal} onRequestClose={() => setShowModal(false)}>
                                    <p>{selectedNote}</p>
                                </Modal>
                            </tbody>
                        </table>
                    )}

                    <h3>Your Bills</h3>
                    {billError && <p style={{ color: 'red' }}>{billError}</p>}
                    {billSuccess && <p style={{ color: 'green' }}>{billSuccess}</p>}
                    {bills.length === 0 ? (
                        <p>No bills available.</p>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Note</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bills.map((bill) => (
                                    <tr key={bill.bill_id}>
                                        <td>{bill.order_id}</td>
                                        <td>${bill.amount}</td>
                                        <td>{bill.status}</td>
                                        <td>{bill.note || 'N/A'}</td>
                                        <td>
                                            {bill.status === 'Pending' && (
                                                <>
                                                    <button onClick={() => handleBillResponse(bill.bill_id, 'Accept')}>Accept</button>
                                                    <button onClick={() => handleBillResponse(bill.bill_id, 'Reject')}>Reject</button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    <p>
                        <Link to={`/quoteform/${user.userid}`}>Go to Quote Form</Link>
                    </p>
                </div>
            ) : (
                <p>Failed to load user data. Please sign in again.</p>
            )}
        </div>
    );
};

export default UserDashboard;
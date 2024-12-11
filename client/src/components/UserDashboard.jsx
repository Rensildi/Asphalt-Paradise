import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import Modal from 'react-modal';
import QuoteForm from './QuoteForm';

const UserDashboard = () => {
    const [user, setUser] = useState(null);
    const [quotes, setQuotes] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedNote, setSelectedNote] = useState('');
    const [negotiationMessages, setNegotiationMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    const { userId } = useParams();

    useEffect(() => {
        fetchNegotiationMessages(); //call
        fetchUserDataAndQuotes();
    }, []);

    const fetchNegotiationMessages = async (quoteRequestId) => {
        try {
            // Use the correct URL to fetch negotiation messages
            const response = await axios.get(`http://localhost:5000/negotiation_logs/${quoteRequestId}`, { withCredentials: true });
            setNegotiationMessages(response.data);  // Update state with fetched messages
        } catch (error) {
            console.error('Error fetching negotiation messages:', error);
        }
    };
    
    

    const fetchUserDataAndQuotes = async () => {
        try {
            setLoading(true);
            
            // Fetch user data
            const userResponse = await axios.get('http://localhost:5000/userdashboard', { withCredentials: true });
            console.log('User data:', userResponse.data);
            setUser(userResponse.data.user);  // Store user data
            
            // Fetch quotes (replace `/quotes` with `/quote_requests`)
            const quotesResponse = await axios.get('http://localhost:5000/quote_requests', { withCredentials: true });
            console.log('Quotes data:', quotesResponse.data);
            setQuotes(quotesResponse.data);  // Store quotes data
            
            // Call fetchNegotiationMessages for each quote
            quotesResponse.data.forEach(quote => {
                fetchNegotiationMessages(quote.quote_request_id);  // Fetch negotiation messages for each quote
            });
        } catch (err) {
            console.error('Failed to fetch user data or quotes:', err);
            setError('Failed to load user or quote information.');
        } finally {
            setLoading(false);
        }
    };
    
    

    const handleSendMessage = async (quoteRequestId) => {
        try {
            // Sending the new negotiation message via POST
            const response = await axios.post(`http://localhost:5000/negotiation_logs/${quoteRequestId}`, 
                { message: newMessage },  // Payload with message
                { withCredentials: true }  // Ensure credentials are sent with the request
            );
            
            // Update the negotiationMessages state with the new message
            setNegotiationMessages([...negotiationMessages, response.data]);
            
            // Clear the input field
            setNewMessage('');
        } catch (error) {
            console.error('Error sending negotiation message:', error);
            // Handle the error if needed (e.g., display an error message)
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
                                    <th>Notes</th>
                                    <th>Admin Response</th>
                                </tr>
                            </thead>
                            <tbody>
                                {quotes.map(quote => (
                                    <tr key={quote.quote_request_id}>
                                    <>
                                    <td>{quote.property_address}</td>
                                    <td>{quote.square_feet}</td>
                                    <td>${quote.proposed_price}</td>
                                    <td>{quote.status}</td>
                                    <td>
                                        <button onClick={() => { setSelectedNote(quote.note); setShowModal(true); }}> View Full Note</button>
                                    </td>
                                    <td>{quote.admin_note ? quote.admin_note : "No Admin Response Yet"}</td>
                                    <td>
                                        <div>
                                            {negotiationMessages.map(message => (
                                                <p key={message.negotiation_id}>
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
                                    </>
                                    </tr>
                                ))}
                                <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
                                    <p>{selectedNote}</p>
                                </Modal>
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

export default UserDashboard;
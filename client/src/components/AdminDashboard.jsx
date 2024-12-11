import React, { useState, useEffect, useRef } from "react";
import axios from 'axios';
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const [admin, setAdmin] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [bills, setBills] = useState([]);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [counterPrice, setCounterPrice] = useState('');
  const [timeWindow, setTimeWindow] = useState('');
  const [note, setNote] = useState('');
  const [adminNegotiationMessages, setAdminNegotiationMessages] = useState({}); // Store messages by quote ID
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const adminResponse = await axios.get('http://localhost:5000/admindashboard', { withCredentials: true });
        setAdmin(adminResponse.data.user);
        const quotesResponse = await axios.get('http://localhost:5000/quotes/pending', { withCredentials: true });
        setQuotes(quotesResponse.data);
        const ordersResponse = await axios.get('http://localhost:5000/orders', { withCredentials: true });
        setOrders(ordersResponse.data);
        const billsResponse = await axios.get('http://localhost:5000/bills', { withCredentials: true });
        setBills(billsResponse.data);
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
      note: note
    };

    try {
      const response = await axios.post(`http://localhost:5000/respond-quote/${quoteId}`, data, { withCredentials: true });
      setSuccess('Response submitted successfully.');
      setQuotes((prev) => prev.filter((quote) => quote.quote_request_id !== quoteId)); 
      setSelectedQuote(null);
      setCounterPrice('');
      setTimeWindow('');
      setNote('');
    } catch (err) {
      console.error('Response submission error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to submit response. Please try again.');
      if(err.response?.data?.errorDetails) { 
          console.error("Detailed database error:", err.response.data.errorDetails);
      }
    }
  };

  const handleBillPayment = async (billId) => {
    setError('');
    setSuccess('');
    try {
      // Mark the bill as paid
      const response = await axios.post(`http://localhost:5000/bills/${billId}/pay`, { withCredentials: true });
      setSuccess('Bill marked as paid successfully.');
      setBills((prevBills) => prevBills.map(bill => 
        bill.bill_id === billId ? { ...bill, status: 'Paid' } : bill
      ));
    } catch (err) {
      console.error('Bill payment error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to mark the bill as paid. Please try again.');
    }
  };

  return (
    <div>
      {admin ? (
        <div>
          <h2>Welcome, {admin.email}!</h2>

          {/* Pending Quotes Section */}
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
                    <th>User Note</th>
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
                      <td>{quote.note || "N/A"}</td>
                      <td>
                        <button onClick={() => setSelectedQuote(quote)}>Respond</button>
                        {selectedQuote && (
                          <div>
                            <p>User Note: {selectedQuote.note || "N/A"}</p>
                            {adminNegotiationMessages[selectedQuote.quote_request_id]?.map((message, index) => (
                               <p key={index}>{message}</p> // Display each message
                            ))}
                          </div>
                        )}
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

          {/* Bills Section */}
          <h3>Bills</h3>
          {bills.length === 0 ? (
            <p>No bills available.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr key={bill.bill_id}>
                    <td>{bill.order_id}</td>
                    <td>${bill.amount}</td>
                    <td>{bill.status}</td>
                    <td>
                      {bill.status !== 'Paid' && (
                        <button onClick={() => handleBillPayment(bill.bill_id)}>Mark as Paid</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default AdminDashboard;

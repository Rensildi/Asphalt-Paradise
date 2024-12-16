import React, { useState, useEffect, useRef } from "react";
import axios from 'axios';
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const [admin, setAdmin] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [bills, setBills] = useState([]);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [counterPrice, setCounterPrice] = useState('');
  const [timeWindow, setTimeWindow] = useState('');
  const [note, setNote] = useState('');
  const [negotiationMessages, setNegotiationMessages] = useState({}); // Store messages by quote ID
  const [newAdminMessage, setNewAdminMessage] = useState(''); // New admin message state
  const [showNegotiation, setShowNegotiation] = useState(false); // Track if negotiation should be displayed
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();


  // States for storing API data
  const [bigClients, setBigClients] = useState([]);
  const [difficultClients, setDifficultClients] = useState([]);
  const [thisMonthQuotes, setThisMonthQuotes] = useState([]);
  const [prospectiveClients, setProspectiveClients] = useState([]);
  const [largestDriveway, setLargestDriveway] = useState(null);
  const [overdueBills, setOverdueBills] = useState([]);
  const [badClients, setBadClients] = useState([]);
  const [goodClients, setGoodClients] = useState([]);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const adminResponse = await axios.get('http://localhost:5000/admindashboard', { withCredentials: true });
        console.log("Attempting to fetch data from admindashboard:", adminResponse);
        setAdmin(adminResponse.data.user);

        // Assuming adminResponse.data.user contains clientId
        if (adminResponse.data.user && adminResponse.data.user.clientId) {
          setClientId(adminResponse.data.user.clientId);
        }
        
        const quotesResponse = await axios.get('http://localhost:5000/quotes/pending', { withCredentials: true });
        console.log("Attempting to fetch data from quotes/pending:", quotesResponse);
        setQuotes(quotesResponse.data);
        const ordersResponse = await axios.get('http://localhost:5000/orders', { withCredentials: true });
        console.log("Attempting to fetch data from orders:", ordersResponse);
        setOrders(ordersResponse.data);
        const billsResponse = await axios.get('http://localhost:5000/bills', { withCredentials: true });
        console.log("Attempting to fetch data from bills:", billsResponse);
        setBills(billsResponse.data);
        

        // Fetch Big Clients
        try {
          const bigClientsResponse = await axios.get('http://localhost:5000/big-clients', { withCredentials: true });
          if (bigClientsResponse.data.length === 0) {
            console.log('No big clients found');
          } else {
            setBigClients(bigClientsResponse.data);
          }
        } catch (err) {
          console.error('Error fetching /big-clients:', err.response || err.message);
          console.log('Error details:', {
              url: err.config.url,
              method: err.config.method,
              headers: err.config.headers,
          });
        }

        // Fetch Difficult Clients
        try {
          const difficultClientsResponse = await axios.get('http://localhost:5000/difficult-clients', { withCredentials: true });
          console.log("Attempting to fetch data from difficult-clients:", difficultClientsResponse);
          setDifficultClients(difficultClientsResponse.data);  
        } catch (err) {
          console.error('Error fetching /big-clients:', err.response || err.message);
          console.log('Error details:', {
              url: err.config.url,
              method: err.config.method,
              headers: err.config.headers,
          });
        }

        // Fetch This Month's Quotes
        const thisMonthQuotesResponse = await axios.get('http://localhost:5000/this-month-quotes', { withCredentials: true });
        console.log("Attempting to fetch data from this-month-quotes:", thisMonthQuotesResponse);
        setThisMonthQuotes(thisMonthQuotesResponse.data);

        // Fetch Prospective Clients
        const prospectiveClientsResponse = await axios.get('http://localhost:5000/prospective-clients', { withCredentials: true });
        console.log("Attempting to fetch data from prospective clients:", prospectiveClientsResponse);
        setProspectiveClients(prospectiveClientsResponse.data);

        // Fetch Largest Driveway
        const largestDrivewayResponse = await axios.get('http://localhost:5000/largest-driveway', { withCredentials: true });
        console.log("Attempting to fetch data from large driveway:", largestDrivewayResponse);
        setLargestDriveway(largestDrivewayResponse.data);

        // Fetch Overdue Bills
        const overdueBillsResponse = await axios.get('http://localhost:5000/overdue-bills', { withCredentials: true });
        console.log("Attempting to fetch data from overdue bills:", overdueBillsResponse);
        setOverdueBills(overdueBillsResponse.data);

        // Fetch Bad Clients
        const badClientsResponse = await axios.get('http://localhost:5000/bad-clients', { withCredentials: true });
        console.log("Attempting to fetch data from bad clients:", badClientsResponse);
        setBadClients(badClientsResponse.data);

        // Fetch Good Clients
        const goodClientsResponse = await axios.get('http://localhost:5000/good-clients', { withCredentials: true });
        console.log("Attempting to fetch data from good clients:", goodClientsResponse);
        setGoodClients(goodClientsResponse.data);
      
      } catch (err) {
        navigate('/adminsignin');
      }
    };
    fetchAdminData();
  }, [navigate]);

  const getClientId = () => {
    console.log('Client ID:', clientId);
    return clientId;
  }

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

  const sendAdminMessage = async (quoteRequestId) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/negotiation_logs/${quoteRequestId}`,
        { message: newAdminMessage }, // Include the message content
        { withCredentials: true }
      );
  
      // Update the negotiationMessages state with the new message
      setNegotiationMessages((prevMessages) => ({
        ...prevMessages,
        [quoteRequestId]: [...(prevMessages[quoteRequestId] || []), response.data],
      }));
  
      setNewAdminMessage(''); // Clear the input field
    } catch (error) {
      console.error('Error sending admin message:', error);
    }
  };
  

  const handleResponse = async (quoteId, action) => {
    console.log('Entering handleResponse function');
    console.log('Received quoteId:', quoteId);
    console.log('Received action:', action);
  
    setError('');
    setSuccess('');
  
    const data = {
      action,
      counter_price: action === 'CounterOffer' ? counterPrice : null,
      time_window: action === 'CounterOffer' ? timeWindow : null,
      note: note,
    };
  
    try {
      const response = await axios.post(`http://localhost:5000/respond-quote/${quoteId}`, data, { withCredentials: true });
      console.log('Response from backend: ', response.data);
  
      const { clientId, orderId } = response.data; // Ensure clientId is retrieved
      console.log('Retrieved clientId from response:', clientId);
      console.log('Retrieved orderId from response:', orderId);
  
      if (action === 'Accept') {
        setSuccess('Response submitted successfully.');
  
        const createBill = window.confirm("Quote accepted. Would you like to create a bill for this quote?");
        if (createBill) {
          const amount = prompt("Enter bill amount:", "400"); // Default to some value
          if (amount && clientId) {
            await handleSendBill(quoteId, amount, clientId); // Pass clientId explicitly
          } else {
            console.error('Client ID is missing while creating bill');
            alert('Error: Missing client ID.');
          }
        }
  
        setQuotes((prev) => prev.filter((quote) => quote.quote_request_id !== quoteId));
      } else if (action === 'Reject') {
        setSuccess('Quote rejected.');
        setQuotes((prev) => prev.filter((quote) => quote.quote_request_id !== quoteId));
      } else if (action === 'CounterOffer') {
        console.log('Action is CounterOffer!!!');
        await fetchNegotiationMessages(quoteId);
        setShowNegotiation(true);
      }
  
      setCounterPrice('');
      setTimeWindow('');
      setNote('');
    } catch (err) {
      console.error('Response submission error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to submit response. Please try again.');
    }
  };
  

  const handleBillPayment = async (billId) => {
    setError('');
    setSuccess('');
    try {
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


  const handleSendBill = async (quoteId, amount, clientId) => {
    console.log('Entering handleSendBill function');
    console.log('Received quoteId:', quoteId);
    console.log('Received amount:', amount);
    console.log('Received clientId:', clientId);
  
    try {
      const response = await axios.post(
        'http://localhost:5000/bills',
        {
          quote_id: quoteId,
          amount: amount,
          client_id: clientId, // Pass the clientId explicitly
        },
        { withCredentials: true }
      );
  
      console.log('Bill creation response:', response.data);
      alert('Bill created successfully.');
  
      // Optionally refresh bills
      const billsResponse = await axios.get('http://localhost:5000/bills', { withCredentials: true });
      setBills(billsResponse.data);
    } catch (error) {
      console.error('Error creating bill:', error.response?.data || error.message);
      alert('Failed to create bill. Please try again.');
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
                    <th>User Note</th>
                    <th>Negotiation</th>
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
                        <button onClick={() => fetchNegotiationMessages(quote.quote_request_id)}>View Messages</button>
                        <button onClick={() => setSelectedQuote(quote)}>Respond</button>
                        {quote.status === "Accepted" && (////////////////////////////////////////////////////////////////////
                        <button
                        onClick={() => {
                          const amount = prompt("Enter bill amount:", "400"); // Default to 400
                          if (amount) handleSendBill(quote.quote_request_id, amount); // Pass quote ID and amount
                        }}
                      >
                        Send Bill
                      </button>//////////////////////////////////////////
                       
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

              {showNegotiation && (
                <div>
                  <h4>Negotiation Messages</h4>
                  {(negotiationMessages[selectedQuote.quote_request_id] || []).map((message, index) => (
                    <p key={index}>
                      <strong>{message.sender_role === 'user' ? 'User' : 'Admin'}: </strong>
                      {message.message}
                    </p>
                  ))}
                  <input
                    type="text"
                    value={newAdminMessage}
                    onChange={(e) => setNewAdminMessage(e.target.value)}
                  />
                  <button onClick={() => sendAdminMessage(selectedQuote.quote_request_id)}>Send</button>
                </div>
              )}
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

          <section>
            <h2>Big Clients</h2>
            {bigClients.length > 0 ? (
              <ul>
                <li>
                  {bigClients[0].client_firstName} {bigClients[0].client_lastName} - Order Count: {bigClients[0].order_count}
                </li>
              </ul>
            ) : (
              <p>No big clients found.</p>
            )}
          </section>

          <section>
            <h2>Difficult Clients</h2>
            {difficultClients.length > 0 ? (
              <ul>
                {difficultClients.map((client) => (
                  <li key={client.client_id}>
                    {client.client_firstName} {client.client_lastName}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No difficult clients found.</p>
            )}
          </section>

          <section>
            <h2>This Month's Quotes</h2>
            {thisMonthQuotes.length > 0 ? (
              <ul>
                {thisMonthQuotes.map((quote) => (
                  <li key={quote.quote_request_id}>
                    Quote ID: {quote.quote_request_id} - Client ID: {quote.client_id}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No quotes for this month.</p>
            )}
          </section>

          <section>
            <h2>Prospective Clients</h2>
            {prospectiveClients.length > 0 ? (
              <ul>
                {prospectiveClients.map((client) => (
                  <li key={client.client_id}>
                    {client.client_firstName} {client.client_lastName}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No prospective clients found.</p>
            )}
          </section>

          <section>
            <h2>Largest Driveway</h2>
            {largestDriveway ? (
              <p>
                Property Address: {largestDriveway.property_address} - Square Feet: {largestDriveway.square_feet}
              </p>
            ) : (
              <p>No data for the largest driveway.</p>
            )}
          </section>

          <section>
            <h2>Overdue Bills</h2>
            {overdueBills.length > 0 ? (
              <ul>
                {overdueBills.map((bill) => (
                  <li key={bill.bill_id}>
                    Bill ID: {bill.bill_id} - Amount: {bill.amount} - Order ID: {bill.order_id}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No overdue bills.</p>
            )}
          </section>

          <section>
            <h2>Bad Clients</h2>
            {badClients.length > 0 ? (
              <ul>
                {badClients.map((client) => (
                  <li key={client.client_id}>
                    {client.client_firstName} {client.client_lastName}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No bad clients found.</p>
            )}
          </section>

          <section>
            <h2>Good Clients</h2>
            {goodClients.length > 0 ? (
              <ul>
                {goodClients.map((client) => (
                  <li key={client.client_id}>
                    {client.client_firstName} {client.client_lastName}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No good clients found.</p>
            )}
          </section>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default AdminDashboard;
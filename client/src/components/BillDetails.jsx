import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const BillDetails = () => {
  const { billId } = useParams(); // Use this to get the quote_request_id for linking the bill
  const [bill, setBill] = useState(null);
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleCreateBill = async () => {
    if (!amount || !dueDate) {
      alert('Amount and Due Date are required!');
      return;
    }

    try {
      await axios.post('/bills', {
        client_id: bill.client_id, // Fetch from quote details
        amount,
        due_date: dueDate,
        note,
      });
      alert('Bill created successfully!');
      navigate('/admindashboard'); // Redirect back to dashboard after creation
    } catch (err) {
      console.error('Error creating bill:', err);
      setError('Failed to create bill. Please try again.');
    }
  };

  useEffect(() => {
    const fetchQuoteDetails = async () => {
      // Check if billId exists before making the call
      if (!billId) {
        setError('Bill ID is missing or invalid.');
        setLoading(false);
        return;
      }
  
      try {
        setLoading(true); // Set loading at the start of the API call
  
        // Ensure full API URL if baseURL is not configured
        const response = await axios.get(`http://localhost:5000/quotes/${billId}`, { withCredentials: true });
  
        if (response.data) {
          setBill(response.data); // Set the bill data
          setAmount(response.data.proposed_price || ''); // Pre-fill proposed price
          setDueDate(new Date().toISOString().split('T')[0]); // Default due date: today
        } else {
          setError('No data found for the given Bill ID.');
        }
      } catch (error) {
        console.error('Error fetching quote details:', error);
        setError('Failed to load quote details. Please try again later.');
      } finally {
        setLoading(false); // Ensure loading stops regardless of success or failure
      }
    };
  
    fetchQuoteDetails();
  }, [billId]);
  

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h2>Create Bill for {bill.client_firstName} {bill.client_lastName}</h2>
      <p><strong>Property Address:</strong> {bill.property_address}</p>
      <p><strong>Proposed Price:</strong> ${bill.proposed_price}</p>

      <h3>Create Bill</h3>
      <form onSubmit={(e) => e.preventDefault()}>
        <div>
          <label>Amount:</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div>
          <label>Due Date:</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <div>
          <label>Note (optional):</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <button onClick={handleCreateBill}>Submit</button>
      </form>
    </div>
  );
};

export default BillDetails;
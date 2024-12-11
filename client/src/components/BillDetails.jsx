
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminBillActions from './AdminBillActions';
import ClientBillActions from './ClientBillActions';

const BillDetails = () => {
  const { billId } = useParams();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBill = async () => {
      try {
        const response = await axios.get(`/bills/${billId}`);
        setBill(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching bill:", error);
        setError("Failed to load bill details.");
        setLoading(false);
        if (error.response && error.response.status === 403) {
          navigate('/');
        }
        if (error.response && error.response.status === 404) {
          setError("Bill not found");
        }
      }
    };
    fetchBill();
  }, [billId, navigate]);

  const handleBillUpdate = async () => {
    try {
      const response = await axios.get(`/bills/${billId}`);
      setBill(response.data);
    } catch (error) {
      console.error("Error updating bill:", error);
    }
  };

  if (loading) {
    return <p>Loading bill details...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  if (!bill) {
    return <p>Bill not found.</p>;
  }

  const isAdmin = !!localStorage.getItem('admin');
  const isClient = !!localStorage.getItem('user');
  const isClientOwner = isClient && bill.client_id === JSON.parse(localStorage.getItem('user')).id;

  return (
    <div>
      <h2>Bill Details</h2>
      <div>
        <p><strong>Bill ID:</strong> {bill.id}</p>
        <p><strong>Amount:</strong> ${bill.amount}</p>
        <p><strong>Status:</strong> {bill.status}</p>
        <p><strong>Client ID:</strong> {bill.client_id}</p>
        <p><strong>Due Date:</strong> {new Date(bill.due_date).toLocaleDateString()}</p>
      </div>
      {isAdmin && <AdminBillActions bill={bill} onBillUpdate={handleBillUpdate} />}
      {isClientOwner && <ClientBillActions bill={bill} onBillUpdate={handleBillUpdate} />}
    </div>
  );
};

export default BillDetails;

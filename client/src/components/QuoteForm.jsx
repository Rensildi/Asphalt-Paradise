import React, { useState } from 'react';
import axios from 'axios';

const QuoteForm = ({ onSuccess }) => {
    const [propertyAddress, setPropertyAddress] = useState('');
    const [squareFeet, setSquareFeet] = useState('');
    const [proposedPrice, setProposedPrice] = useState('');
    const [note, setNote] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const response = await axios.post(
                'http://localhost:5000/quotes',
                {
                    property_address: propertyAddress,
                    square_feet: squareFeet,
                    proposed_price: proposedPrice,
                    note: note,
                },
                { withCredentials: true }
            );

            if (response.status === 201) {
                setSuccess('Quote request submitted successfully!');
                setPropertyAddress('');
                setSquareFeet('');
                setProposedPrice('');
                setNote('');
                if (onSuccess) onSuccess(); // Refresh the parent component's data
            }
        } catch (err) {
            console.error('Error submitting quote!!:', err.response?.data || err.message);
            setError(err.response?.data?.message || 'An error occurred while submitting the quote request.');
        }
    };

    return (
        <div>
            <h2>Quote Form</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {success && <p style={{ color: 'green' }}>{success}</p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Property Address:</label>
                    <input
                        type="text"
                        value={propertyAddress}
                        onChange={(e) => setPropertyAddress(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Square Feet of Driveway:</label>
                    <input
                        type="number"
                        value={squareFeet}
                        onChange={(e) => setSquareFeet(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Proposed Price:</label>
                    <input
                        type="number"
                        step="0.01"
                        value={proposedPrice}
                        onChange={(e) => setProposedPrice(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Additional Notes:</label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                    ></textarea>
                </div>
                <button type="submit">Submit Quote</button>
            </form>
        </div>
    );
};


export default QuoteForm;

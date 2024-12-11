// import React, { useState, useEffect } from 'react';
// import axios from 'axios';

// const QuoteList = () => {
//     const [quotes, setQuotes] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState('');

//     useEffect(() => {
//         const fetchQuotes = async () => {
//             try {
//                 const response = await axios.get('http://localhost:3000/quotes', { withCredentials: true });
//                 setQuotes(response.data);
//                 setLoading(false);
//             } catch (err) {
//                 setError('Failed to fetch quotes. Please try again later.');
//                 setLoading(false);
//             }
//         };

//         fetchQuotes();
//     }, []);

//     if (loading) {
//         return <p>Loading quotes...</p>;
//     }

//     if (error) {
//         return <p style={{ color: 'red' }}>{error}</p>;
//     }

//     return (
//         <div>
//             <h2>Your Quotes</h2>
//             {quotes.length === 0 ? (
//                 <p>No quotes found. Submit a request to get started!</p>
//             ) : (
//                 <table>
//                     <thead>
//                         <tr>
//                             <th>Property Address</th>
//                             <th>Square Feet</th>
//                             <th>Proposed Price</th>
//                             <th>Status</th>
//                             <th>Notes</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {quotes.map((quote) => (
//                             <tr key={quote.quote_request_id}>
//                                 <td>{quote.property_address}</td>
//                                 <td>{quote.square_feet}</td>
//                                 <td>${quote.proposed_price}</td>
//                                 <td>{quote.status}</td>
//                                 <td>{quote.note || 'N/A'}</td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//             )}
//         </div>
//     );
// };

// export default QuoteList;

// const db = require('../db'); // Assuming you have a database connection module

// // Fetch all quotes for a specific client
// const getQuotesByClientId = async (clientId) => {
//     const query = 'SELECT * FROM quote_requests WHERE client_id = ?';
//     const [results] = await db.execute(query, [clientId]);
//     return results;
// };

// // Create a new quote
// const createQuote = async (clientId, propertyAddress, squareFeet, proposedPrice, note) => {
//     try {
//         const query = `
//             INSERT INTO quote_requests (client_id, property_address, square_feet, proposed_price, note, status, created_at, updated_at)
//             VALUES (?, ?, ?, ?, ?, 'Pending', NOW(), NOW())
//         `;
//         console.log('Executing Query:', query);
//         console.log('With Data:', [clientId, propertyAddress, squareFeet, proposedPrice, note]);
//         const [result] = await db.execute(query, [clientId, propertyAddress, squareFeet, proposedPrice, note]);
//         return result;
//     } catch (err) {
//         console.error('Error executing createQuote:', err.message);
//         throw err; // Rethrow the error for the calling function to handle
//     }
// };

// module.exports = {
//     getQuotesByClientId,
//     createQuote,
// };

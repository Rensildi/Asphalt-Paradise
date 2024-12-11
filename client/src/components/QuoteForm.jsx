// QuoteForm.jsx
import React, { useState } from 'react';
import axios from 'axios';
import Dropzone from 'react-dropzone';
import { useNavigate, useParams, Link } from 'react-router-dom';

const styles = {
  errorMessage: {
    color: 'red',
    marginBottom: '10px'
  },
  dropzone: {
    border: '2px dashed #cccccc',
    padding: '20px',
    textAlign: 'center',
    cursor: 'pointer'
  },
  fileList: {
    marginTop: '10px'
  },
  formGroup: {
    marginBottom: '10px',
    display: 'flex',
    flexDirection: 'column'
  }
};

const QuoteForm = ({ onSuccess }) => {
  const { userId } = useParams();
  const clientId = parseInt(userId, 10);
  const [files, setFiles] = useState([]);
  const [propertyAddress, setPropertyAddress] = useState('');
  const [squareFeet, setSquareFeet] = useState('');
  const [proposedPrice, setProposedPrice] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleDrop = (acceptedFiles) => {
    setFiles(acceptedFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!propertyAddress) {
      setError("Property address is required.");
      return;
    }
    if (!squareFeet || isNaN(squareFeet) || squareFeet <= 0) {
      setError("Square feet must be a positive number.");
      return;
    }

    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('propertyAddress', propertyAddress);
    formData.append('squareFeet', squareFeet);
    formData.append('proposedPrice', proposedPrice);
    formData.append('note', note);
    formData.append('client_id', clientId);

    try {
      const response = await axios.post('http://localhost:5000/submit-quote', formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('Server Response:', response.data);
      if (onSuccess) onSuccess();
      setFiles([]);
      setPropertyAddress('');
      setSquareFeet('');
      setProposedPrice('');
      setNote('');
      navigate('/userdashboard');
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Error submitting quote. Please try again.";
      setError(errorMessage);
      console.error('Error Submitting Quote:', err);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        {error && <div style={styles.errorMessage}>{error}</div>}
        <Dropzone onDrop={handleDrop} multiple={true} maxFiles={5}>
          {({ getRootProps, getInputProps }) => (
            <div {...getRootProps()} style={styles.dropzone}>
              <input {...getInputProps()} />
              <p>Drag 'n' drop some files here, or click to select files</p>
            </div>
          )}
        </Dropzone>
        <div style={styles.fileList}>
          {files.map(file => (
            <p key={file.name}>{file.name} ({(file.size / 1024).toFixed(2)} KB)</p>
          ))}
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="propertyAddress">Property Address:</label>
          <input
            type="text"
            id="propertyAddress"
            value={propertyAddress}
            onChange={e => setPropertyAddress(e.target.value)}
            required
          />
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="squareFeet">Square Feet:</label>
          <input
            type="number"
            id="squareFeet"
            value={squareFeet}
            onChange={e => setSquareFeet(e.target.value)}
            required
          />
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="proposedPrice">Proposed Price:</label>
          <input
            type="number"
            id="proposedPrice"
            value={proposedPrice}
            onChange={e => setProposedPrice(e.target.value)}
          />
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="note">Note:</label>
          <textarea
            id="note"
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>
        <button type="submit">Submit Quote</button>
      </form>
      <Link to="/userdashboard" onClick={e => e.preventDefault()}>Back to Dashboard</Link>
    </>
  );
};

export default QuoteForm;

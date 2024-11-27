import logo from './logo.svg';
import './App.css';
import axios from 'axios';

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors()) // ENABLE CORS
app.use(express.json());

// Routes
app.get('/api', (req, rest) => {
  rest.json({message: 'Welcome to Asphalt Paradise!'});
});

const fetchData = async () => {
  try {
    const response = await axios.get('http://localhost:5050/api'); // Adjust endpoint as needed
    console.log(response.data);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

fetchData();

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;

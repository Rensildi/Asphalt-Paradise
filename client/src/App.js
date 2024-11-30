import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './components/Home'; // Adjust paths as needed
import SignUp from './components/SignUp';
import SignIn from './components/SignIn';
import UserDashboard from './components/UserDashboard';
// ... other imports

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/userdashboard" element={<UserDashboard />} />
                {/* Other routes */}
            </Routes>
        </BrowserRouter>
    );

}


export default App;
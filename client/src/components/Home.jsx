// Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
    return (
        <div>
            <h1>Welcome to Asphalt Paradise!</h1>

            <nav> {/* Example basic navigation */}
                <Link to="/signin">Sign In</Link><br />
                <Link to="/signup">Sign Up</Link><br />
            </nav>



            {/* ... other home page content ... */}
        </div>
    );
}

export default Home;
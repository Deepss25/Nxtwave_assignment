import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home">
      <div className="hero">
        <h1>Welcome to Court Booking Platform</h1>
        <p>Book your badminton court, equipment, and coach in one place</p>
        <Link to="/book" className="cta-button">Book Now</Link>
      </div>

      <div className="features">
        <div className="feature-card">
          <div className="feature-icon">🏸</div>
          <h3>4 Courts Available</h3>
          <p>2 indoor and 2 outdoor courts</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🎾</div>
          <h3>Equipment Rental</h3>
          <p>Rackets and shoes available</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">👨‍🏫</div>
          <h3>Professional Coaches</h3>
          <p>3 experienced coaches</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">💰</div>
          <h3>Dynamic Pricing</h3>
          <p>Fair pricing based on time and demand</p>
        </div>
      </div>
    </div>
  );
}

export default Home;


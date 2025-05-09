import React, { useEffect, useState } from 'react';
import { Container, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const ComingSoon = () => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(3);

  useEffect(() => {
    // Redirect to games page after 3 seconds
    const redirectTimer = setTimeout(() => {
      navigate('/games');
    }, 3000);

    // Update countdown every second
    const countdownTimer = setInterval(() => {
      setTimeLeft((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
    }, 1000);

    // Cleanup timers on component unmount
    return () => {
      clearTimeout(redirectTimer);
      clearInterval(countdownTimer);
    };
  }, [navigate]);

  return (
    <Container className="text-center mt-5">
      <h1 className="mb-3">Coming Soon</h1>
      <p className="mb-4">This game will be available soon. Stay tuned!</p>
      
      <div className="d-flex flex-column align-items-center">
        <Spinner animation="border" variant="primary" className="mb-3" />
        <p>
          Redirecting to games in {timeLeft} {timeLeft === 1 ? 'second' : 'seconds'}...
        </p>
      </div>
    </Container>
  );
};

export default ComingSoon;
import React, { useState } from 'react';
import { Form, Button, Alert, Container, Card, Image } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { Formik, Form as FormikForm } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../context/AuthContext';
import logoCasino from '../images/logo-casino.png';
import '../../assets/styles/Auth.css';

const loginSchema = Yup.object().shape({
  username: Yup.string().required('Username is required'),
  password: Yup.string().required('Password is required')
});

const Login = () => {
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (values, { setSubmitting }) => {
    setError('');
    try {
      await login(values);
      // On successful login, the AuthContext will handle redirection
    } catch (err) {
      console.log('Login error:', err);
      
      // Handle specific error cases
      if (err.response) {
        const status = err.response.status;
        
        // Case 1: String error in response.data
        if (typeof err.response.data === 'string') {
          setError(err.response.data);
        }
        // Case 2: Object with error data
        else {
          const errorData = err.response.data;
          
          if (status === 401) {
            setError('Invalid username or password. Please try again.');
          } else if (status === 404) {
            setError('User not found. Please check your username or register a new account.');
          } else if (errorData && errorData.message) {
            setError(errorData.message);
          } else {
            setError('Login failed. Please check your credentials.');
          }
        }
      } else {
        setError(err.message || 'Login failed. Please try again later.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Decorative elements */}
      <div className="auth-decoration auth-decoration-1"></div>
      <div className="auth-decoration auth-decoration-2"></div>
      
      <Card className="auth-card">
        <Card.Body className="auth-card-body">
          <div className="auth-logo-container">
            <Image 
              src={logoCasino} 
              alt="Casino Logo" 
              className="auth-logo"
            />
            <h2 className="auth-title">Login to Casino</h2>
          </div>
          
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Formik
            initialValues={{ username: '', password: '' }}
            validationSchema={loginSchema}
            onSubmit={handleLogin}
          >
            {({
              values,
              errors,
              touched,
              handleChange,
              handleBlur,
              handleSubmit,
              isSubmitting,
            }) => (
              <Form onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(e);
              }}>
                <Form.Group className="auth-form-group">
                  <Form.Label className="auth-label" htmlFor='username'>Username</Form.Label>
                  <Form.Control
                    className="auth-input"
                    id='username'
                    type="text"
                    name="username"
                    value={values.username}
                    autoComplete="username"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.username && errors.username}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.username}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="auth-form-group">
                  <Form.Label className="auth-label">Password</Form.Label>
                  <Form.Control
                    className="auth-input"
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.password && errors.password}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.password}
                  </Form.Control.Feedback>
                </Form.Group>

                <Button 
                  type="submit" 
                  className="auth-btn" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Logging in...' : 'Login'}
                </Button>
              </Form>
            )}
          </Formik>
          
          <div className="auth-footer">
            <p>Don't have an account? <Link to="/register" className="auth-link">Register</Link></p>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Login;

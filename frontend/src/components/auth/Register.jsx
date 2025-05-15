import React, { useState } from 'react';
import { Form, Button, Alert, Container, Card, Image } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { Formik } from 'formik';
import * as Yup from 'yup';
import authService from '../../services/authService';
import logoCasino from '../images/logo-casino.png';

const registerSchema = Yup.object().shape({
  username: Yup.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .required('Username is required'),
  email: Yup.string()
    .email('Invalid email format')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required')
});

const Register = () => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (values, { setSubmitting, resetForm }) => {
    try {
      // Remove confirmPassword as it's not needed in the API
      const { confirmPassword, ...userData } = values;
      
      await authService.register(userData);
      setSuccess('Registration successful! You can now login.');
      resetForm();
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      // Check for different error response formats
      console.log('Registration error:', err);
      
      // Case 1: String error in response.data
      if (err.response && typeof err.response.data === 'string') {
        const errorMessage = err.response.data;
        if (errorMessage.toLowerCase().includes('username')) {
          setError('This username is already taken. Please choose another one.');
        } else if (errorMessage.toLowerCase().includes('email')) {
          setError('This email is already registered. Please use another email or try logging in.');
        } else {
          setError(errorMessage);
        }
      }
      // Case 2: Object with message/error property
      else if (err.response && err.response.data) {
        const errorMessage = err.response.data.message || err.response.data.error;
        
        if (errorMessage && errorMessage.toLowerCase().includes('username')) {
          setError('This username is already taken. Please choose another one.');
        } else if (errorMessage && errorMessage.toLowerCase().includes('email')) {
          setError('This email is already registered. Please use another email or try logging in.');
        } else {
          setError(errorMessage || 'Registration failed. Please try again.');
        }
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <Card className="shadow text-white" style={{ width: '400px' }}>
        <Card.Body>
          <div className="text-center mb-4">
            <Image 
              src={logoCasino} 
              alt="Casino Logo" 
              className="register-logo mb-3" 
              style={{ width: '150px', filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.4))' }} 
            />
            <Card.Title>Register for Casino</Card.Title>
          </div>
          
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          <Formik
            initialValues={{ username: '', email: '', password: '', confirmPassword: '' }}
            validationSchema={registerSchema}
            onSubmit={handleRegister}
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
                e.preventDefault(); // Prevent form from causing page reload
                handleSubmit(e);
              }}>
                <Form.Group className="mb-3">
                  <Form.Label htmlFor='username'>Username</Form.Label>
                  <Form.Control
                  className="input-form"
                    id='username'
                    type="text"
                    name="username"
                    label="Username"
                    autoComplete="username"
                    autoFocus
                    value={values.username}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.username && errors.username}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.username}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label htmlFor='email'>Email</Form.Label>
                  <Form.Control
                  className="input-form"
                    id='email'
                    type="email"
                    name="email"
                    label="Email"
                    value={values.email}
                    autoComplete="email"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.email && errors.email}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label htmlFor='password'>Password</Form.Label>
                  <Form.Control
                  className="input-form"
                    id='password'
                    type="password"
                    name="password"
                    label="Password"
                    autoComplete="new-password"
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.password && errors.password}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.password}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label htmlFor='confirmPassword'>Confirm Password</Form.Label>
                  <Form.Control
                  className="input-form"
                    id='confirmPassword'
                    type="password"
                    name="confirmPassword"
                    label="Confirm Password"
                    autoComplete="new-password"
                    value={values.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.confirmPassword && errors.confirmPassword}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.confirmPassword}
                  </Form.Control.Feedback>
                </Form.Group>

                <Button 
                  className="w-100 mt-3 btn-primary2" 
                  type="submit" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Registering...' : 'Register'}
                </Button>
              </Form>
            )}
          </Formik>
          
          <div className="text-center mt-3">
            <p>Already have an account? <Link to="/login">Login</Link></p>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Register;

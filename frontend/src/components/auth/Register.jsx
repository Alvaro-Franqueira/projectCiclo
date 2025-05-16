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
    .max(100, 'Email cannot be longer than 100 characters')
    .test('no-disposable-email', 'Disposable email addresses are not allowed', (value) => {
      if (!value) return true; // Skip validation if empty (handled by required)
      
      // Check against common disposable email domains
      const disposableDomains = [
        'mailinator.com', 'yopmail.com', 'tempmail.com', 'guerrillamail.com',
        'throwawaymail.com', '10minutemail.com', 'trashmail.com', 'sharklasers.com',
        'temp-mail.org', 'fakeinbox.com'
      ];
      
      const domain = value.substring(value.indexOf('@') + 1).toLowerCase();
      return !disposableDomains.includes(domain);
    })
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{8,}$/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (including periods)'
    )
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required')
});

const Register = () => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [serverErrors, setServerErrors] = useState({});
  const navigate = useNavigate();

  const handleRegister = async (values, { setSubmitting, resetForm, setErrors }) => {
    try {
      // Clear previous errors
      setError('');
      setServerErrors({});
      
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
      console.log('Registration error:', err);
      
      // Handle validation errors from the server
      if (err.response && err.response.data && err.response.data.errors) {
        // Field-specific validation errors
        const fieldErrors = err.response.data.errors;
        setServerErrors(fieldErrors);
        
        // Set Formik errors to display them in the form
        const formikErrors = {};
        Object.keys(fieldErrors).forEach(field => {
          formikErrors[field] = fieldErrors[field];
        });
        setErrors(formikErrors);
      }
      // Handle general error message
      else if (err.response && err.response.data) {
        const errorMessage = err.response.data.message || err.response.data.error || 
                            (typeof err.response.data === 'string' ? err.response.data : 'Registration failed');
        
        if (errorMessage.toLowerCase().includes('username')) {
          setError('This username is already taken. Please choose another one.');
        } else if (errorMessage.toLowerCase().includes('email')) {
          setError('This email is already registered. Please use another email or try logging in.');
        } else {
          setError(errorMessage);
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
                    isInvalid={(touched.username && errors.username) || serverErrors.username}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.username || serverErrors.username}
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
                    isInvalid={(touched.email && errors.email) || serverErrors.email}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email || serverErrors.email}
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
                    isInvalid={(touched.password && errors.password) || serverErrors.password}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.password || serverErrors.password}
                  </Form.Control.Feedback>
                  {!errors.password && !serverErrors.password && (
                    <Form.Text className="text-muted">
                      Password must be 8-30 characters and include uppercase, lowercase, digit, and special character (including periods).
                    </Form.Text>
                  )}
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

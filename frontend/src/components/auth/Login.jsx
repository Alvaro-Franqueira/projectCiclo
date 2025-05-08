import React, { useState } from 'react';
import { Form, Button, Alert, Container, Card, Image } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../context/AuthContext';
import logoCasino from '../images/logo-casino.png';

const loginSchema = Yup.object().shape({
  username: Yup.string().required('Username is required'),
  password: Yup.string().required('Password is required')
});

const Login = () => {
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleLogin = async (values, { setSubmitting }) => {
    setError('');
    try {
      await login(values);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <Card className="shadow" style={{ width: '400px' }}>
        <Card.Body className="text-white">
          <div className="text-center mb-4">
            <Image 
              src={logoCasino} 
              alt="Casino Logo" 
              className="login-logo mb-3" 
              style={{ width: '150px', filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.4))' }} 
            />
            <Card.Title>Login to Casino</Card.Title>
          </div>
          
          {error && <Alert variant="danger" className="text-white">{error}</Alert>}
          
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
              <Form onSubmit={handleSubmit} >
                <Form.Group className="mb-3">
                  <Form.Label htmlFor='username'>Username</Form.Label>
                  <Form.Control
                    className="input-form"
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

                <Form.Group className="mb-3">
                  <Form.Label >Password</Form.Label>
                  <Form.Control
                    className="input-form"
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
                  className="w-100 mt-3 btn-primary2" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Logging in...' : 'Login'}
                </Button>
              </Form>
            )}
          </Formik>
          
          <div className="text-center mt-3">
            <p>Don't have an account? <Link to="/register" className="text-yellow">Register</Link></p>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Login;

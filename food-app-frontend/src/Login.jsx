import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = ({ onSuccessfulLogin }) => {
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginData.username === 'super admin' && loginData.password === 'super admin') {
      localStorage.setItem('isLoggedIn', 'true');
      if (onSuccessfulLogin) {
        onSuccessfulLogin();
      } else {
        navigate('/');
      }
    } else {
      setError('Invalid credentials. Use "super admin" for both username and password.');
    }
  };

  const handleGoBack = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Admin Login</h2>
        <p className="login-subtitle">Login to manage menu items</p>
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Username:</label>
            <input
              type="text"
              name="username"
              value={loginData.username}
              onChange={handleInputChange}
              required
              placeholder="Enter username"
            />
          </div>
          
          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              name="password"
              value={loginData.password}
              onChange={handleInputChange}
              required
              placeholder="Enter password"
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-actions">
            <button type="submit" className="login-submit-btn">
              Login
            </button>
            <button 
              type="button" 
              onClick={handleGoBack}
              className="login-cancel-btn"
            >
              Back to Menu
            </button>
          </div>
        </form>
        
        <div className="login-hint">
          <p>Hint: Use "super admin" for both username and password</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
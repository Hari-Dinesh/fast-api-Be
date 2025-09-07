import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import axios from 'axios'
import './App.css'
import Login from './Login'

// API base URL - change this to your Render URL when deployed
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function FoodApp() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const navigate = useNavigate()

  // Form state
  const [formData, setFormData] = useState({
    categoryName: '',
    name: '',
    imgUrl: '',
    description: ''
  })

  // Check if user is already logged in
  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true'
    setIsLoggedIn(loggedIn)
  }, [])

  // Fetch all items
  const fetchItems = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE_URL}/items`)
      setItems(response.data)
      
      // Extract unique categories
      const uniqueCategories = [...new Set(response.data.map(item => item.categoryName))]
      setCategories(['All', ...uniqueCategories])
    } catch (err) {
      setError('Failed to fetch items')
      console.error('Error fetching items:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  // Filter items by selected category
  const filteredItems = selectedCategory === 'All' 
    ? items 
    : items.filter(item => item.categoryName === selectedCategory)

  // Handle login
  const handleLogin = () => {
    navigate('/login')
  }

  // Handle logout
  const handleLogout = () => {
    setIsLoggedIn(false)
    localStorage.removeItem('isLoggedIn')
  }

  // Handle successful login
  const handleSuccessfulLogin = () => {
    setIsLoggedIn(true)
    navigate('/')
  }

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle form submit for add/edit
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingItem) {
        // Update existing item
        await axios.put(`${API_BASE_URL}/items/${editingItem.id}`, formData)
        setEditingItem(null)
      } else {
        // Add new item
        await axios.post(`${API_BASE_URL}/items`, formData)
      }
      
      // Reset form and refresh items
      setFormData({
        categoryName: '',
        name: '',
        imgUrl: '',
        description: ''
      })
      setShowAddForm(false)
      fetchItems()
    } catch (err) {
      setError('Failed to save item')
      console.error('Error saving item:', err)
    }
  }

  // Edit item
  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      categoryName: item.categoryName,
      name: item.name,
      imgUrl: item.imgUrl,
      description: item.description || ''
    })
    setShowAddForm(true)
  }

  // Delete item
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return
    
    try {
      await axios.delete(`${API_BASE_URL}/items/${id}`)
      fetchItems()
    } catch (err) {
      setError('Failed to delete item')
      console.error('Error deleting item:', err)
    }
  }

  // Cancel edit/add
  const handleCancel = () => {
    setShowAddForm(false)
    setEditingItem(null)
    setFormData({
      categoryName: '',
      name: '',
      imgUrl: '',
      description: ''
    })
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div className="app">
      <header className="header">
        <h1>🍕 Food Menu</h1>
        <div className="header-actions">
          {isLoggedIn ? (
            <>
              <button 
                className="add-btn"
                onClick={() => setShowAddForm(true)}
              >
                + Add Item
              </button>
              <button 
                className="logout-btn"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : ""}
        </div>
      </header>

      {error && (
        <div className="error">
          {error}
          <button onClick={() => setError('')} className="error-close">×</button>
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="form-overlay">
          <div className="form-container">
            <h2>{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Category:</label>
                <input
                  type="text"
                  name="categoryName"
                  value={formData.categoryName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Image URL:</label>
                <input
                  type="url"
                  name="imgUrl"
                  value={formData.imgUrl}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>
              
              <div className="form-actions">
                <button type="submit" className="save-btn">
                  {editingItem ? 'Update' : 'Add'} Item
                </button>
                <button type="button" onClick={handleCancel} className="cancel-btn">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="category-filter">
        <h2>Categories</h2>
        <div className="category-buttons">
          {categories.map(category => (
            <button
              key={category}
              className={selectedCategory === category ? 'active' : ''}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Items Grid */}
      <div className="items-container">
        <div className="items-grid">
          {filteredItems.length === 0 ? (
            <div className="empty-state">
              <p>No items found in {selectedCategory} category</p>
            </div>
          ) : (
            filteredItems.map(item => (
              <div key={item.id} className="item-card">
                <div className="item-image">
                  <img src={item.imgUrl} alt={item.name} />
                </div>
                <div className="item-content">
                  <h3>{item.name}</h3>
                  <span className="category-badge">{item.categoryName}</span>
                  <p>{item.description}</p>
                  {isLoggedIn && (
                    <div className="item-actions">
                      <button 
                        className="edit-btn"
                        onClick={() => handleEdit(item)}
                      >
                        Edit
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// Main App Component with Routing
function App() {
  return (
    <Routes>
      <Route 
        path="/login" 
        element={<Login onSuccessfulLogin={() => window.location.href = '/'} />} 
      />
      <Route 
        path="/" 
        element={<FoodApp />} 
      />
      <Route 
        path="*" 
        element={<FoodApp />} 
      />
    </Routes>
  );
}

export default App;
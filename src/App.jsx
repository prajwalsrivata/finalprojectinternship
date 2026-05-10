import React from 'react'
import { useState } from 'react'
import Navbar from './components/Navbar/Navbar'
import Footer from './components/Footer/Footer'
import { Route, Routes, useLocation } from 'react-router-dom'
import Home from './pages/Home/Home'
import Cart from './pages/Cart/Cart'
import PlaceOrder from './pages/PlaceOrder/PlaceOrder'
import MyOrders from './pages/MyOrders/MyOrders'
import LoginPopup from './components/LoginPopup/LoginPopup'
import Admin from './pages/Admin/Admin'

const App = () => {
  const [showLogin, setShowLogin] = useState(false)
  const location = useLocation()
  const isAdminPage = location.pathname === '/admin'

  // Admin page renders standalone (no Navbar/Footer)
  if (isAdminPage) {
    return (
      <Routes>
        <Route path='/admin' element={<Admin />} />
      </Routes>
    )
  }

  return (
    <>
      {showLogin ? <LoginPopup setShowLogin={setShowLogin} /> : <></>}

      <div className='app'>
        <Navbar setShowLogin={setShowLogin} />

        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/cart' element={<Cart />} />
          <Route path='/order' element={<PlaceOrder />} />
          <Route path='/myorders' element={<MyOrders />} />
        </Routes>
      </div>

      <Footer />
    </>
  )
}

export default App

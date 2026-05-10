import React from 'react'
import './PlaceOrder.css'
import { Form, useNavigate } from 'react-router-dom'
import { useContext, useState, useEffect } from 'react';
import { StoreContext } from '../../components/Context/StoreContext';
import axios from 'axios';

const PlaceOrder = () => {

  const {getTotalCartAmount, token, food_list, cartItems, url, setCartItems} = useContext(StoreContext)
  const navigate = useNavigate()

  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    phone: ""
  })

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData(data => ({ ...data, [name]: value }))
  }

  const placeOrder = async (event) => {
    event.preventDefault();

    if (!token) {
        alert("Please sign in to place an order!");
        return;
    }
    if (getTotalCartAmount() === 0) {
        alert("Your cart is empty!");
        return;
    }

    let orderItems = [];
    food_list.forEach((item) => {
      if (cartItems[item.id] > 0) {
        let itemInfo = item;
        itemInfo["quantity"] = cartItems[item.id];
        orderItems.push(itemInfo);
      }
    })
    
    let orderData = {
      address: data,
      items: orderItems,
      amount: getTotalCartAmount() + 2,
    }
    
    try {
        let response = await axios.post(url + "/api/orders", orderData, { headers: { token } });
        if (response.data.success) {
            alert("Order Placed Successfully!");
            setCartItems({}); // Clear the cart
            navigate("/myorders"); // Redirect to My Orders
        } else {
            alert("Error Placing Order");
        }
    } catch (error) {
        console.error("Error placing order", error);
        alert("Error Placing Order");
    }
  }

  return (
    <form onSubmit={placeOrder} className='place-order'>
      <div className="place-order-left">
        <p className="title">Delivery Information</p>
        <div className="multi-fields">
          <input required name="firstName" onChange={onChangeHandler} value={data.firstName} type="text" placeholder="First name" />
          <input required name="lastName" onChange={onChangeHandler} value={data.lastName} type="text" placeholder="Last name" />
        </div>
        <input required name="email" onChange={onChangeHandler} value={data.email} type="email" placeholder="Email address" />
        <input required name="street" onChange={onChangeHandler} value={data.street} type="text" placeholder="Street" />
        <div className="multi-fields">
          <input required name="city" onChange={onChangeHandler} value={data.city} type="text" placeholder="City" />
          <input required name="state" onChange={onChangeHandler} value={data.state} type="text" placeholder="State" />
        </div>
        <div className="multi-fields">
          <input required name="zipCode" onChange={onChangeHandler} value={data.zipCode} type="text" placeholder="Zip code" />
          <input required name="country" onChange={onChangeHandler} value={data.country} type="text" placeholder="Country" />
        </div>
        <input required name="phone" onChange={onChangeHandler} value={data.phone} type="text" placeholder="Phone number" />

      </div>
      <div className="place-order-right">
        <div className="cart-total">
        <h2>Cart Totals</h2>
        <div>
          <div className="cart-total-details">
            <p>Subtotal</p>
            <p>₹{getTotalCartAmount()}</p>
            </div>
            <hr />
          <div className="cart-total-details">
            <p>Delivery Fee</p>
            <p>₹{getTotalCartAmount()===0?0:2}</p>
          </div>
          <hr />
          <div className="cart-total-details">
            <b>Total</b>
            <b>₹{getTotalCartAmount()===0?0:getTotalCartAmount()+2}</b>
          </div>
        </div>
        <button type="submit">PROCEED TO PAYMENT</button>
       </div>

      </div>
    

    </form>
  )
}

export default PlaceOrder
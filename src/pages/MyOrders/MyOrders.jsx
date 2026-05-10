import React, { useContext, useEffect, useState } from 'react';
import './MyOrders.css';
import { StoreContext } from '../../components/Context/StoreContext';
import axios from 'axios';
import { assets } from '../../assets/assets';

const MyOrders = () => {
    const { url, token } = useContext(StoreContext);
    const [data, setData] = useState([]);

    const fetchOrders = async () => {
        const response = await axios.post(url + "/api/orders/userorders", {}, { headers: { token } });
        if (response.data.success) {
            setData(response.data.data.reverse()); // Show latest orders first
        }
    }

    const cancelOrder = async (orderId) => {
        try {
            const response = await axios.post(url + "/api/orders/cancel", { orderId }, { headers: { token } });
            if (response.data.success) {
                fetchOrders();
            } else {
                alert(response.data.message);
            }
        } catch(err) {
            console.error(err);
            alert("Failed to cancel order");
        }
    }

    useEffect(() => {
        if (token) {
            fetchOrders();
        }
    }, [token]);

    return (
        <div className='my-orders'>
            <h2>My Orders</h2>
            <div className="container">
                {data.map((order, index) => {
                    return (
                        <div key={index} className='my-orders-order'>
                            <img src={assets.parcel_icon} alt="" />
                            <p>{order.items.map((item, index) => {
                                if (index === order.items.length - 1) {
                                    return item.name + " x " + item.quantity;
                                } else {
                                    return item.name + " x " + item.quantity + ", ";
                                }
                            })}</p>
                            <p>₹{order.amount}.00</p>
                            <p>Items: {order.items.length}</p>
                            <p><span>&#x25cf;</span> <b>{order.status}</b></p>
                            <div className="order-actions">
                                <button onClick={fetchOrders}>Track Order</button>
                                <button onClick={() => cancelOrder(order._id)} className="cancel-btn">Cancel Order</button>
                            </div>
                        </div>
                    )
                })}
                {data.length === 0 && <p>You have no orders yet.</p>}
            </div>
        </div>
    )
}

export default MyOrders;

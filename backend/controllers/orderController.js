import Order from "../models/Order.js";
import { broadcast } from "../server.js";

// GET orders (admin only)
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ date: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Error fetching orders" });
  }
};

// Update order status (admin only)
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // Broadcast status change to all admin WebSocket clients
    broadcast("order_status_updated", order);

    res.json({ success: true, message: "Order status updated", order });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Error updating order status" });
  }
};

// POST order
export const createOrder = async (req, res) => {
  try {
    const { userId, items, amount, address } = req.body;

    if (!items || !amount || !address) {
      return res.status(400).json({ success: false, message: "Items, amount, and address required" });
    }

    const newOrder = new Order({ userId, items, amount, address });
    await newOrder.save();

    // Broadcast new order to all connected admin WebSocket clients
    broadcast("new_order", newOrder);

    res.json({ success: true, message: "Order placed successfully", order: newOrder });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Error placing order" });
  }
};

// user orders for frontend
export const userOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.body.userId });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// cancel order
export const cancelOrder = async (req, res) => {
  try {
    const { orderId, userId } = req.body;
    const order = await Order.findOne({ _id: orderId, userId: userId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found or unauthorized" });
    }
    await Order.findByIdAndDelete(orderId);

    // Broadcast cancellation to admin WebSocket clients
    broadcast("order_cancelled", { orderId });

    res.json({ success: true, message: "Order cancelled successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error cancelling order" });
  }
};

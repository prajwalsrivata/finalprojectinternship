import express from "express";
import { getOrders, createOrder, userOrders, cancelOrder, updateOrderStatus } from "../controllers/orderController.js";
import protect from "../middleware/authMiddleware.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// Admin: get all orders
router.get("/", protect, getOrders);

// Admin: update order status
router.put("/status", protect, updateOrderStatus);

// User: create order
router.post("/", authMiddleware, createOrder);

// User: fetch own orders
router.post("/userorders", authMiddleware, userOrders);

// User: cancel order
router.post("/cancel", authMiddleware, cancelOrder);

export default router;

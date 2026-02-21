import express from "express";
import mongoose from "mongoose";
import os from "os";

const router = express.Router();

router.get("/health", async (req, res) => {
    try {
        const dbState = mongoose.connection.readyState;

        if (dbState !== 1) {
            return res.status(500).json({
                success: false,
                message: "Database not connected"
            });
        }

        // Active ping to ensure db is genuinely responsive
        await mongoose.connection.db.admin().ping();

        const memoryUsage = process.memoryUsage();

        res.status(200).json({
            success: true,
            uptime: process.uptime(),
            message: "OK",
            timestamp: Date.now(),
            database: {
                status: "connected",
                type: "mongodb"
            },
            system: {
                freeMemory: `${(os.freemem() / 1024 / 1024).toFixed(2)} MB`,
                totalMemory: `${(os.totalmem() / 1024 / 1024).toFixed(2)} MB`,
                memoryUsagePercentage: `${((1 - os.freemem() / os.totalmem()) * 100).toFixed(2)}%`,
                loadAverage: os.loadavg(), // CPU load
                heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
                heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`
            }
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Health check failed"
        });
    }
});

export default router;

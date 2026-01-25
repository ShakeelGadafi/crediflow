const dashboardService = require('../services/dashboard.service');

const getCreditStats = async (req, res) => {
    try {
        const stats = await dashboardService.getCreditStats();
        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getUtilityStats = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const stats = await dashboardService.getUtilityStats(days);
        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getExpenditureStats = async (req, res) => {
    try {
        const { from, to } = req.query;
        const stats = await dashboardService.getExpenditureStats(from, to);
        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getSupplierStats = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const stats = await dashboardService.getSupplierStats(days);
        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    getCreditStats,
    getUtilityStats,
    getExpenditureStats,
    getSupplierStats
};

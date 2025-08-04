// routes/favorites.js

const express = require('express');
const router = express.Router();
const Favorites = require('../models/Favorites');
const Plants = require('../models/Plants');


/**
 * @swagger
 * /favorites/check:
 *   get:
 *     summary: Belirli bir bitki favorilenmiş mi?
 *     tags: [Favorites]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Kullanıcı ID'si
 *       - in: query
 *         name: plantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Bitki ID'si
 *     responses:
 *       200:
 *         description: Favori kontrol sonucu
 */


router.get('/', async (req, res) => {
  try {
    const favorites = await Favorites.find({});     

    res.status(200).json({ success: true, data: favorites });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Belirli bir kullanıcı, belirli bir bitkiyi favorilere eklemiş mi kontrol etmek.

router.get('/check', async (req, res) => {
  try {
    const { userId, plantId } = req.query;
    const exists = await Favorites.exists({ userId, plantId });
    res.status(200).json({ success: true, isFavorited: exists});
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});


router.post('/', async (req, res) => {
  try {
    const { userId, plantId } = req.body;

    if (!userId || !plantId) {
      return res.status(400).json({
        success: false,
        message: 'userId ve plantId zorunludur.'
      });
    }

    const fav = new Favorites({ userId, plantId });
    await fav.save();

    res.status(201).json({ success: true, data: fav });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


/**
 * @swagger
 * /favorites:
 *   delete:
 *     summary: Favoriden bitki çıkar
 *     tags: [Favorites]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - plantId
 *             properties:
 *               userId:
 *                 type: string
 *               plantId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Favoriden çıkarıldı
 *       404:
 *         description: Favori kaydı bulunamadı
 */
router.delete('/', async (req, res) => {
  try {
    const { userId, plantId } = req.body;
    const deleted = await Favorites.findOneAndDelete({ userId, plantId });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Favori bulunamadı' });
    }

    res.status(200).json({ success: true, message: 'Favoriden çıkarıldı' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /favorites/user/{userId}:
 *   get:
 *     summary: Kullanıcının favori bitkilerini getir
 *     tags: [Favorites]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Kullanıcı ID'si
 *     responses:
 *       200:
 *         description: Favori bitkiler listelendi
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const favorites = await Favorites.find({ userId: req.params.userId })
      .populate('plantId', 'name image description');

    const favoritePlants = favorites.map(fav => fav.plantId);
    res.status(200).json({ success: true, data: favoritePlants });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});






module.exports = router;

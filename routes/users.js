/**
 * @swagger
 * tags:
 *   name: User
 *   description: Kullanıcı işlemleri (CRUD + arama, filtreleme)
 */

// Express framework'ünü import ediyoruz
const express = require('express');

// Router instance oluşturuyoruz - modüler route yapısı için
const router = express.Router();

// User model'ini import ediyoruz - database işlemleri için
const Users = require('../models/Users');

const queryBuilder = require('../utils/queryBuilder');
const { search } = require('./categories');


/**
 * @swagger
 * /users:
 *   get:
 *     summary: Kullanıcıları listele (arama, sıralama, filtreleme, sayfalama)
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Kullanıcılar başarıyla listelendi
 */

// ===== CRUD İŞLEMLERİ (Create, Read, Update, Delete) =====


//  buraya queryb ekledin gelişmmiş sorgu için 
// 1. READ - Gelişmiş sorgulu kullanıcı listesi (GET /api/users)
router.get('/', async (req, res) => {
    try {
        const result = await queryBuilder(Users, req, {
            allowedSortFields: ['firstName', 'lastName', 'createdAt'],  //createdAt tarihe göre sıralar kullancıları - ise azalıyor 
            allowedFilterFields: ['status'],  //statusa göre sıralıyor
            searchFields: ['firstName', 'lastName', 'email'],
            defaultLimit: 10, 
            maxLimit: 100
        });

        res.status(200).json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({  //sunucu hatası
            success: false,
            message: error.message
        });
    }
});

 /**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: ID'ye göre kullanıcı getir
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Kullanıcının MongoDB ID'si
 *     responses:
 *       200:
 *         description: Kullanıcı bulundu
 *       404:
 *         description: Kullanıcı bulunamadı
 */

// 2. READ - Tek kullanıcı getir (GET /api/users/:id)
// URL Parameters: :id dinamik parametre (örn: /api/users/123)
router.get('/:id', async (req, res) => {
    try {
        // req.params.id: URL'den gelen dinamik parametre
        // Users.findById(): MongoDB'de ID'ye göre tek kayıt bulma
        const user = await Users.findById(req.params.id);

        // Kullanıcı bulunamadığında kontrol
        if (!user) {
            // HTTP 404 (Not Found) - Kayıt bulunamadı
            return res.status(404).json({
                success: false,
                message: 'Kullanıcı bulunamadı'
            });
        }

        // Başarılı durumda kullanıcı verisini döndür
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        // Geçersiz ID formatı vb. hatalar için
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Yeni kullanıcı oluştur
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       201:
 *         description: Kullanıcı oluşturuldu
 *       400:
 *         description: Hatalı istek
 */

// 3. CREATE - Yeni kullanıcı oluştur (POST /api/users)
// HTTP POST method: Yeni veri oluşturma işlemleri için kullanılır
router.post('/', async (req, res) => {
    try {
        // req.body: HTTP request'in body'sinden gelen veri (JSON)
        // new Users(): Yeni kullanıcı instance'ı oluştur
        const user = new Users(req.body);

        // await user.save(): Veritabanına kaydet
        // Mongoose validation'ları burada çalışır
        await user.save();

        // HTTP 201 (Created) - Başarılı oluşturma
        res.status(201).json({
            success: true,
            message: 'Kullanıcı oluşturuldu',
            data: user  // Oluşturulan kullanıcı verisi (ID dahil)
        });
    } catch (error) {
        // Validation hatası vb. için HTTP 400 (Bad Request)
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Kullanıcıyı güncelle
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Güncellenecek kullanıcı ID'si
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Kullanıcı başarıyla güncellendi
 *       400:
 *         description: Hatalı istek
 *       404:
 *         description: Kullanıcı bulunamadı
 */


// 4. UPDATE - Kullanıcı güncelle (PUT /api/users/:id)
// HTTP PUT method: Mevcut veriyi güncelleme işlemleri için kullanılır
router.put('/:id', async (req, res) => {
    try {
        // Users.findByIdAndUpdate(): ID'ye göre bul ve güncelle
        // Parametreler: (id, updateData, options)
        const user = await Users.findByIdAndUpdate(
            req.params.id,          // Güncellenecek kayıt ID'si
            req.body,               // Güncellenecek veri
            {
                new: true,          // Güncellenmiş veriyi döndür (false: eski veri)
                runValidators: true // Mongoose validation'larını çalıştır
            }
        );

        // Kullanıcı bulunamadığında kontrol
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Kullanıcı bulunamadı'
            });
        }

        // Başarılı güncelleme response'u
        res.json({
            success: true,
            message: 'Kullanıcı güncellendi',
            data: user  // Güncellenmiş kullanıcı verisi
        });
    } catch (error) {
        // Validation hatası için HTTP 400
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Kullanıcıyı sil
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Silinecek kullanıcı ID'si
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Kullanıcı silindi
 *       404:
 *         description: Kullanıcı bulunamadı
 */

// 5. DELETE - Kullanıcı sil (DELETE /api/users/:id)
// HTTP DELETE method: Veri silme işlemleri için kullanılır
router.delete('/:id', async (req, res) => {
    try {
        // Users.findByIdAndDelete(): ID'ye göre bul ve sil
        const user = await Users.findByIdAndDelete(req.params.id);

        // Kullanıcı bulunamadığında kontrol
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Kullanıcı bulunamadı'
            });
        }

        // Başarılı silme response'u
        // Silinen veriyi döndürmek yerine sadece mesaj gönderiyoruz
        res.json({
            success: true,
            message: 'Kullanıcı silindi'
        });
    } catch (error) {
        // Silme işlemi hatası için HTTP 500
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Router'ı export ediyoruz
// Bu sayede routes/index.js'de import edilebilir
module.exports = router; 
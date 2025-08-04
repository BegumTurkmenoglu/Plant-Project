/**
 * @swagger
 * tags:
 *   name: Plants
 *   description: Bitki işlemleri (oluştur, listele, güncelle, sil, kategori ata)
 */

const express = require('express');
const router = express.Router();


const Plants = require('../models/Plants');

const upload = require('../config/multer');
const queryBuilder = require('../utils/queryBuilder');



router.get('/', async (req, res) => {
  try {

    // Eğer ?category=... parametresi varsa, kategori adına göre ID bulup categoryId olarak filtreye ekle
    // ?category=İç Mekan gibi bir kategori adı geldiyse, categoryId'sini bul ve filtreye ekle

    // Advanced Query Builder kullanıyoruz
    // Professional response format ile
    const result = await queryBuilder(Plants, req, {
      // Query Builder konfigürasyonu
      defaultLimit: 5,           // Varsayılan sayfa boyutu
      maxLimit: 50,              // Maksimum sayfa boyutu
      defaultSort: 'createdAt',   // Varsayılan sıralama field'ı

      // Güvenlik: Hangi field'larda sıralama yapılabilir
      allowedSortFields: ['name', 'status', 'createdAt', 'updatedAt'],

      // Güvenlik: Hangi field'larda filtreleme yapılabilir
      allowedFilterFields: ['name', 'description', 'status', 'categoryIds'],

      // İsterseniz tüm field'lara izin vermek için: allowedFilterFields: []

      // Global search: Hangi field'larda arama yapılabilir
      searchFields: ['name', 'description', 'categoryIds'],

      // Date filtering için hangi field kullanılacak
      dateField: 'createdAt'
    });


    await Plants.populate(result.data, { path: 'categoryIds' });

    // Image URL'lerini data'ya ekliyoruz
    const dataWithImageUrls = result.data.map(plant => ({
      ...plant.toObject(),
      // Her bitki için tam image URL'ini ekliyoruz
      imageUrl: `${req.protocol}://${req.get('host')}/images/${plant.image}`
    }));


    // Professional response format
    // data field'ını güncellenmiş verilerle değiştiriyoruz
    const response = {
      ...result,
      data: dataWithImageUrls,
      success: true
    };

    // HTTP 200 (OK) status code ile başarılı response
    res.json(response);

  } catch (error) {
    // Hata durumunda HTTP 500 (Internal Server Error)
    // try-catch: Hata yakalama ve yönetimi
    res.status(500).json({
      success: false,
      message: error.message  // Hata mesajı
    });
  }
});

// ===== GET PLANT BY ID =====
router.get('/:id', async (req, res) => {
  try {
    const plants = await Plants.findById(req.params.id).populate('categoriesIds', 'name description');
    if (!plants) {
      return res.status(404).json({ success: false, message: 'Bitki bulunamadı' });
    }

    res.json({
      success: true,
      data: {
        ...plants.toObject(),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${plants.image}`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
/**
 * @swagger
 * /plants/{id}/related:
 *   get:
 *     summary: Aynı kategorideki diğer bitkileri getir
 *     tags: [Plants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Referans alınacak bitkinin ID’si
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: İlgili bitkiler başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Plants'
 *       404:
 *         description: Bitki bulunamadı
 *       500:
 *         description: Sunucu hatası
 */


//Aynı kategorideki diğer bitkiler kendisi hariç oluyor
router.get('/:id/related', async (req, res) => {
  try {
    const currentPlants = await Plants.findById(req.params.id);
    if (!currentPlants) {
      return res.status(404).json({ success: false, message: 'Bitki bulunamadı' });
    }

    // Aynı kategorideki diğer bitkileri getir (kendisi hariç)
    const relatedPlants = await Plants.find({
      _id: { $ne: currentPlants._id },
      categoriesIds: { $in: currentPlants.categoriesIds }
    }).limit(10);

    res.status(200).json({ success: true, data: relatedPlants });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



/**
 * @swagger
 * /plants:
 *   post:
 *     summary: Yeni bitki oluştur
 *     tags: [Plants]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               categoriesIds:
 *                 type: string
 *                 example: "id1,id2"
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Bitki başarıyla oluşturuldu
 */

// ===== CREATE PLANTs =====
router.post('/', upload.single('image'), async (req, res) => {
  try {
    let categoriesIds = req.body.categoriesIds;

    if (!categoriesIds) {
      return res.status(400).json({ success: false, message: "Kategori seçilmedi" });
    }

    if (typeof categoriesIds === 'string') {
      categoriesIds = categoriesIds.split(',');
    }

    const plants = new Plants({
      name: req.body.name,
      description: req.body.description,
      categoriesIds: categoriesIds,
      image: req.file.filename
    });

    await plants.save();
    res.status(201).json({ success: true, data: plants });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /plants/{id}:
 *   put:
 *     summary: Bitki güncelle
 *     tags: [Plants]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Güncellenecek bitki ID'si
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *               categoriesIds:
 *                 type: string
 *                 example: "id1,id2"
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Bitki başarıyla güncellendi
 */

// ===== UPDATE PLANTs =====
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const existingPlants = await Plants.findById(req.params.id);
    if (!existingPlants) {
      return res.status(404).json({ success: false, message: 'Bitki bulunamadı' });
    }

    let categoriesIds = req.body.categoriesIds || existingPlants.categoriesIds;
    if (typeof categoriesIds === 'string') {
      categoriesIds = categoriesIds.split(',');
    }

    const updateData = {
      name: req.body.name || existingPlants.name,
      description: req.body.description || existingPlant.description,
      status: req.body.status || existingPlants.status,
      categoriesIds: categoriesIds
    };

    if (req.file) {
      const fs = require('fs');
      const path = require('path');
      const oldImagePath = path.join('public/images', existingPlants.image);
      fs.unlink(oldImagePath, err => {
        if (err) console.error('Eski dosya silme hatası:', err);
      });
      updateData.image = req.file.filename;
    } else {
      updateData.image = existingPlants.image;
    }

    const plants = await Plants.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      message: 'Bitki güncellendi',
      data: {
        ...plants.toObject(),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${plants.image}`
      }
    });
  } catch (error) {
    if (req.file) {
      const fs = require('fs');
      fs.unlink(req.file.path, err => {
        if (err) console.error('Dosya silme hatası:', err);
      });
    }

    res.status(400).json({ success: false, message: error.message });
  }
});
/**
 * @swagger
 * /plants/{id}:
 *   delete:
 *     summary: Bitki sil
 *     tags: [Plants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Silinecek bitki ID'si
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bitki başarıyla silindi
 */

// ===== DELETE PLANTs =====
router.delete('/:id', async (req, res) => {
  try {
    const plants = await Plants.findById(req.params.id);
    if (!plants) {
      return res.status(404).json({ success: false, message: 'Bitki bulunamadı' });
    }

    await Plants.findByIdAndDelete(req.params.id);

    const fs = require('fs');
    const path = require('path');
    const imagePath = path.join('public/images', plants.image);
    fs.unlink(imagePath, err => {
      if (err) console.error('Resim silme hatası:', err);
    });

    res.json({
      success: true,
      message: 'Bitki ve resmi silindi',
      deletedData: {
        id: plants._id,
        name: plants.name,
        deletedImage: plants.image
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /plants/assign-categories:
 *   post:
 *     summary: Birden fazla kategori, birden fazla bitkiye ata
 *     tags: [Plants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               plantIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               categoriesIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Kategoriler başarıyla atandı
 */
// ===== ASSIGN MULTIPLE CATEGORIES TO MULTIPLE PLANTS =====
router.post('/assign-categories', async (req, res) => { ///api/plants/assign-categories gibi bir adrese gelen POST isteklerini işler.
  try {
    const { plantsIds, categoriesIds } = req.body; //İstek gövdesinden (body) plantsIds ve categorIds dizileri alınır.

    if (!Array.isArray(plantsIds) || !Array.isArray(categoriesIds)) { //Gelen veriler dizi (array) mi diye kontrol edilir.
      return res.status(400).json({
        success: false,
        message: 'plantsIds ve categoriesIds diziler olmalıdır.'
      });
    }

    // Aynı anda birden fazla bitkiye, birden fazla kategori eklenir
    await Plants.updateMany(
      { _id: { $in: plantsIds } },
      { $addToSet: { categoriesIds: { $each: categoriesIds } } }
    );

    res.status(200).json({
      success: true,
      message: 'Kategoriler bitkilere başarıyla atandı.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



module.exports = router;

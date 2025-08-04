/**
 * @swagger
 * components:
 *   schemas:
 *     Plants:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - image
 *         - categoriesIds
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB ID
 *         name:
 *           type: string
 *           description: Bitkinin adı
 *         description:
 *           type: string
 *           description: Açıklama
 *         image:
 *           type: string
 *           description: Resim dosya adı
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           description: Durum
 *         categoriesIds:
 *           type: array
 *           items:
 *             type: string
 *           description: Kategori ID'leri
 *         favoriteCount:
 *           type: integer
 *           description: Favoriye eklenme sayısı
 *           default: 0
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */



const mongoose = require('mongoose');

// Plants (Bitki) modeli için schema tanımı
// Bu schema bitki bilgilerini saklamak için kullanılacak
const plantsSchema = new mongoose.Schema({
    // name field'ı - Bitki adı
    name: {
        type: String,        // Veri tipi: String (metin)
        required: true,      // Zorunlu alan: Bitki adı mutlaka girilmeli
        unique: true         // Benzersiz: Aynı isimde 2 bitki olamaz
    },
    
    // description field'ı - Bitki açıklaması
    description: {
        type: String,        // Bitki hakkında detaylı bilgi
        required: true       // Zorunlu alan: Açıklama mutlaka girilmeli
    },
    
    // image field'ı - Bitki resmi
    image: {
        type: String,        // Resim URL'si veya dosya yolu String olarak saklanır
        required: true       // Zorunlu alan: Her bitkinin resmi olmalı
    },
    
    // status field'ı - Bitkinin durumu (aktif/pasif)
    status: {
        type: String,                    // Veri tipi: String
        enum: ['active', 'inactive'],    // Enum validation: Sadece bu 2 değer kabul edilir
        default: 'active'                // Varsayılan değer: Yeni bitkiler aktif olur
    },
    //array yaptım aynı bitkiyi birden fazla kategoriye bağlayabilirsin.
categoriesIds: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Categories',
    required: true
  }
],

}, {
    // Schema configuration (yapılandırma) seçenekleri
    timestamps: true    // Otomatik zaman damgaları ekler:
    // - createdAt: Bitki kaydının oluşturulma tarihi
    // - updatedAt: Son güncelleme tarihi
    // Bu field'lar MongoDB tarafından otomatik yönetilir
});

// Model oluşturma ve dışa aktarma
// 'Plants' model adı -> MongoDB'de 'plants' collection'ı oluşur
// Mongoose otomatik olarak model ismini küçük harfe çevirir ve çoğul yapar
module.exports = mongoose.model('Plants', plantsSchema); 
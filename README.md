# 🌍 3D İklim Dünyası | Climate Action

İklim değişikliğini görselleştiren interaktif 3D dünya uygulaması.

## 🎯 Özellikler

- **3D Dünya**: Three.js ile oluşturulmuş gerçekçi dünya modeli
- **Döner Animasyon**: Dünya yavaşça kendi ekseni etrafında döner
- **Dinamik Renk Değişimi**: Kıtalar yeşilden sarıya (kuraklık) döner ve tekrar yeşile dönmeye başlar
- **10 Saniyelik Döngü**: Renk değişim animasyonu 10 saniyede tamamlanır
- **Responsive Tasarım**: Tüm ekran boyutlarında uyumlu çalışır
- **Otomatik Başlangıç**: Her sayfa yenilendiğinde animasyon baştan başlar

## 🚀 Kurulum

1. **Bağımlılıkları yükleyin:**
   \`\`\`bash
   npm install
   \`\`\`

2. **Geliştirme sunucusunu başlatın:**
   \`\`\`bash
   npm run dev
   \`\`\`

3. **Tarayıcınızda açın:**
   [http://localhost:3000](http://localhost:3000)

## 🛠️ Teknolojiler

- **Next.js 14** - React framework
- **Three.js** - 3D grafik kütüphanesi
- **TypeScript** - Tip güvenliği
- **Custom Shaders** - GLSL ile kıta ve okyanus renderlama

## 📦 Proje Yapısı

\`\`\`
├── components/
│   └── Earth3D.tsx          # Ana 3D dünya komponenti
├── pages/
│   ├── _app.tsx             # Next.js uygulama wrapper
│   └── index.tsx            # Ana sayfa
├── styles/
│   └── globals.css          # Global stiller
├── package.json
├── tsconfig.json
└── next.config.js
\`\`\`

## 🎨 Animasyon Detayları

- **Kıtalar**: Procedural şaderler ile oluşturulan gerçekçi kıta şekilleri
- **Okyanuslar**: Mavi tonlarda statik arka plan
- **Renk Geçişi**: 
  - 0-5 saniye: Yeşilden sarıya
  - 5-10 saniye: Sarıdan yeşile
- **Dönüş Hızı**: Saniyede 0.005 radyan (yaklaşık 1 dakikada tam tur)

## 🌱 İklim Mesajı

Bu proje, iklim değişikliğinin kıtalardaki etkilerini görsel olarak temsil eder:
- **Yeşil**: Sağlıklı, nemli ekosistemler
- **Sarı**: Kuraklık, çölleşme ve iklim stresi
- **Döngü**: Doğanın kendini yenileme kapasitesi

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. 
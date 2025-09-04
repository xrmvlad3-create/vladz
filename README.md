# 🏥 IzaManagement - Platforma Medicală AI Completă

> **Platformă educațională și de management pentru profesioniștii din sănătate din România**

[![Version](https://img.shields.io/badge/version-2025.1.0-blue.svg)](https://github.com/izamanagement/platform)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![PHP](https://img.shields.io/badge/PHP-8.2+-777BB4.svg?logo=php)](https://php.net/)
[![Laravel](https://img.shields.io/badge/Laravel-11.0-FF2D20.svg?logo=laravel)](https://laravel.com/)
[![React](https://img.shields.io/badge/React-18.0-61DAFB.svg?logo=react)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791.svg?logo=postgresql)](https://postgresql.org/)

## 🎯 Despre Proiect

**IzaManagement** este o platformă avansată dezvoltată pentru profesioniștii din domeniul sănătății din România, oferind:

- 🤖 **Asistent AI Medical** cu diagnostic diferențial
- 📚 **Biblioteca Medicală** cu 2000+ afecțiuni
- 🎓 **Sistem EMC** (Educație Medicală Continuă)
- 📊 **Analytics** și **Dashboard** interactiv
- 🔐 **Compliance GDPR** și securitate medicală

## 📊 Statistici Proiect

| Component | Fișiere | Linii de Cod |
|-----------|---------|--------------|
| Backend Laravel | 15 | 4,902 |
| Frontend React | 6 | 2,890 |
| Migrații DB | 7 | 362 |
| Deployment | 6 | 1,043 |
| **TOTAL** | **34** | **9,197** |

## 🏗️ Arhitectura Tehnică

### Backend Stack
- **Laravel 11** - Framework PHP modern
- **PHP 8.2+** - Limbaj de programare
- **PostgreSQL 15** - Baza de date robustă
- **Redis** - Cache și queue management
- **Laravel Sanctum** - Autentificare API
- **Spatie Permissions** - Sistem roluri

### Frontend Stack
- **React 18** - Bibliotecă UI moderna
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling utility-first
- **Shadcn/UI** - Componente UI
- **Chart.js** - Vizualizare date

### AI Integration
- **Groq API** - Llama-3.1-70B (Cloud)
- **Ollama** - Modele locale (Privacy)
- **Hybrid Fallback** - Redundanță inteligentă
- **Image Analysis** - Procesare imagini medicale

### DevOps & Deployment
- **Docker Compose** - Orchestrare servicii
- **Nginx** - Web server cu SSL/HTTP2
- **PostgreSQL** - Baza de date
- **Redis** - Cache și sesiuni
- **Grafana + Prometheus** - Monitoring
- **Automated Backups** - Siguranță date

## 🚀 Funcționalități Principale

### 🤖 Asistent AI Medical
- Diagnostic diferențial automatizat
- Analiză imagini medicale
- Recomandări de tratament
- Evaluare urgență medicală
- Procesare multimodală (text + imagini)

### 📚 Biblioteca Medicală
- 2000+ afecțiuni medicale documentate
- Codificare ICD-10, ICD-11, SNOMED CT
- Protocoale de tratament
- Ghiduri clinice actualizate
- Sistem de căutare avansat

### 🎓 Sistem EMC
- Cursuri acreditate pentru medici
- Certificare automată
- Tracking credite EMC
- Evaluări și teste
- Progres individualizat

### 📊 Dashboard & Analytics
- Vizualizări interactive
- Statistici utilizare AI
- Progres cursuri
- Metrici performanță
- Rapoarte personalizate

### 🔐 Securitate & Compliance
- Criptare end-to-end date medicale
- Audit trail complet (GDPR)
- Autentificare 2FA
- Rate limiting DDoS protection
- Backup automatizat criptat

## 🛠️ Instalare și Configurare

### Prerequisite
- Docker & Docker Compose
- Git
- Certificat SSL (Let's Encrypt)

### 1. Clonare Proiect
```bash
git clone https://github.com/izamanagement/platform.git
cd izamanagement
```

### 2. Configurare Mediu
```bash
cp .env.production .env
# Editați variabilele de mediu necesare
```

### 3. Deployment Automatizat
```bash
chmod +x deployment.sh
sudo ./deployment.sh
```

### 4. Verificare Servicii
```bash
docker-compose ps
curl https://izamanagement.ro/health
```

## 🔧 Variabile de Mediu Importante

```env
# Aplicație
APP_NAME="IzaManagement"
APP_ENV=production
APP_URL=https://izamanagement.ro

# Baza de Date
DB_CONNECTION=pgsql
DB_HOST=postgres
DB_DATABASE=izamanagement

# AI Services
GROQ_API_KEY=your_groq_api_key
OLLAMA_BASE_URL=http://ollama:11434

# Security
SANCTUM_STATEFUL_DOMAINS=izamanagement.ro
SESSION_DOMAIN=.izamanagement.ro
```

## 📖 Documentație API

### Endpoint-uri Principale

#### Autentificare
```http
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
```

#### Asistent AI
```http
POST /api/ai-assistant/message
POST /api/ai-assistant/analyze-images
POST /api/ai-assistant/differential-diagnosis
```

#### Afecțiuni Medicale
```http
GET    /api/medical-conditions
POST   /api/medical-conditions
GET    /api/medical-conditions/{id}
PUT    /api/medical-conditions/{id}
DELETE /api/medical-conditions/{id}
```

#### Cursuri
```http
GET  /api/courses
POST /api/courses/{id}/enroll
GET  /api/courses/{id}/progress
```

### Exemple Utilizare

#### Diagnostic Diferențial
```javascript
const response = await fetch('/api/ai-assistant/differential-diagnosis', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    symptoms: ['durere toracică', 'dispnee', 'palpitații'],
    age: 45,
    gender: 'masculin',
    session_id: 'unique-session-id'
  })
});
```

#### Analiză Imagini Medicale
```javascript
const formData = new FormData();
formData.append('images[0]', imageFile);
formData.append('context', 'Radiografie toracică - suspiciune pneumonie');

const response = await fetch('/api/ai-assistant/analyze-images', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  },
  body: formData
});
```

## 🔍 Monitoring și Mentenanță

### Health Checks
```bash
# Verificare manuală
/usr/local/bin/izamanagement-health.sh

# Log-uri aplicație
docker-compose logs -f app

# Log-uri AI
docker-compose logs -f ollama
```

### Backup și Recovery
```bash
# Backup manual
docker/backup/backup.sh

# Restore
docker exec postgres psql -U izauser -d izamanagement < backup.sql
```

### Monitoring URLs
- **Aplicația**: https://izamanagement.ro
- **API Status**: https://api.izamanagement.ro/health
- **Grafana**: https://izamanagement.ro:3000
- **Prometheus**: https://izamanagement.ro:9090

## 🧪 Testare

### Backend Tests
```bash
docker-compose exec app php artisan test
docker-compose exec app php artisan test --coverage
```

### Frontend Tests
```bash
npm run test
npm run test:coverage
```

### AI Services Test
```bash
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model": "llama3.1:8b", "prompt": "Test message"}'
```

## 🔐 Securitate

### Audit și Compliance
- **GDPR Compliant** - Gestionare date personale
- **HIPAA Ready** - Securitate date medicale
- **Audit Trail** - Urmărire toate acțiunile
- **Data Retention** - Retenție 7 ani conform legii

### Măsuri de Securitate
- SSL/TLS encryption
- Rate limiting API
- Fail2ban protection
- Database encryption
- Secure headers
- CORS protection

## 📈 Performanță

### Metrici Țintă
- ⚡ API Response: < 200ms
- ⚡ AI Processing: < 5 secunde
- ⚡ Dashboard Load: < 1 secundă
- ⚡ Availability: 99.9%

### Optimizări
- Redis caching
- Database indexing
- CDN pentru assets
- Gzip compression
- Laravel optimization
- React lazy loading

## 🤝 Contribuție

### Ghid Dezvoltare
1. Fork repository-ul
2. Creați branch pentru feature (`git checkout -b feature/AmazingFeature`)
3. Commit modificările (`git commit -m 'Add some AmazingFeature'`)
4. Push la branch (`git push origin feature/AmazingFeature`)
5. Deschideți Pull Request

### Coding Standards
- **PSR-12** pentru PHP
- **ESLint/Prettier** pentru JavaScript/TypeScript
- **Conventional Commits** pentru mesaje
- **PHPDoc** și **JSDoc** pentru documentație

## 📄 Licență

Acest proiect este licențiat sub licența MIT - vezi fișierul [LICENSE](LICENSE) pentru detalii.

## 👥 Echipa

**Dezvoltator Principal**: IzaAI Assistant  
**Contact**: admin@izamanagement.ro  
**Website**: https://izamanagement.ro

## 🙏 Mulțumiri

Mulțumim tuturor profesioniștilor din sănătate care au contribuit la dezvoltarea acestei platforme și au oferit feedback valoros pentru îmbunătățirea continuă.

---

<div align="center">

**🏥 IzaManagement v2025.1.0 - Platforma Medicală AI pentru România 🇷🇴**

[![Production Ready](https://img.shields.io/badge/Production-Ready-success.svg)](https://izamanagement.ro)
[![Docker](https://img.shields.io/badge/Docker-Optimized-0db7ed.svg?logo=docker)](https://docker.com/)
[![AI Powered](https://img.shields.io/badge/AI-Powered-ff6b6b.svg)](https://groq.com/)

</div>
# NT208-Project
## Các công nghệ sử dụng
## Thư mục

hotel-booking-system/
│
├── README.md
├── docs/ # Tài liệu: yêu cầu, thiết kế, ERD…
│
├── infrastructure/ # IaC, docker-compose, k8s manifests…
│
├── config/ # Cấu hình chung (env, constants, config)
│
├── frontend/ # Ứng dụng Vue.js
│ ├── public/ # index.html, favicon, robots.txt…
│ └── src/
│ ├── assets/ # Hình ảnh, fonts, icons…
│ ├── components/ # UI components tái sử dụng
│ ├── views/ # Các page (Home, Dashboard, Reports…)
│ ├── router/ # Định tuyến (Vue Router)
│ ├── store/ # State management (Vuex hoặc Pinia)
│ ├── services/ # API calls (axios)
│ ├── utils/ # Helpers, validators…
│ ├── plugins/ # Các plugin như vuetify, chart.js cho báo cáo…
│ └── styles/ # SCSS, global styles…
│ ├── backend/ # Server Express (Node.js)
│ ├── src/
│ │ ├── controllers/ # Định nghĩa các endpoint (API)
│ │ ├── routes/ # Định tuyến
│ │ ├── services/ # Logic nghiệp vụ (booking, reports)
│ │ ├── models/ # Mô hình ORM (MongoDB, Sequelize…) hoặc schema
│ │ ├── middlewares/ # JWT auth, error handler…
│ │ ├── utils/ # Helpers chung (token generation, hashing…)
│ │ ├── config/ # Cấu hình môi trường (JWT, DB, etc.)
│ │ ├── database/ # Migration, seeders, connection logic
│ │ └── services/ # Logic cho báo cáo, thống kê
│ ├── tests/ # Unit tests cho API và logic nghiệp vụ
│ ├── package.json # Các dependency của backend
│ └── .env # Biến môi trường cho server
│ ├── scripts/ # CLI scripts, seed DB, deploy helpers…
│
├── tests/ # E2E tests (Cypress, Playwright…)
│
├── .env.example # Mẫu biến môi trường cho môi trường phát triển
├── package.json # Quản lý các dependency chung cho cả frontend và backend
└── yarn.lock / package-lock.json

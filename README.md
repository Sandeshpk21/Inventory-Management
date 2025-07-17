<<<<<<< HEAD
# 🏭 Inventory Management System

A complete inventory management system for electric control panel manufacturing units, built with FastAPI backend and React frontend.

## 🚀 Features

### 📦 Purchase Orders (PO)
- Create purchase orders with multiple items
- Auto-generated PO numbers
- Track delivery status (Pending/Received)
- Automatic stock updates when PO is received
- Transaction logging

### 📋 Requirements Management
- Create project requirements with multiple items
- Real-time stock availability checking
- Issue items to projects automatically
- Track project completion status

### 🚨 To-Be-Ordered Tracking
- Automatic identification of items needing orders
- Shows shortage quantities
- Links to requiring projects
- Streamlined PO creation workflow

### 📊 Stock Management
- Real-time stock level tracking
- Minimum stock level alerts
- Manual stock adjustments
- Item catalog management

### 📈 Transaction History
- Complete audit trail of all inventory movements
- Purchase, Issue, and Return tracking
- Linked to POs and Projects
- Dashboard with recent activity

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **Pydantic** - Data validation and serialization
- **SQLite** - Database (easily scalable to PostgreSQL/MySQL)
- **Alembic** - Database migrations

### Frontend
- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API communication
- **Lucide React** - Beautiful icons
- **Date-fns** - Date formatting utilities

## 📁 Project Structure

```
inventory-management-system/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py         # FastAPI application
│   │   ├── models.py       # SQLAlchemy models
│   │   ├── schemas.py      # Pydantic schemas
│   │   ├── database.py     # Database configuration
│   │   ├── crud.py         # CRUD operations
│   │   └── routers/        # API endpoints
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── App.jsx         # Main app component
│   ├── package.json        # Node.js dependencies
│   └── vite.config.js      # Vite configuration
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the backend server:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

The API will be available at `http://localhost:8000`
API documentation: `http://localhost:8000/docs`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173`

## 📚 API Endpoints

### Purchase Orders
- `POST /purchase-orders/` - Create new PO
- `GET /purchase-orders/` - List all POs
- `GET /purchase-orders/{id}` - Get specific PO
- `PATCH /purchase-orders/{id}/receive` - Mark PO as received

### Requirements
- `POST /requirements/` - Create new requirement
- `GET /requirements/` - List all requirements
- `GET /requirements/{id}` - Get specific requirement
- `PATCH /requirements/{id}/issue` - Issue items for requirement

### Stock
- `GET /stock/` - List all stock levels
- `GET /stock/items` - List all items
- `POST /stock/items` - Create new item
- `PATCH /stock/{id}` - Update stock level

### Transactions
- `GET /transactions/` - List all transactions
- `GET /transactions/dashboard` - Dashboard summary
- `GET /transactions/to-be-ordered` - Items to be ordered

## 🎯 Usage Workflow

### 1. Setup Inventory Items
- Go to **Stock** page
- Add items with names, codes, and minimum stock levels
- Set initial stock quantities

### 2. Create Project Requirements
- Go to **Requirements** page
- Create new project requirement
- Add items needed for the project
- System shows stock availability status

### 3. Monitor To-Be-Ordered
- Go to **To-Be-Ordered** page
- View items that need ordering
- See which projects require each item

### 4. Create Purchase Orders
- Go to **Purchase Orders** page
- Create PO with items from to-be-ordered list
- Set supplier and delivery date

### 5. Receive Purchase Orders
- When items arrive, mark PO as received
- Stock levels automatically update
- Transactions are logged

### 6. Issue Items to Projects
- Go to **Requirements** page
- Issue items to projects when stock is available
- Track project completion

### 7. Monitor Dashboard
- View summary statistics
- Check recent transactions
- Monitor system health

## 🔧 Configuration

### Database
The system uses SQLite by default. To switch to PostgreSQL or MySQL:

1. Update `DATABASE_URL` in `backend/app/database.py`
2. Install appropriate database driver
3. Run migrations with Alembic

### Environment Variables
Create a `.env` file in the backend directory:
```env
DATABASE_URL=sqlite:///./inventory.db
SECRET_KEY=your-secret-key-here
```

## 🚀 Deployment

### Backend Deployment
1. Build the application:
   ```bash
   pip install -r requirements.txt
   ```

2. Use a production ASGI server like Gunicorn:
   ```bash
   gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
   ```

### Frontend Deployment
1. Build for production:
   ```bash
   npm run build
   ```

2. Serve the `dist` folder with a web server like Nginx

## 🔮 Future Enhancements

- [ ] JWT Authentication with user roles
- [ ] PDF/Excel report generation
- [ ] Multi-warehouse support
- [ ] Barcode/QR code scanning
- [ ] Mobile app (React Native/Flutter)
- [ ] Email notifications
- [ ] Advanced analytics and reporting
- [ ] Integration with accounting systems

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please open an issue in the repository. 
=======
# Inventory-Management
>>>>>>> 41a018963cd78129c38774bf86a1f95afd5930b6

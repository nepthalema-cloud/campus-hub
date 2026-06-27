# Campus Hub

A full-stack student networking platform built with Django REST Framework and React.

## Features

- **User Authentication**: Registration, login, and session-based authentication
- **Student Profiles**: Create and manage student profiles with profile images
- **Student Directory**: Browse and search for other students with filtering
- **Connections**: Send, accept, reject, and manage connection requests
- **Messaging**: Real-time messaging between connected students
- **Dashboard**: Personalized dashboard with statistics and quick actions

## Tech Stack

### Backend
- Django 6.0.6
- Django REST Framework
- SQLite (default database)
- Session-based authentication

### Frontend
- React 19.2.6
- Vite 8.0.12
- React Router 7.18.0
- Axios 1.18.0
- React Icons 5.6.0

## Project Structure

```
campus-hub/
├── accounts/              # Django app (models, views, serializers, URLs)
├── backend/              # Django project settings
├── frontend/             # React Vite application
├── media/                # Profile image uploads
├── db.sqlite3            # SQLite database
├── manage.py             # Django CLI
└── .env.example          # Environment variables template
```

## Development Setup

### Prerequisites
- Python 3.8+
- Node.js 18+
- npm or yarn

### Backend Setup

1. **Navigate to the project root**
   ```bash
   cd campus-hub
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv venv
   venv\Scripts\activate  # On Windows
   # or
   source venv/bin/activate  # On Linux/Mac
   ```

3. **Install dependencies**
   ```bash
   pip install django djangorestframework django-cors-headers
   ```

4. **Run migrations**
   ```bash
   python manage.py migrate
   ```

5. **Create environment file**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your settings (see Environment Variables section below).

6. **Run the development server**
   ```bash
   python manage.py runserver
   ```
   The backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to the frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   echo "VITE_API_URL=http://localhost:8000" > .env
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`

## Environment Variables

### Backend (.env)

```bash
# Django Settings
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1

# CORS Settings
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
CSRF_TRUSTED_ORIGINS=http://localhost:5173,http://localhost:5174

# Security (set to True in production)
SESSION_COOKIE_SECURE=False
CSRF_COOKIE_SECURE=False
```

### Frontend (.env)

```bash
VITE_API_URL=http://localhost:8000
```

## Production Deployment

### Backend Production Setup

1. **Set environment variables for production**
   ```bash
   DEBUG=False
   SECRET_KEY=<generate-a-secure-random-key>
   ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
   CORS_ALLOWED_ORIGINS=https://yourdomain.com
   CSRF_TRUSTED_ORIGINS=https://yourdomain.com
   SESSION_COOKIE_SECURE=True
   CSRF_COOKIE_SECURE=True
   ```

2. **Generate a secure SECRET_KEY**
   ```bash
   python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
   ```

3. **Collect static files**
   ```bash
   python manage.py collectstatic
   ```

4. **Use a production database**
   - For PostgreSQL, install `psycopg2-binary` and configure `DATABASE_URL`
   - For SQLite, ensure the file is in a secure location

5. **Use a production WSGI server**
   - Install Gunicorn: `pip install gunicorn`
   - Run: `gunicorn backend.wsgi:application`

### Frontend Production Setup

1. **Build the frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Set production API URL**
   ```bash
   VITE_API_URL=https://yourdomain.com
   ```

3. **Serve the built files**
   - Use Nginx, Apache, or any static file server
   - Configure reverse proxy to forward API requests to Django backend

### Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend static files
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Media files
    location /media/ {
        alias /path/to/media/;
    }
}
```

## API Endpoints

### Authentication
- `POST /api/register/` - Register new user
- `POST /api/login/` - Login user
- `POST /api/logout/` - Logout user
- `GET /api/me/` - Get current user

### Profile
- `GET /api/profile/` - Get user profile
- `POST /api/profile/create/` - Create profile
- `POST /api/profile/update/` - Update profile
- `DELETE /api/account/delete/` - Delete account

### Directory
- `GET /api/directory/` - Get student directory (with search/filter)

### Connections
- `POST /api/connections/send/<id>/` - Send connection request
- `POST /api/connections/accept/<id>/` - Accept connection
- `POST /api/connections/reject/<id>/` - Reject connection
- `DELETE /api/connections/remove/<id>/` - Remove connection
- `GET /api/connections/` - Get connection lists

### Messaging
- `GET /api/messages/<user_id>/` - Get conversation
- `POST /api/messages/send/<user_id>/` - Send message
- `PUT /api/messages/edit/<message_id>/` - Edit message
- `DELETE /api/messages/delete/<message_id>/` - Delete message
- `GET /api/messages/unread/` - Get unread counts

## Security Notes

- Profile images are validated for size (max 5MB) and type (JPEG, PNG, GIF, WebP)
- Year field is validated to be between 1900 and 10 years in the future
- CSRF protection is enabled on all state-changing requests
- Session-based authentication with secure cookie settings in production
- CORS is configured to only allow specified origins

## License

This project is for educational purposes.

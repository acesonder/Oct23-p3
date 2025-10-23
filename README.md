# WebApp - PHP MySQL Application

A modern web application with user authentication, profile management, and light/dark theme support.

## Features

- **User Authentication**: Secure login and registration system with password hashing
- **Profile Management**: Full CRUD operations (Create, Read, Update, Delete) for user profiles
- **Theme Toggle**: Switch between light and dark modes with persistent preference
- **Ajax-Powered**: Smooth, dynamic user experience without page reloads
- **Modular Design**: Separated header, footer, navbar, and marquee components for easy maintenance
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Technologies Used

- **Backend**: PHP 7.4+
- **Database**: MySQL
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Ajax**: Fetch API for asynchronous requests

## Project Structure

```
Oct23-p3/
├── api/
│   ├── login.php          # Login API endpoint
│   ├── register.php       # Registration API endpoint
│   ├── profile.php        # Profile CRUD API endpoint
│   └── logout.php         # Logout API endpoint
├── config/
│   └── database.php       # Database configuration and connection
├── css/
│   └── style.css          # Main stylesheet with theme support
├── includes/
│   ├── header.php         # Page header component
│   ├── navbar.php         # Navigation bar component
│   ├── marquee.php        # Scrolling marquee component
│   └── footer.php         # Page footer component
├── js/
│   ├── theme.js           # Theme toggle functionality
│   └── ajax.js            # Ajax helper functions
├── index.php              # Main landing page
├── login.php              # Login page
├── register.php           # Registration page
├── profile.php            # User profile page with CRUD
└── README.md              # This file
```

## Installation

### Prerequisites

- PHP 7.4 or higher
- MySQL 5.7 or higher
- Apache or Nginx web server
- Web browser

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/acesonder/Oct23-p3.git
   cd Oct23-p3
   ```

2. **Configure your web server**
   
   For Apache, ensure your document root points to the project directory or create a virtual host:
   ```apache
   <VirtualHost *:80>
       ServerName webapp.local
       DocumentRoot /path/to/Oct23-p3
       <Directory /path/to/Oct23-p3>
           AllowOverride All
           Require all granted
       </Directory>
   </VirtualHost>
   ```

3. **Configure database connection**
   
   Edit `config/database.php` and update the database credentials:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_USER', 'your_username');
   define('DB_PASS', 'your_password');
   define('DB_NAME', 'webapp_db');
   ```

4. **Initialize the database**
   
   The database and tables will be automatically created when you first access the application. The `index.php` file calls `initDatabase()` which:
   - Creates the database if it doesn't exist
   - Creates the users table with proper schema

5. **Access the application**
   
   Open your web browser and navigate to:
   - `http://localhost/index.php` (if using localhost)
   - `http://webapp.local` (if using virtual host)

## Usage

### Registration

1. Click "Register" in the navigation bar
2. Fill in the registration form with:
   - Username (unique)
   - Email (unique)
   - Full Name
   - Password (minimum 6 characters)
   - Confirm Password
3. Click "Register" button
4. Upon success, you'll be redirected to the login page

### Login

1. Click "Login" in the navigation bar
2. Enter your username/email and password
3. Click "Login" button
4. Upon success, you'll be redirected to your profile page

### Profile Management

Once logged in, you can:

- **View Profile**: See your account information
- **Edit Profile**: Update username, email, full name, or password
- **Delete Account**: Permanently remove your account (with confirmation)

### Theme Toggle

- Click the theme toggle button (🌙/☀️) in the navigation bar
- Your preference is saved in browser localStorage
- The theme persists across sessions

## API Endpoints

### POST /api/login.php
Login a user
- **Parameters**: `username`, `password`
- **Returns**: JSON with success status and message

### POST /api/register.php
Register a new user
- **Parameters**: `username`, `email`, `full_name`, `password`
- **Returns**: JSON with success status and message

### GET /api/profile.php?action=read
Get user profile information (requires authentication)
- **Returns**: JSON with user data

### POST /api/profile.php (action=update)
Update user profile (requires authentication)
- **Parameters**: `username`, `email`, `full_name`, `password` (optional)
- **Returns**: JSON with success status and message

### DELETE /api/profile.php?action=delete
Delete user account (requires authentication)
- **Returns**: JSON with success status and message

### POST /api/logout.php
Logout current user
- **Returns**: JSON with success status and message

## Database Schema

### users table

| Column      | Type         | Description                    |
|-------------|--------------|--------------------------------|
| id          | INT          | Primary key, auto-increment    |
| username    | VARCHAR(50)  | Unique username                |
| email       | VARCHAR(100) | Unique email address           |
| password    | VARCHAR(255) | Hashed password                |
| full_name   | VARCHAR(100) | User's full name               |
| created_at  | TIMESTAMP    | Account creation timestamp     |
| updated_at  | TIMESTAMP    | Last update timestamp          |

## Security Features

- Password hashing using PHP's `password_hash()` with bcrypt
- SQL injection prevention using prepared statements
- Session-based authentication
- Input validation and sanitization
- CSRF protection via session management

## Browser Compatibility

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
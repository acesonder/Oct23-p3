# WebApp Features Documentation

## Overview
This web application provides a complete user management system with authentication, profile management, and a modern UI with theme support.

## Core Features

### 1. User Authentication
- **Registration**: New users can create accounts with username, email, full name, and password
- **Login**: Users can log in using either username or email
- **Logout**: Secure session termination
- **Password Security**: Passwords are hashed using bcrypt (PHP's password_hash)

### 2. CRUD Operations for User Profile
- **Create**: User registration creates a new user record
- **Read**: Profile page displays user information
- **Update**: Users can edit their username, email, full name, and password
- **Delete**: Users can permanently delete their accounts with confirmation

### 3. Theme Toggle
- **Light/Dark Mode**: Users can switch between light and dark themes
- **Persistence**: Theme preference is saved in browser localStorage
- **Smooth Transitions**: CSS transitions for seamless theme changes
- **Icon Updates**: Theme toggle button icon changes (🌙/☀️)

### 4. Ajax-Powered Interface
- **No Page Reloads**: All form submissions use Ajax (Fetch API)
- **Real-time Feedback**: Success/error messages without page refresh
- **Smooth Navigation**: Dynamic content updates

### 5. Modular Architecture
- **Separated Components**: Header, footer, navbar, and marquee are in separate files
- **Easy Maintenance**: Changes to shared components affect all pages
- **Reusability**: Include files can be used across the application

### 6. Responsive Design
- **Mobile-Friendly**: Works on phones, tablets, and desktops
- **CSS Grid & Flexbox**: Modern layout techniques
- **Adaptive Navigation**: Navbar adjusts to screen size

### 7. Scrolling Marquee
- **Animated Banner**: CSS animation for continuous scrolling
- **Welcome Messages**: Displays multiple informational messages

## Security Features

1. **Password Hashing**: bcrypt algorithm with automatic salt generation
2. **SQL Injection Prevention**: Prepared statements for all database queries
3. **Session Management**: PHP sessions for user authentication
4. **Input Validation**: Server-side validation for all user inputs
5. **XSS Prevention**: Output escaping with htmlspecialchars()

## Database Schema

### Users Table
- `id`: Auto-incrementing primary key
- `username`: Unique username (max 50 chars)
- `email`: Unique email address (max 100 chars)
- `password`: Hashed password (255 chars)
- `full_name`: User's full name (max 100 chars)
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp

## File Structure

```
Oct23-p3/
├── api/                  # Backend API endpoints
│   ├── login.php        # Handles user login
│   ├── logout.php       # Handles user logout
│   ├── register.php     # Handles user registration
│   └── profile.php      # Handles profile CRUD operations
├── config/
│   └── database.php     # Database configuration and initialization
├── css/
│   └── style.css        # Main stylesheet with theme variables
├── includes/            # Reusable components
│   ├── header.php       # Page header with meta tags
│   ├── footer.php       # Page footer with scripts
│   ├── navbar.php       # Navigation bar with auth state
│   └── marquee.php      # Scrolling message banner
├── js/
│   ├── theme.js         # Theme toggle functionality
│   └── ajax.js          # Ajax helper functions
├── index.php            # Homepage
├── login.php            # Login page
├── register.php         # Registration page
└── profile.php          # User profile page
```

## API Endpoints

### POST /api/login.php
Authenticates a user and creates a session.

**Parameters:**
- username: Username or email
- password: User's password

**Response:**
```json
{
  "success": true/false,
  "message": "Success or error message"
}
```

### POST /api/register.php
Creates a new user account.

**Parameters:**
- username: Desired username
- email: Email address
- full_name: User's full name
- password: Desired password

**Response:**
```json
{
  "success": true/false,
  "message": "Success or error message"
}
```

### GET /api/profile.php?action=read
Retrieves current user's profile information.

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "full_name": "Test User",
    "created_at": "2025-10-23 20:00:00"
  }
}
```

### POST /api/profile.php (action=update)
Updates current user's profile.

**Parameters:**
- action: "update"
- username: New username
- email: New email
- full_name: New full name
- password: New password (optional)

**Response:**
```json
{
  "success": true/false,
  "message": "Success or error message"
}
```

### DELETE /api/profile.php?action=delete
Deletes current user's account.

**Response:**
```json
{
  "success": true/false,
  "message": "Success or error message"
}
```

### POST /api/logout.php
Logs out the current user by destroying the session.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Usage Guide

### For Users

1. **Register**: Click "Register" in the navbar, fill in the form, and submit
2. **Login**: Click "Login", enter your credentials, and submit
3. **View Profile**: After logging in, click "Profile" to see your information
4. **Edit Profile**: Click "Edit Profile", modify fields, and click "Update Profile"
5. **Delete Account**: Click "Delete Account" and confirm (this is permanent)
6. **Change Theme**: Click the theme toggle button (🌙/☀️) in the navbar
7. **Logout**: Click "Logout (username)" in the navbar

### For Developers

1. **Add New Pages**: Create PHP file, include header/navbar/footer
2. **Modify Components**: Edit files in `includes/` directory
3. **Add Styles**: Update `css/style.css` with theme variables
4. **Add API Endpoints**: Create new file in `api/` directory
5. **Update Database**: Modify `config/database.php` schema

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Requirements

- PHP 7.4+
- MySQL 5.7+
- Web server (Apache/Nginx)
- Modern web browser with JavaScript enabled

## Future Enhancements

Potential features for future development:
- Email verification
- Password reset functionality
- User avatars/profile pictures
- Two-factor authentication
- Activity logs
- Admin panel
- Social login integration

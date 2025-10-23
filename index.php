<?php
require_once 'config/database.php';

// Initialize database
initDatabase();

$pageTitle = 'Home - WebApp';
include 'includes/header.php';
include 'includes/navbar.php';
include 'includes/marquee.php';
?>

<main class="main-content">
    <div class="container">
        <section class="hero">
            <h1>Welcome to WebApp</h1>
            <p>A modern web application with user authentication and profile management</p>
        </section>
        
        <section class="features">
            <h2>Features</h2>
            <div class="features-grid">
                <div class="feature-card">
                    <h3>🔐 User Authentication</h3>
                    <p>Secure login and registration system</p>
                </div>
                <div class="feature-card">
                    <h3>👤 Profile Management</h3>
                    <p>Complete CRUD operations for user profiles</p>
                </div>
                <div class="feature-card">
                    <h3>🌓 Theme Toggle</h3>
                    <p>Switch between light and dark modes</p>
                </div>
                <div class="feature-card">
                    <h3>⚡ Ajax Powered</h3>
                    <p>Smooth, dynamic user experience</p>
                </div>
            </div>
        </section>
    </div>
</main>

<?php include 'includes/footer.php'; ?>

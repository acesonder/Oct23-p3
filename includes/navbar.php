<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
$isLoggedIn = isset($_SESSION['user_id']);
$username = $isLoggedIn ? $_SESSION['username'] : '';
?>
<nav class="navbar">
    <div class="navbar-container">
        <div class="navbar-brand">
            <a href="index.php">WebApp</a>
        </div>
        <ul class="navbar-menu">
            <li><a href="index.php">Home</a></li>
            <?php if ($isLoggedIn): ?>
                <li><a href="profile.php">Profile</a></li>
                <li><a href="#" id="logoutBtn">Logout (<?php echo htmlspecialchars($username); ?>)</a></li>
            <?php else: ?>
                <li><a href="login.php">Login</a></li>
                <li><a href="register.php">Register</a></li>
            <?php endif; ?>
            <li>
                <button id="themeToggle" class="theme-toggle" title="Toggle Theme">
                    <span class="theme-icon">🌙</span>
                </button>
            </li>
        </ul>
    </div>
</nav>

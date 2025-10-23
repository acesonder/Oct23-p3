<?php
session_start();
require_once '../config/database.php';

header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit();
}

$user_id = $_SESSION['user_id'];
$conn = getDBConnection();

// READ - Get user profile
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'read') {
    $stmt = $conn->prepare("SELECT id, username, email, full_name, created_at FROM users WHERE id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();
        echo json_encode(['success' => true, 'user' => $user]);
    } else {
        echo json_encode(['success' => false, 'message' => 'User not found']);
    }
    
    $stmt->close();
    $conn->close();
    exit();
}

// UPDATE - Update user profile
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update') {
    $username = trim($_POST['username'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $full_name = trim($_POST['full_name'] ?? '');
    $password = $_POST['password'] ?? '';
    
    if (empty($username) || empty($email)) {
        echo json_encode(['success' => false, 'message' => 'Username and email are required']);
        exit();
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Invalid email format']);
        exit();
    }
    
    // Check if username is taken by another user
    $stmt = $conn->prepare("SELECT id FROM users WHERE username = ? AND id != ?");
    $stmt->bind_param("si", $username, $user_id);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'Username already taken']);
        $stmt->close();
        $conn->close();
        exit();
    }
    $stmt->close();
    
    // Check if email is taken by another user
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
    $stmt->bind_param("si", $email, $user_id);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'Email already taken']);
        $stmt->close();
        $conn->close();
        exit();
    }
    $stmt->close();
    
    // Update profile
    if (!empty($password)) {
        if (strlen($password) < 6) {
            echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters']);
            exit();
        }
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $conn->prepare("UPDATE users SET username = ?, email = ?, full_name = ?, password = ? WHERE id = ?");
        $stmt->bind_param("ssssi", $username, $email, $full_name, $hashed_password, $user_id);
    } else {
        $stmt = $conn->prepare("UPDATE users SET username = ?, email = ?, full_name = ? WHERE id = ?");
        $stmt->bind_param("sssi", $username, $email, $full_name, $user_id);
    }
    
    if ($stmt->execute()) {
        $_SESSION['username'] = $username; // Update session
        echo json_encode(['success' => true, 'message' => 'Profile updated successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Update failed. Please try again.']);
    }
    
    $stmt->close();
    $conn->close();
    exit();
}

// DELETE - Delete user account
if ($_SERVER['REQUEST_METHOD'] === 'DELETE' || (isset($_GET['action']) && $_GET['action'] === 'delete')) {
    $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
    $stmt->bind_param("i", $user_id);
    
    if ($stmt->execute()) {
        session_destroy();
        echo json_encode(['success' => true, 'message' => 'Account deleted successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Delete failed. Please try again.']);
    }
    
    $stmt->close();
    $conn->close();
    exit();
}

echo json_encode(['success' => false, 'message' => 'Invalid request']);
$conn->close();
?>

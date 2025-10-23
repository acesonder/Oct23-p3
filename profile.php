<?php
session_start();
require_once 'config/database.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit();
}

$pageTitle = 'Profile - WebApp';
include 'includes/header.php';
include 'includes/navbar.php';
?>

<main class="main-content">
    <div class="container">
        <div class="profile-container">
            <h1>User Profile</h1>
            
            <!-- Display User Information -->
            <div id="profileDisplay" class="profile-display">
                <div id="profileInfo" class="profile-info">
                    <p><strong>Loading...</strong></p>
                </div>
                <div class="profile-actions">
                    <button id="editProfileBtn" class="btn btn-primary">Edit Profile</button>
                    <button id="deleteAccountBtn" class="btn btn-danger">Delete Account</button>
                </div>
            </div>
            
            <!-- Edit Profile Form (hidden by default) -->
            <div id="editProfileForm" class="edit-profile-form" style="display: none;">
                <h2>Edit Profile</h2>
                <div id="editMessage" class="message"></div>
                <form id="updateProfileForm">
                    <div class="form-group">
                        <label for="edit_username">Username:</label>
                        <input type="text" id="edit_username" name="username" required>
                    </div>
                    <div class="form-group">
                        <label for="edit_email">Email:</label>
                        <input type="email" id="edit_email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="edit_full_name">Full Name:</label>
                        <input type="text" id="edit_full_name" name="full_name" required>
                    </div>
                    <div class="form-group">
                        <label for="edit_password">New Password (leave blank to keep current):</label>
                        <input type="password" id="edit_password" name="password">
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Update Profile</button>
                        <button type="button" id="cancelEditBtn" class="btn btn-secondary">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</main>

<?php include 'includes/footer.php'; ?>

<script>
// Load user profile data
function loadProfile() {
    fetch('api/profile.php?action=read')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const user = data.user;
                document.getElementById('profileInfo').innerHTML = `
                    <div class="profile-field">
                        <strong>Username:</strong> ${user.username}
                    </div>
                    <div class="profile-field">
                        <strong>Email:</strong> ${user.email}
                    </div>
                    <div class="profile-field">
                        <strong>Full Name:</strong> ${user.full_name || 'Not set'}
                    </div>
                    <div class="profile-field">
                        <strong>Member Since:</strong> ${new Date(user.created_at).toLocaleDateString()}
                    </div>
                `;
                
                // Populate edit form
                document.getElementById('edit_username').value = user.username;
                document.getElementById('edit_email').value = user.email;
                document.getElementById('edit_full_name').value = user.full_name || '';
            }
        })
        .catch(error => console.error('Error:', error));
}

// Show edit form
document.getElementById('editProfileBtn').addEventListener('click', function() {
    document.getElementById('profileDisplay').style.display = 'none';
    document.getElementById('editProfileForm').style.display = 'block';
});

// Cancel edit
document.getElementById('cancelEditBtn').addEventListener('click', function() {
    document.getElementById('editProfileForm').style.display = 'none';
    document.getElementById('profileDisplay').style.display = 'block';
    document.getElementById('editMessage').textContent = '';
});

// Update profile
document.getElementById('updateProfileForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    formData.append('action', 'update');
    
    fetch('api/profile.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        const messageDiv = document.getElementById('editMessage');
        if (data.success) {
            messageDiv.className = 'message success';
            messageDiv.textContent = data.message;
            setTimeout(() => {
                loadProfile();
                document.getElementById('editProfileForm').style.display = 'none';
                document.getElementById('profileDisplay').style.display = 'block';
                messageDiv.textContent = '';
            }, 1500);
        } else {
            messageDiv.className = 'message error';
            messageDiv.textContent = data.message;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('editMessage').className = 'message error';
        document.getElementById('editMessage').textContent = 'An error occurred. Please try again.';
    });
});

// Delete account
document.getElementById('deleteAccountBtn').addEventListener('click', function() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        fetch('api/profile.php?action=delete', {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
                window.location.href = 'index.php';
            } else {
                alert(data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        });
    }
});

// Load profile on page load
loadProfile();
</script>

// Ajax Functions
document.addEventListener('DOMContentLoaded', function() {
    // Logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (confirm('Are you sure you want to logout?')) {
                fetch('/api/logout.php', {
                    method: 'POST'
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        window.location.href = '/index.php';
                    } else {
                        alert('Logout failed. Please try again.');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('An error occurred. Please try again.');
                });
            }
        });
    }
});

// Helper function for Ajax requests
function ajaxRequest(url, method, data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (data) {
        if (data instanceof FormData) {
            delete options.headers['Content-Type'];
            options.body = data;
        } else {
            options.body = JSON.stringify(data);
        }
    }
    
    return fetch(url, options)
        .then(response => response.json())
        .catch(error => {
            console.error('Ajax error:', error);
            throw error;
        });
}

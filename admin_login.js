document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const password = document.getElementById('adminPassword').value;

    const response = await fetch('verify_admin.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `password=${encodeURIComponent(password)}`
    });

    const result = await response.text();

    if (result === 'success') {
        // Store login state in sessionStorage (optional)
        sessionStorage.setItem('adminLoggedIn', 'true');
        window.location.href = 'admin.html';
    } else {
        const errorDiv = document.getElementById('error');
        errorDiv.textContent = 'Incorrect password. Redirecting...';
        errorDiv.style.color = 'red';
        setTimeout(() => {
            sessionStorage.removeItem('adminLoggedIn');
            window.location.href = 'index.html';
        }, 2000);
    }
});

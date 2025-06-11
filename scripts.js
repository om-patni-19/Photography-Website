// Handle Star Rating
let selectedRating = 0;
const stars = document.querySelectorAll('#star-rating span');

// Add event listeners to each star
stars.forEach((star, index) => {
    star.addEventListener('click', () => {
        selectedRating = index + 1; // index is 0-based
        updateStarColors();
    });

    star.addEventListener('mouseover', () => {
        highlightStars(index + 1);
    });

    star.addEventListener('mouseout', () => {
        highlightStars(selectedRating);
    });
});

// Highlight stars up to the given rating
function highlightStars(rating) {
    stars.forEach((star, idx) => {
        if (idx < rating) {
            star.classList.add('hovered');
        } else {
            star.classList.remove('hovered');
        }
    });
}

// Set selected stars based on click
function updateStarColors() {
    stars.forEach((star, idx) => {
        star.classList.toggle('selected', idx < selectedRating);
    });
    highlightStars(selectedRating);
}


// Handle Form Submission
document.getElementById('review-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const feedback = document.getElementById('feedback').value.trim();

    if (name === '' || feedback === '' || selectedRating === 0) {
        alert('Please fill out all fields and select your rating.');
        return;
    }

    const reviewData = {
        name: name,
        rating: selectedRating,
        feedback: feedback
    };

    fetch('submit_review.php', {
        method: 'POST',
        body: JSON.stringify(reviewData),
        headers: {
            'Content-Type': 'application/json'
        },
        cache: 'no-store'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            addReviewToPage(reviewData);
            document.getElementById('review-form').reset();
            selectedRating = 0;
            updateStarColors();
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
});

// Add review directly to page without refreshing
function addReviewToPage(review) {
    const reviewsContainer = document.getElementById('reviews-container');

    const reviewItem = document.createElement('div');
    reviewItem.classList.add('review-item');

    const nameElement = document.createElement('strong');
    nameElement.textContent = review.name;

    const ratingElement = document.createElement('p');
    ratingElement.innerHTML = 'Rating: ' + '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);

    const feedbackElement = document.createElement('p');
    feedbackElement.textContent = review.feedback;

    reviewItem.appendChild(nameElement);
    reviewItem.appendChild(ratingElement);
    reviewItem.appendChild(feedbackElement);

    reviewsContainer.prepend(reviewItem);
}

// Load existing reviews
function fetchReviews() {
    fetch('data/reviews.json', { cache: 'no-store' })
    .then(response => response.json())
    .then(data => {
        const reviewsContainer = document.getElementById('reviews-container');

        if (Array.isArray(data) && data.length > 0) {
            reviewsContainer.innerHTML = ''; // Clear old content (including 'No reviews yet.')
            data.reverse().forEach(addReviewToPage);
        } else {
            reviewsContainer.innerHTML = '<p class="no-reviews">No reviews yet.</p>';
        }
    })
    .catch(error => {
        console.error('Error fetching reviews:', error);
    });
}


// Initial load
fetchReviews();

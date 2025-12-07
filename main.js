// Constants
const DAY_MAP = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const TODAY_INDEX = new Date().getDay();
const TODAY_NAME = DAY_MAP[TODAY_INDEX];

// Utility Functions
const normalizeText = (text) => text.toLowerCase().trim();

const getShowtimesForDay = (movie, day) => {
  const dayKey = day === 'today' ? TODAY_NAME : day;
  return (movie.showtimes[dayKey] || []).join(', ');
};

const toggleElement = (element, show) => {
  element.style.display = show ? '' : 'none';
};

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initFooter();
  initFAQ();
  initMovieScroll();
  initMoviesPage();
  initSchedulePage();
  initTicketsPage();
});

// Footer: Current year
function initFooter() {
  const yearSpan = document.getElementById('current-year');
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();
}

// About page: FAQ accordion
function initFAQ() {
  const faqQuestions = document.querySelectorAll('.faq-question');
  faqQuestions.forEach((button) => {
    button.addEventListener('click', () => {
      button.closest('.faq-item')?.classList.toggle('open');
    });
  });
}

// Handle scroll to movie on movies page
function initMovieScroll() {
  if (!window.location.hash || !document.getElementById('movies-list')) return;

  setTimeout(() => {
    const movieId = window.location.hash.substring(1);
    const movieCard = document.querySelector(`[data-movie-id="${movieId}"]`);
    if (movieCard) {
      movieCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      movieCard.style.animation = 'highlight 2s ease';
    }
  }, 500);
}

// Movies page
function initMoviesPage() {
  const moviesList = document.getElementById('movies-list');
  if (!moviesList || !window.MOVIES) return;

  const searchInput = document.getElementById('movie-search');
  const genreSelect = document.getElementById('genre-filter');
  const sortSelect = document.getElementById('sort-options');
  const orderSelect = document.getElementById('sort-order');
  const dayButtons = document.querySelectorAll('.day-btn');

  let movieCards = [];
  let selectedDay = 'today';

  // Set today as active
  document.querySelector('.day-btn[data-day="today"]')?.classList.add('active');

  // Day button handlers
  dayButtons.forEach((button) => {
    button.addEventListener('click', () => {
      dayButtons.forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');
      selectedDay = button.dataset.day;
      renderMovies();
    });
  });

  // Render movies
  function renderMovies() {
    moviesList.innerHTML = window.MOVIES.map((movie) => {
      const showtimes = getShowtimesForDay(movie, selectedDay);
      return createMovieCard(movie, showtimes);
    }).join('');

    movieCards = Array.from(moviesList.querySelectorAll('.movie-card'));
    attachMovieCardHandlers();
    applyFiltersAndSort();
  }

  // Create movie card HTML
  function createMovieCard(movie, showtimes) {
    return `
      <article class="movie-card"
        data-movie-id="${movie.id}"
        data-genre="${movie.genre}"
        data-rating="${movie.rating}"
        data-runtime="${movie.runtime}"
        data-has-showtime="${showtimes ? 'yes' : 'no'}">
        <img src="${movie.image}" alt="${movie.alt}" />
        <div class="movie-info">
          <h3 class="movie-title">${movie.title}</h3>
          <p class="movie-meta">
            <span class="movie-genre">${movie.genreLabel}</span> |
            <span class="movie-rating">${movie.rating}</span> |
            <span class="movie-runtime">${movie.runtime} mins</span>
          </p>
          <p class="movie-showtimes">
            <strong>Showtimes:</strong> ${showtimes || 'No showtimes available'}
          </p>
          <div class="movie-actions">
            <button type="button" class="btn btn-secondary movie-toggle" aria-expanded="false">
              About Movie
            </button>
            <a href="tickets.html?movie=${encodeURIComponent(movie.title)}" 
               class="btn btn-secondary">
              Book tickets
            </a>
          </div>
          <div class="movie-description">
            <p>${movie.description}</p>
          </div>
        </div>
      </article>
    `;
  }

  // Attach event handlers to movie cards
  function attachMovieCardHandlers() {
    moviesList.querySelectorAll('.movie-toggle').forEach((button) => {
      button.addEventListener('click', () => {
        const card = button.closest('.movie-card');
        if (!card) return;

        const isOpen = card.classList.toggle('show-description');
        button.textContent = isOpen ? 'Hide' : 'About Movie';
        button.setAttribute('aria-expanded', String(isOpen));
      });
    });
  }

  // Apply filters and sorting
  function applyFiltersAndSort() {
    if (!movieCards.length) return;

    const searchValue = normalizeText(searchInput?.value || '');
    const selectedGenre = genreSelect?.value || 'all';
    const sortValue = sortSelect?.value || 'title';
    const sortOrder = orderSelect?.value || 'asc';

    // Filter cards
    movieCards.forEach((card) => {
      const title = normalizeText(
        card.querySelector('.movie-title')?.textContent || ''
      );
      const genre = card.dataset.genre || '';
      const hasShowtime = card.dataset.hasShowtime === 'yes';

      const matchesSearch = !searchValue || title.includes(searchValue);
      const matchesGenre = selectedGenre === 'all' || genre === selectedGenre;

      toggleElement(card, matchesSearch && matchesGenre && hasShowtime);
    });

    // Sort visible cards
    const visibleCards = movieCards.filter(
      (card) => card.style.display !== 'none'
    );
    sortCards(visibleCards, sortValue, sortOrder);
  }

  // Sort cards helper
  function sortCards(cards, sortBy, order = 'asc') {
    const multiplier = order === 'desc' ? -1 : 1;

    const sorted = [...cards].sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'title') {
        const titleA = normalizeText(
          a.querySelector('.movie-title')?.textContent || ''
        );
        const titleB = normalizeText(
          b.querySelector('.movie-title')?.textContent || ''
        );
        comparison = titleA.localeCompare(titleB);
      } else if (sortBy === 'rating') {
        const ratingA = a.dataset.rating || '';
        const ratingB = b.dataset.rating || '';
        comparison = ratingA.localeCompare(ratingB);
      } else if (sortBy === 'runtime') {
        const runtimeA = parseInt(a.dataset.runtime || '0', 10);
        const runtimeB = parseInt(b.dataset.runtime || '0', 10);
        comparison = runtimeA - runtimeB;
      }

      return comparison * multiplier;
    });

    sorted.forEach((card) => moviesList.appendChild(card));
  }

  // Event listeners for filters
  searchInput?.addEventListener('input', applyFiltersAndSort);
  genreSelect?.addEventListener('change', applyFiltersAndSort);
  sortSelect?.addEventListener('change', applyFiltersAndSort);
  orderSelect?.addEventListener('change', applyFiltersAndSort);

  // Initial render
  renderMovies();
}

// Schedule page
function initSchedulePage() {
  const scheduleDisplay = document.getElementById('schedule-display');
  const dayButtons = document.querySelectorAll('.day-button');
  if (!dayButtons.length || !scheduleDisplay || !window.MOVIES) return;

  const scheduleData = generateSchedule();
  const defaultDay = TODAY_NAME || 'fri';

  // Day button handlers
  dayButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const dayKey = button.dataset.day;
      if (!dayKey) return;

      dayButtons.forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');
      renderSchedule(dayKey);
    });
  });

  // Generate schedule from MOVIES data
  function generateSchedule() {
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const dayLabels = {
      mon: 'Monday',
      tue: 'Tuesday',
      wed: 'Wednesday',
      thu: 'Thursday',
      fri: 'Friday',
      sat: 'Saturday',
      sun: 'Sunday',
    };

    const schedule = {};

    days.forEach((day) => {
      schedule[day] = { label: dayLabels[day], entries: [] };

      window.MOVIES.forEach((movie) => {
        const times = movie.showtimes?.[day] || [];
        times.forEach((time) => {
          schedule[day].entries.push({
            time,
            screen: `Screen ${movie.screen || 1}`,
            movie: movie.title,
            rating: movie.rating,
          });
        });
      });

      // Sort by time
      schedule[day].entries.sort((a, b) => a.time.localeCompare(b.time));
    });

    return schedule;
  }

  // Render schedule for a specific day
  function renderSchedule(dayKey) {
    const data = scheduleData[dayKey];
    if (!data) return;

    const { label, entries } = data;

    if (!entries.length) {
      scheduleDisplay.innerHTML = '<p>No schedule available for this day.</p>';
      return;
    }

    // Group by movie
    const groupedByMovie = entries.reduce((acc, entry) => {
      if (!acc[entry.movie]) {
        acc[entry.movie] = {
          movie: entry.movie,
          rating: entry.rating,
          screen: entry.screen,
          times: [],
        };
      }
      acc[entry.movie].times.push(entry.time);
      return acc;
    }, {});

    // Convert to array and sort by first showtime
    const movieEntries = Object.values(groupedByMovie).sort((a, b) =>
      a.times[0].localeCompare(b.times[0])
    );

    const rows = movieEntries
      .map(
        (entry) => `
        <tr>
          <td>
            ${entry.movie}
            <span class="rating-badge">${entry.rating}</span>
          </td>
          <td>${entry.screen}</td>
          <td class="showtime-list">${entry.times.join(', ')}</td>
        </tr>
      `
      )
      .join('');

    scheduleDisplay.innerHTML = `
      <h3>${label} Showtimes</h3>
      <table class="schedule-table">
        <thead>
          <tr>
            <th>Movie</th>
            <th>Screen</th>
            <th>Showtimes</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  // Set default day
  const defaultButton = Array.from(dayButtons).find(
    (btn) => btn.dataset.day === defaultDay
  );
  if (defaultButton) {
    defaultButton.classList.add('active');
    renderSchedule(defaultDay);
  }
}

// Tickets page - Enhanced validation
function initTicketsPage() {
  const ticketForm = document.getElementById('ticket-form');
  if (!ticketForm || !window.MOVIES) return;

  const nameInput = document.getElementById('customer-name');
  const emailInput = document.getElementById('customer-email');
  const movieSelect = document.getElementById('movie-select');
  const showtimeSelect = document.getElementById('showtime-select');
  const qtySelect = document.getElementById('ticket-qty');
  const successMessage = document.getElementById('ticket-success-message');

  const errorElements = {
    name: document.getElementById('name-error'),
    email: document.getElementById('email-error'),
    movie: document.getElementById('movie-error'),
    showtime: document.getElementById('showtime-error'),
    qty: document.getElementById('qty-error'),
  };

  // Populate movie dropdown
  if (movieSelect) {
    movieSelect.innerHTML =
      '<option value="">Select a movie...</option>' +
      window.MOVIES.map(
        (movie) => `<option value="${movie.title}">${movie.title}</option>`
      ).join('');
  }

  // Pre-select movie from URL parameter
  const params = new URLSearchParams(window.location.search);
  const movieFromUrl = params.get('movie');
  if (movieFromUrl && movieSelect) {
    movieSelect.value = movieFromUrl;
    updateShowtimes(movieFromUrl);
  }

  // Update showtimes based on selected movie
  function updateShowtimes(movieTitle) {
    if (!showtimeSelect || !movieTitle) {
      if (showtimeSelect) {
        showtimeSelect.innerHTML =
          '<option value="">Select a showtime...</option>';
      }
      return;
    }

    const movie = window.MOVIES.find(
      (m) => m.title.toLowerCase() === movieTitle.toLowerCase()
    );

    if (movie?.showtimes) {
      // Get all unique showtimes across all days
      const allTimes = new Set();
      Object.values(movie.showtimes).forEach((dayTimes) => {
        dayTimes.forEach((time) => allTimes.add(time));
      });

      const times = Array.from(allTimes).sort();
      showtimeSelect.innerHTML =
        '<option value="">Select a showtime...</option>' +
        times
          .map((time) => `<option value="${time}">${time}</option>`)
          .join('');
    } else {
      showtimeSelect.innerHTML =
        '<option value="">No showtimes available</option>';
    }
  }

  // Movie selection change handler
  movieSelect?.addEventListener('change', (e) => {
    updateShowtimes(e.target.value);
    clearErrors();
  });

  // Real-time validation on input - shows errors as you type
  nameInput?.addEventListener('blur', (e) => {
    const error = validateName(e.target.value);
    const formRow = e.target.closest('.form-row');
    if (errorElements.name) {
      if (error) {
        errorElements.name.textContent = error;
        e.target.classList.add('input-error');
        e.target.classList.remove('input-success');
        formRow?.classList.remove('valid');
      } else if (e.target.value.trim()) {
        errorElements.name.textContent = '';
        e.target.classList.remove('input-error');
        e.target.classList.add('input-success');
        formRow?.classList.add('valid');
      }
    }
  });

  emailInput?.addEventListener('blur', (e) => {
    const error = validateEmail(e.target.value);
    const formRow = e.target.closest('.form-row');
    if (errorElements.email) {
      if (error) {
        errorElements.email.textContent = error;
        e.target.classList.add('input-error');
        e.target.classList.remove('input-success');
        formRow?.classList.remove('valid');
      } else if (e.target.value.trim()) {
        errorElements.email.textContent = '';
        e.target.classList.remove('input-error');
        e.target.classList.add('input-success');
        formRow?.classList.add('valid');
      }
    }
  });

  movieSelect?.addEventListener('change', (e) => {
    const formRow = e.target.closest('.form-row');
    if (!e.target.value && errorElements.movie) {
      errorElements.movie.textContent = 'Please select a movie.';
      e.target.classList.add('input-error');
      e.target.classList.remove('input-success');
      formRow?.classList.remove('valid');
    } else if (e.target.value && errorElements.movie) {
      errorElements.movie.textContent = '';
      e.target.classList.remove('input-error');
      e.target.classList.add('input-success');
      formRow?.classList.add('valid');
    }
  });

  showtimeSelect?.addEventListener('change', (e) => {
    const formRow = e.target.closest('.form-row');
    if (!e.target.value && errorElements.showtime) {
      errorElements.showtime.textContent = 'Please choose a showtime.';
      e.target.classList.add('input-error');
      e.target.classList.remove('input-success');
      formRow?.classList.remove('valid');
    } else if (e.target.value && errorElements.showtime) {
      errorElements.showtime.textContent = '';
      e.target.classList.remove('input-error');
      e.target.classList.add('input-success');
      formRow?.classList.add('valid');
    }
  });

  qtySelect?.addEventListener('change', (e) => {
    const formRow = e.target.closest('.form-row');
    if (!e.target.value && errorElements.qty) {
      errorElements.qty.textContent = 'Please choose how many seats you need.';
      e.target.classList.add('input-error');
      e.target.classList.remove('input-success');
      formRow?.classList.remove('valid');
    } else if (e.target.value && errorElements.qty) {
      errorElements.qty.textContent = '';
      e.target.classList.remove('input-error');
      e.target.classList.add('input-success');
      formRow?.classList.add('valid');
    }
  });

  // Clear all error messages
  function clearErrors() {
    Object.values(errorElements).forEach((el) => {
      if (el) el.textContent = '';
    });
    if (successMessage) successMessage.textContent = '';
  }

  // Validation helper functions
  function validateName(name) {
    if (!name || name.trim().length === 0) {
      return 'Please enter your full name.';
    }
    // Check for numbers or special symbols (allow letters, spaces, hyphens, apostrophes)
    const namePattern = /^[a-zA-Z\s'-]+$/;
    if (!namePattern.test(name)) {
      return 'Name can only contain letters, spaces, hyphens, and apostrophes.';
    }
    return '';
  }

  function validateEmail(email) {
    if (!email || email.trim().length === 0) {
      return 'Please enter your email address.';
    }
    // Check if email contains @ symbol
    if (!email.includes('@')) {
      return 'Please enter a valid email address (must contain @).';
    }
    // Check basic email format: something@something.something
    const emailParts = email.split('@');
    if (
      emailParts.length !== 2 ||
      emailParts[0].length === 0 ||
      emailParts[1].length === 0
    ) {
      return 'Please enter a valid email address.';
    }
    if (!emailParts[1].includes('.')) {
      return 'Please enter a valid email address (e.g., name@example.com).';
    }
    return '';
  }

  // Form submission
  ticketForm.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors();

    const values = {
      name: nameInput?.value || '',
      email: emailInput?.value || '',
      movie: movieSelect?.value || '',
      showtime: showtimeSelect?.value || '',
      qty: qtySelect?.value || '',
    };

    // Validation using if statements and conditions
    const errors = {
      name: validateName(values.name),
      email: validateEmail(values.email),
      movie: !values.movie ? 'Please select a movie.' : '',
      showtime: !values.showtime ? 'Please choose a showtime.' : '',
      qty: !values.qty ? 'Please choose how many seats you need.' : '',
    };

    let isValid = true;

    // Loop through errors array and display them
    const errorKeys = Object.keys(errors);
    for (let i = 0; i < errorKeys.length; i++) {
      const key = errorKeys[i];
      const message = errors[key];
      if (message && errorElements[key]) {
        errorElements[key].textContent = message;
        isValid = false;
      }
    }

    if (!isValid) return;

    // Success
    if (successMessage) {
      successMessage.textContent = `Thank you, ${values.name}! Your booking for "${values.movie}" at ${values.showtime} for ${values.qty} ticket(s) has been submitted. A confirmation email will be sent to ${values.email}.`;
    }

    ticketForm.reset();
  });
}

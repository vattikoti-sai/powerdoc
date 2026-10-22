import { useEffect, useState } from "react";
import "./App.css";
import {
  getStations,
  createBooking,
  getUserBookings,
  getUsers,
} from "./services/api";

function App() {
  const [location, setLocation] = useState("");
  const [activeTab, setActiveTab] = useState("stations");
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedStation, setSelectedStation] = useState(null);
  const [bookingDate, setBookingDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [mobile, setMobile] = useState("");
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  const [userId, setUserId] = useState("");
  const [bookings, setBookings] = useState([]);
  const [walletBalance, setWalletBalance] = useState(null);

  const today = new Date();

  const minimumDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  useEffect(() => {
    getStations()
      .then((response) => setStations(response.data))
      .catch((err) => {
        console.error("Error fetching stations:", err);
        setError(
          "Could not load stations. Check whether Spring Boot is running."
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredStations = stations.filter((station) =>
    `${station.name || ""} ${station.location || ""} ${
      station.address || ""
    }`
      .toLowerCase()
      .includes(location.trim().toLowerCase())
  );

  const hours =
    startTime && endTime
      ? (new Date(`2000-01-01T${endTime}`) -
          new Date(`2000-01-01T${startTime}`)) /
        3600000
      : 0;

  const bookingAmount = hours > 0 ? hours * 200 : 0;

  // Check whether a slot is later than the current time.
  const isFutureSlot = (hour) => {
    if (!bookingDate) return false;

    const [year, month, day] = bookingDate.split("-").map(Number);
    const slot = new Date(year, month - 1, day, hour, 0, 0, 0);

    return slot.getTime() > Date.now();
  };

  // End time must be in the future and later than the start time.
  const isValidEndSlot = (hour) => {
    if (!isFutureSlot(hour) || !startTime) return false;

    const [year, month, day] = bookingDate.split("-").map(Number);
    const [startHour, startMinute] = startTime.split(":").map(Number);

    const start = new Date(
      year,
      month - 1,
      day,
      startHour,
      startMinute,
      0,
      0
    );

    const end = new Date(year, month - 1, day, hour, 0, 0, 0);

    return end.getTime() > start.getTime();
  };

  const openBookingForm = (station) => {
    setSelectedStation(station);
    setBookingDate("");
    setStartTime("");
    setEndTime("");
    setBookingMessage("");
  };

  const handleBooking = async (event) => {
    event.preventDefault();
    setBookingMessage("");

    if (!mobile.trim()) {
      setBookingMessage("Please enter your registered mobile number.");
      return;
    }

    if (!bookingDate || !startTime || !endTime || hours <= 0) {
      setBookingMessage(
        "Select a valid date, start time, and end time."
      );
      return;
    }

    const [year, month, day] = bookingDate.split("-").map(Number);
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    const start = new Date(
      year,
      month - 1,
      day,
      startHour,
      startMinute,
      0,
      0
    );

    const end = new Date(
      year,
      month - 1,
      day,
      endHour,
      endMinute,
      0,
      0
    );

    const now = new Date();

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      setBookingMessage("Invalid booking date or time.");
      return;
    }

    // Start time must be later than the current time.
    if (start.getTime() <= now.getTime()) {
      setBookingMessage(
        "Start time must be later than the current time. Please choose a future slot."
      );
      return;
    }

    // End time must also be later than the current time.
    if (end.getTime() <= now.getTime()) {
      setBookingMessage(
        "End time must also be later than the current time."
      );
      return;
    }

    // Validate operating hours and booking duration.
    if (
      end.getTime() <= start.getTime() ||
      start.getHours() < 6 ||
      start.getHours() >= 23 ||
      end.getHours() > 23 ||
      start.getMinutes() !== 0 ||
      end.getMinutes() !== 0
    ) {
      setBookingMessage(
        "Choose a valid time between 6 AM and 11 PM, with the end time after the start time."
      );
      return;
    }

    setBookingLoading(true);

    try {
      const usersResponse = await getUsers();

      const user = usersResponse.data.find(
        (item) => String(item.mobile).trim() === mobile.trim()
      );

      if (!user) {
        setBookingMessage(
          "No user found for this mobile number. Register the user first using your backend or Postman."
        );
        return;
      }

      const response = await createBooking({
        userId: user.id,
        stationId: selectedStation.id,
        startTime: `${bookingDate}T${startTime}:00`,
        endTime: `${bookingDate}T${endTime}:00`,
      });

      setUserId(String(user.id));

      setWalletBalance(
        response.data.walletBalance ?? user.walletBalance ?? null
      );

      setBookingMessage("Booking successful!");
      setSelectedStation(null);

      alert("Booking successful! Your reservation has been saved.");

      try {
        const refreshedBookings = await getUserBookings(user.id);
        setBookings(refreshedBookings.data);
      } catch (refreshError) {
        console.error("Could not refresh bookings:", refreshError);
      }
    } catch (err) {
      console.error("Booking failed:", err.response?.data || err);

      const responseData = err.response?.data;

      setBookingMessage(
        responseData?.message ||
          (typeof responseData === "string" ? responseData : null) ||
          "Booking failed. Check the backend console for the exact error."
      );
    } finally {
      setBookingLoading(false);
    }
  };

  const loadMyBookings = async () => {
    if (!mobile.trim()) {
      setBookingMessage("Enter your mobile number first.");
      return;
    }

    try {
      const usersResponse = await getUsers();

      const user = usersResponse.data.find(
        (item) => String(item.mobile).trim() === mobile.trim()
      );

      if (!user) {
        setBookingMessage("User not found. Please check your mobile number.");
        return;
      }

      setUserId(String(user.id));
      setWalletBalance(user.walletBalance ?? null);

      const response = await getUserBookings(user.id);

      setBookings(response.data);
      setActiveTab("bookings");
      setBookingMessage("");
    } catch (err) {
      console.error("Could not load bookings:", err);
      setBookingMessage("Could not load bookings. Check the backend.");
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">⚡</div>
          <div>
            <h2>PowerDoc</h2>
            <span>EV CHARGING</span>
          </div>
        </div>

        <p className="menu-label">MENU</p>

        <button
          className={`nav-item ${
            activeTab === "stations" ? "active" : ""
          }`}
          onClick={() => setActiveTab("stations")}
        >
          <span>⌖</span> Find Stations
        </button>

        <button
          className={`nav-item ${
            activeTab === "bookings" ? "active" : ""
          }`}
          onClick={() => setActiveTab("bookings")}
        >
          <span>▦</span> My Bookings
        </button>

        <button
          className={`nav-item ${
            activeTab === "wallet" ? "active" : ""
          }`}
          onClick={() => setActiveTab("wallet")}
        >
          <span>▣</span> My Wallet
        </button>

        <div className="sidebar-bottom">
          <div className="help-icon">?</div>
          <div>
            <strong>Need help?</strong>
            <p>We're here to help you.</p>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">YOUR EV CHARGING COMPANION</p>
            <h1>
              {activeTab === "stations"
                ? "Find charging stations"
                : activeTab === "bookings"
                ? "My bookings"
                : "My wallet"}
            </h1>
          </div>

          <div className="profile">
            <div className="profile-avatar">EV</div>
            <div>
              <strong>Welcome!</strong>
              <p>EV Driver</p>
            </div>
          </div>
        </header>

        {activeTab === "stations" && (
          <>
            <section className="hero">
              <div className="hero-content">
                <span className="hero-tag">⚡ CHARGE SMARTER</span>
                <h2>Power your journey.</h2>
                <h2 className="hero-highlight">One charge at a time.</h2>

                <p>
                  Find a charging station near you and reserve your slot in
                  seconds.
                </p>

                <div className="search-box">
                  <span>⌕</span>
                  <input
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder="Search location, e.g. LB Nagar"
                  />
                  <button onClick={() => setLocation(location.trim())}>
                    Search
                  </button>
                </div>
              </div>

              <div className="hero-art">
                <div className="art-circle">
                  <div className="car">🚙</div>
                  <div className="charging-symbol">⚡</div>
                </div>
                <span className="art-caption">
                  DRIVE ELECTRIC. DRIVE FORWARD.
                </span>
              </div>
            </section>

            <section className="stats">
              <div className="stat-card">
                <div className="stat-icon green">⌖</div>
                <div>
                  <p>Stations listed</p>
                  <h3>{stations.length}</h3>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon blue">⚡</div>
                <div>
                  <p>Charging rate</p>
                  <h3>
                    ₹200 <small>/ hour</small>
                  </h3>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon orange">◷</div>
                <div>
                  <p>Operating hours</p>
                  <h3>6 AM – 11 PM</h3>
                </div>
              </div>
            </section>

            <section className="station-section">
              <div className="section-heading">
                <div>
                  <h2>Charging stations</h2>
                  <p>Choose a station to plan your next charge.</p>
                </div>

                <span className="result-count">
                  {loading
                    ? "Loading..."
                    : `${filteredStations.length} results`}
                </span>
              </div>

              {loading && (
                <p className="empty-state">Loading charging stations...</p>
              )}

              {!loading && error && (
                <p className="empty-state">{error}</p>
              )}

              {!loading && !error && (
                <div className="station-grid">
                  {filteredStations.map((station) => (
                    <article className="station-card" key={station.id}>
                      <div className="station-image">
                        <div className="station-image-icon">⚡</div>
                        <span className="available-badge">● Station</span>
                      </div>

                      <div className="station-details">
                        <span className="station-location">
                          ⌖{" "}
                          {station.location ||
                            station.address ||
                            "Location not specified"}
                        </span>

                        <h3>{station.name}</h3>

                        <p className="address">
                          {station.address || "Address not available"}
                        </p>

                        <div className="station-footer">
                          <span>⚡ Charging station</span>
                          <button onClick={() => openBookingForm(station)}>
                            Book slot <span>→</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}

                  {filteredStations.length === 0 && (
                    <p className="empty-state">
                      No stations found for this location.
                    </p>
                  )}
                </div>
              )}
            </section>
          </>
        )}

        {selectedStation && (
          <div className="booking-overlay">
            <section className="booking-form-panel">
              <button
                type="button"
                className="booking-close"
                onClick={() => setSelectedStation(null)}
              >
                ✕
              </button>

              <h2>Reserve your charging slot</h2>
              <p>{selectedStation.name}</p>
              <p>{selectedStation.address}</p>

              <form onSubmit={handleBooking}>
                <label>Registered mobile number</label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(event) => setMobile(event.target.value)}
                  placeholder="Enter your registered mobile"
                  required
                />

                <label>Booking date</label>
                <input
                  type="date"
                  value={bookingDate}
                  min={minimumDate}
                  onChange={(event) => {
                    setBookingDate(event.target.value);
                    setStartTime("");
                    setEndTime("");
                    setBookingMessage("");
                  }}
                  required
                />

                <label>Start time</label>
                <select
                  value={startTime}
                  onChange={(event) => {
                    setStartTime(event.target.value);
                    setEndTime("");
                    setBookingMessage("");
                  }}
                  required
                >
                  <option value="">Select start time</option>

                  {Array.from({ length: 17 }, (_, index) => index + 6).map(
                    (hour) => (
                      <option
                        key={hour}
                        value={`${String(hour).padStart(2, "0")}:00`}
                        disabled={!isFutureSlot(hour)}
                      >
                        {hour > 12
                          ? `${hour - 12}:00 PM`
                          : hour === 12
                          ? "12:00 PM"
                          : `${hour}:00 AM`}
                      </option>
                    )
                  )}
                </select>

                <label>End time</label>
                <select
                  value={endTime}
                  onChange={(event) => {
                    setEndTime(event.target.value);
                    setBookingMessage("");
                  }}
                  required
                >
                  <option value="">Select end time</option>

                  {Array.from({ length: 17 }, (_, index) => index + 7).map(
                    (hour) => (
                      <option
                        key={hour}
                        value={`${String(hour).padStart(2, "0")}:00`}
                        disabled={!isValidEndSlot(hour)}
                      >
                        {hour > 12
                          ? `${hour - 12}:00 PM`
                          : hour === 12
                          ? "12:00 PM"
                          : `${hour}:00 AM`}
                      </option>
                    )
                  )}
                </select>

                <div className="booking-price">
                  <span>Duration</span>
                  <strong>
                    {hours > 0 ? `${hours} hour(s)` : "—"}
                  </strong>

                  <span>Estimated amount</span>
                  <strong>₹{bookingAmount}</strong>
                </div>

                {bookingMessage && <p role="alert">{bookingMessage}</p>}

                <button type="submit" disabled={bookingLoading}>
                  {bookingLoading
                    ? "Booking..."
                    : `Confirm booking · ₹${bookingAmount}`}
                </button>
              </form>
            </section>
          </div>
        )}

        {activeTab === "bookings" && (
          <section className="placeholder-panel">
            <h2>Your bookings</h2>

            <label>Enter the mobile number used for registration</label>
            <input
              type="tel"
              value={mobile}
              onChange={(event) => setMobile(event.target.value)}
              placeholder="Registered mobile number"
            />

            <button className="primary-button" onClick={loadMyBookings}>
              Load my bookings
            </button>

            {bookingMessage && <p role="alert">{bookingMessage}</p>}

            {bookings.length === 0 ? (
              <p>No bookings loaded yet.</p>
            ) : (
              bookings.map((booking) => (
                <article key={booking.id} className="station-card">
                  <div className="station-details">
                    <h3>Booking #{booking.id}</h3>
                    <p>Station ID: {booking.stationId}</p>
                    <p>Start: {booking.startTime}</p>
                    <p>End: {booking.endTime}</p>
                    <p>Amount: ₹{booking.amount}</p>
                    <p>Status: {booking.status}</p>
                  </div>
                </article>
              ))
            )}
          </section>
        )}

        {activeTab === "wallet" && (
          <section className="wallet-panel">
            <div className="wallet-card">
              <p>VIRTUAL WALLET</p>
              <span>Available balance</span>

              <h2>
                {walletBalance == null
                  ? "₹1,000.00*"
                  : `₹${Number(walletBalance).toFixed(2)}`}
              </h2>

              <div className="wallet-footer">
                PowerDoc Wallet <span>⚡</span>
              </div>
            </div>

            <div className="wallet-info">
              <h2>Manage your wallet</h2>

              <p>
                Booking charges are ₹200 per hour. The actual wallet balance
                is managed by your backend.
              </p>

              <label>Registered mobile number</label>
              <input
                type="tel"
                value={mobile}
                onChange={(event) => setMobile(event.target.value)}
                placeholder="Enter registered mobile"
              />

              <button className="primary-button" onClick={loadMyBookings}>
                Load account
              </button>

              {bookingMessage && <p role="alert">{bookingMessage}</p>}
            </div>
          </section>
        )}

        <footer className="footer">
          <span>© 2026 PowerDoc</span>
          <span>Clean energy. Smarter journeys. ⚡</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
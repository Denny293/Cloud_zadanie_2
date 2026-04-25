export default function MainPage() {
  const destinations = [
    {
      title: "Карпати",
      text: "Гори, свіже повітря, затишні будиночки та маршрути для активного відпочинку.",
    },
    {
      title: "Італія",
      text: "Море, архітектура, атмосфера старих міст і справжня середземноморська кухня.",
    },
    {
      title: "Балі",
      text: "Тропічний релакс, теплий океан, зелені пейзажі та спокійний ритм життя.",
    },
  ];

  const benefits = [
    {
      title: "Готові тури",
      text: "Підбираємо маршрути, проживання та переліт в одному рішенні.",
    },
    {
      title: "Зручне планування",
      text: "Прості умови бронювання та зрозуміла структура подорожі без хаосу.",
    },
    {
      title: "Підтримка 24/7",
      text: "Допомагаємо до поїздки, під час подорожі та після повернення.",
    },
  ];

  return (
    <main className="main-page">
      <section className="hero">
        <header className="header container">
          <div className="logo">СРАКА - ЛОГО</div>

          <nav className="nav">
            <a href="#destinations">Напрямки</a>
            <a href="#about">Про нас</a>
            <a href="#contact">Контакти</a>
          </nav>

          <div className="header-actions">
            <button className="btn btn-secondary">Login</button>
            <button className="btn btn-primary">Sign Up</button>
          </div>
        </header>

        <div className="hero-content container">
          <div className="hero-text">
            <p className="hero-badge">Туристичне агентство</p>
            <h1>Подорожі, які хочеться згадувати ще довго</h1>
            <p className="hero-description">
              Відкрий для себе нові міста, гори, море та незабутні враження.
              Ми допоможемо знайти подорож, яка дійсно підходить саме тобі.
            </p>

            <div className="hero-buttons">
              <button className="btn btn-primary">Обрати тур</button>
              <button className="btn btn-outline">Дізнатись більше</button>
            </div>

            <div className="hero-stats">
              <div className="stat-card">
                <strong>250+</strong>
                <span>успішних турів</span>
              </div>
              <div className="stat-card">
                <strong>40+</strong>
                <span>напрямків</span>
              </div>
              <div className="stat-card">
                <strong>24/7</strong>
                <span>підтримка</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-card hero-card-main">
              <p>Найкращі маршрути</p>
              <h3>Літо 2026</h3>
              <span>Море, гори, екскурсії та city-break</span>
            </div>

            <div className="hero-card hero-card-small top">
              <strong>Знижки</strong>
              <span>до -20% на раннє бронювання</span>
            </div>

            <div className="hero-card hero-card-small bottom">
              <strong>Комфорт</strong>
              <span>Підбір туру за бюджетом і стилем відпочинку</span>
            </div>
          </div>
        </div>
      </section>

      <section className="benefits section container" id="about">
        <div className="section-heading">
          <p className="section-label">Чому саме ми</p>
          <h2>Робимо подорожі простішими та приємнішими</h2>
        </div>

        <div className="benefits-grid">
          {benefits.map((item) => (
            <article className="info-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="destinations section container" id="destinations">
        <div className="section-heading">
          <p className="section-label">Популярні напрямки</p>
          <h2>Обери місце, куди хочеться вже зараз</h2>
        </div>

        <div className="destinations-grid">
          {destinations.map((place) => (
            <article className="destination-card" key={place.title}>
              <div className="destination-image" />
              <div className="destination-content">
                <h3>{place.title}</h3>
                <p>{place.text}</p>
                <button className="link-button">Переглянути</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="cta section container" id="contact">
        <div className="cta-box">
          <div>
            <p className="section-label">Готовий до нових вражень?</p>
            <h2>Знайдемо подорож, яка реально тобі підійде</h2>
            <p className="cta-text">
              Напиши нам, і ми підберемо варіант під твій бюджет, дати та
              побажання.
            </p>
          </div>

          <div className="cta-actions">
            <button className="btn btn-primary">Залишити заявку</button>
            <button className="btn btn-secondary">Зв’язатися</button>
          </div>
        </div>
      </section>
    </main>
  );
}